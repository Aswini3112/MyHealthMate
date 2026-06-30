import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dbStore } from '../dbStore';
import { abdmGateway, simulateOCRAndExtraction, simulateBedrockChat } from '../services/mocks';
import personalDetailsRouter from './personalDetails';


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'myhealthmate_secret_jwt_key_2026';

// Configure Multer for local uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Helper to sign JWT
const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Seed health metrics from OCR extracted lab values
async function seedMetricsFromExtractedData(patientId: string, extractedData: any, recordedDate?: Date) {
  const date = recordedDate || new Date(extractedData?.dateOfRecord || new Date());

  if (extractedData?.labValues?.length) {
    for (const item of extractedData.labValues) {
      const param = item.parameter.toLowerCase();
      let typeKey: string | undefined;
      if (param.includes('sugar') || param.includes('glucose') || param.includes('hba1c')) {
        typeKey = 'glucose';
      } else if (param.includes('cholesterol') || param.includes('ldl')) {
        typeKey = 'cholesterol';
      }
      if (typeKey) {
        await dbStore.metrics.create({
          patientId,
          metricType: typeKey,
          value: item.value,
          unit: item.unit,
          recordedDate: date,
          normalRangeMin: typeKey === 'glucose' ? 70 : 100,
          normalRangeMax: typeKey === 'glucose' ? 140 : 200
        });
      }
    }
  }

  if (extractedData?.medications?.length) {
    await dbStore.metrics.create({
      patientId,
      metricType: 'medication_adherence',
      value: 92,
      unit: '%',
      recordedDate: date,
      normalRangeMin: 80,
      normalRangeMax: 100
    });
  }
}

// Seed demo vitals for pre-seeded ABHA demo patient
async function seedDemoVitals(patientId: string) {
  const demoVitals = [
    { metricType: 'glucose', value: 142, unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 140 },
    { metricType: 'bp_systolic', value: 138, unit: 'mmHg', normalRangeMin: 90, normalRangeMax: 120 },
    { metricType: 'bp_diastolic', value: 88, unit: 'mmHg', normalRangeMin: 60, normalRangeMax: 80 },
    { metricType: 'weight', value: 78, unit: 'kg', normalRangeMin: 50, normalRangeMax: 85 },
    { metricType: 'cholesterol', value: 210, unit: 'mg/dL', normalRangeMin: 100, normalRangeMax: 200 }
  ];

  for (const v of demoVitals) {
    await dbStore.metrics.create({
      patientId,
      ...v,
      recordedDate: new Date()
    });
  }
}

// ==========================================
// 1. AUTH & ABHA ROUTES
// ==========================================

// ABDM Login - Step 1: Request OTP
router.post('/auth/login-abha', async (req: Request, res: Response) => {
  try {
    const { abhaId } = req.body;
    if (!abhaId) {
      return res.status(400).json({ success: false, message: 'ABHA ID is required.' });
    }
    const result = abdmGateway.requestOTP(abhaId);
    return res.json(result);

  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ABDM Login - Step 2: Verify OTP
router.post('/auth/verify-abha-otp', async (req: Request, res: Response) => {
  try {
    const { abhaId, otp, transactionId } = req.body;
    if (!abhaId || !otp) {
      return res.status(400).json({ success: false, message: 'ABHA ID and OTP are required.' });
    }

    const verification = abdmGateway.verifyOTP(abhaId, otp, transactionId || '');
    if (!verification.success || !verification.patientRecord) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    const abhaPatient = verification.patientRecord;
    
    // Check if patient exists locally, if not create them
    let patient = await dbStore.patients.findOne({ abhaId: abhaPatient.abhaId });
    if (!patient) {
      patient = await dbStore.patients.create({
        abhaId: abhaPatient.abhaId,
        name: abhaPatient.name,
        age: abhaPatient.age,
        gender: abhaPatient.gender,
        email: abhaPatient.email,
        phone: abhaPatient.phone,
        address: abhaPatient.address
      });

      // Fetch existing history from ABDM Sandbox and import into local medical_documents
      for (const record of abhaPatient.history) {
        const ocrSim = simulateOCRAndExtraction(record.fileName, 'application/pdf');
        const pid = patient._id || patient.id;

        await dbStore.documents.create({
          patientId: pid,
          documentType: record.type,
          fileName: record.fileName,
          s3Url: `https://myhealthmate-records.s3.amazonaws.com/abdm-imported/${record.fileName}`,
          ocrText: ocrSim.ocrText,
          extractedData: ocrSim.extractedData,
          uploadDate: new Date(record.date),
          doctorName: record.doctorName,
          hospitalName: record.hospitalName
        });

        await seedMetricsFromExtractedData(pid, ocrSim.extractedData, new Date(record.date));
      }

      // Pre-seed demo vitals for the hackathon demo ABHA profile
      if (abhaPatient.abhaId === '91-9283-1283-9128') {
        await seedDemoVitals(patient._id || patient.id);
      }
    }

    const token = generateToken({ id: patient._id || patient.id, abhaId: patient.abhaId, name: patient.name });
    
    return res.json({
      success: true,
      token,
      patient,
      message: 'ABHA linking and authentication completed successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Regular Signup / Create New ABHA
router.post('/auth/register-regular', async (req: Request, res: Response) => {
  try {
    const { name, age, gender, email, phone, address, password, abhaId } = req.body;


    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }

    // Check if patient already exists
    const existing = await dbStore.patients.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Password hashing (simulated or real, bcryptjs is installed)
    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    const normalizedAbhaId = typeof abhaId === 'string' && abhaId.trim().length > 0 ? abhaId.trim() : undefined;

    const patient = await dbStore.patients.create({
      abhaId: normalizedAbhaId,

      name,
      age: Number(age) || 30,
      gender: gender || 'Male',
      email,
      phone,
      address: address || {},
      passwordHash // stored locally
    });

    const token = generateToken({ id: patient._id || patient.id, name: patient.name, abhaId: patient.abhaId });

    return res.json({
      success: true,
      token,
      patient,
      message: 'Registration successful!'
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Regular Login
router.post('/auth/login-regular', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const patient = await dbStore.patients.findOne({ email });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify password if hash exists, else skip for hackathon ease
    if (patient.passwordHash && password) {
      const isMatch = await bcrypt.compare(password, patient.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const token = generateToken({ id: patient._id || patient.id, name: patient.name, abhaId: patient.abhaId });

    return res.json({
      success: true,
      token,
      patient
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. PATIENT PROFILE ROUTES
// ==========================================
router.get('/patients/:id', async (req: Request, res: Response) => {
  try {
    const patient = await dbStore.patients.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    return res.json({ success: true, patient });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/patients/:id/update', async (req: Request, res: Response) => {
  try {
    const updated = await dbStore.patients.findByIdAndUpdate(req.params.id, req.body);
    return res.json({ success: true, patient: updated, message: 'Profile updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. MEDICAL DOCUMENTS ROUTES (OCR + COMPREHEND MEDICAL)
// ==========================================

// Upload document and trigger OCR simulation
router.post('/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { patientId, doctorName, hospitalName, documentType } = req.body;
    const file = req.file;

    if (!patientId || !file) {
      return res.status(400).json({ success: false, message: 'Patient ID and file are required.' });
    }

    // Call OCR / Textract + Comprehend Medical simulation
    const ocrResult = simulateOCRAndExtraction(file.originalname, file.mimetype);

    const docType = documentType || ocrResult.documentType;

    const newDoc = await dbStore.documents.create({
      patientId,
      documentType: docType,
      fileName: file.originalname,
      s3Url: `/uploads/${file.filename}`, // Local file serving path
      ocrText: ocrResult.ocrText,
      extractedData: {
        ...ocrResult.extractedData,
        doctorName: doctorName || ocrResult.extractedData.doctorName,
        hospitalName: hospitalName || ocrResult.extractedData.hospitalName
      },
      uploadDate: new Date(),
      isShared: false,
      shareCount: 0,
      versions: [
        {
          versionNum: 1,
          s3Url: `/uploads/${file.filename}`,
          ocrText: ocrResult.ocrText,
          extractedData: ocrResult.extractedData,
          uploadDate: new Date()
        }
      ]
    });

    // Automatically parse extracted health metrics and feed them into health_metrics table
    const patientObjId = patientId;
    if (ocrResult.extractedData.labValues && ocrResult.extractedData.labValues.length > 0) {
      for (const item of ocrResult.extractedData.labValues) {
        let typeKey: 'glucose' | 'cholesterol' | undefined = undefined;
        if (item.parameter.toLowerCase().includes('sugar') || item.parameter.toLowerCase().includes('glucose') || item.parameter.toLowerCase().includes('hba1c')) {
          typeKey = 'glucose';
        } else if (item.parameter.toLowerCase().includes('cholesterol') || item.parameter.toLowerCase().includes('ldl')) {
          typeKey = 'cholesterol';
        }

        if (typeKey) {
          await dbStore.metrics.create({
            patientId: patientObjId,
            metricType: typeKey,
            value: item.value,
            unit: item.unit,
            recordedDate: new Date(ocrResult.extractedData.dateOfRecord || new Date()),
            normalRangeMin: typeKey === 'glucose' ? 70 : 0,
            normalRangeMax: typeKey === 'glucose' ? 140 : 200
          });
        }
      }
    }

    if (ocrResult.extractedData.medications && ocrResult.extractedData.medications.length > 0) {
      // Log generic medication adherence metric
      await dbStore.metrics.create({
        patientId: patientObjId,
        metricType: 'medication_adherence',
        value: 100, // Starts at 100% adherence
        unit: '%',
        recordedDate: new Date(),
        normalRangeMin: 80,
        normalRangeMax: 100
      });
    }

    return res.json({
      success: true,
      document: newDoc,
      message: 'Medical document uploaded and successfully analyzed by Amazon Textract & Comprehend Medical.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch patient's medical records with filters
router.get('/documents/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const filter: any = { patientId: req.params.patientId };
    
    if (category) {
      filter.documentType = category;
    }

    const docs = await dbStore.documents.find(filter);

    // Apply search filter in JS for convenience and regex matching in mock DB
    let filteredDocs = docs;
    if (search) {
      const q = (search as string).toLowerCase();
      filteredDocs = docs.filter((d: any) => 
        d.fileName.toLowerCase().includes(q) || 
        d.ocrText.toLowerCase().includes(q) ||
        (d.extractedData?.doctorName && d.extractedData.doctorName.toLowerCase().includes(q)) ||
        (d.extractedData?.hospitalName && d.extractedData.hospitalName.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, documents: filteredDocs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle record consent status
router.post('/documents/:id/share', async (req: Request, res: Response) => {
  try {
    const { isShared } = req.body;
    const doc = await dbStore.documents.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    
    const updated = await dbStore.documents.findByIdAndUpdate(req.params.id, { 
      isShared, 
      shareCount: isShared ? (doc.shareCount + 1) : doc.shareCount 
    });

    return res.json({ success: true, document: updated, message: 'Consent updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. HEALTH METRICS & HEALTH SCORE
// ==========================================

// Add a metric
router.post('/metrics/add', async (req: Request, res: Response) => {
  try {
    const { patientId, metricType, value, unit, recordedDate } = req.body;
    if (!patientId || !metricType || value === undefined) {
      return res.status(400).json({ success: false, message: 'Missing fields.' });
    }

    let min = 0;
    let max = 0;
    
    if (metricType === 'glucose') { min = 70; max = 140; }
    else if (metricType === 'bp_systolic') { min = 90; max = 120; }
    else if (metricType === 'bp_diastolic') { min = 60; max = 80; }
    else if (metricType === 'weight') { min = 50; max = 85; }
    else if (metricType === 'cholesterol') { min = 100; max = 200; }
    else if (metricType === 'medication_adherence') { min = 80; max = 100; }

    const metric = await dbStore.metrics.create({
      patientId,
      metricType,
      value: Number(value),
      unit,
      recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
      normalRangeMin: min,
      normalRangeMax: max
    });

    return res.json({ success: true, metric, message: 'Metric logged successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get metrics
router.get('/metrics/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const metrics = await dbStore.metrics.find({ patientId: req.params.patientId });
    return res.json({ success: true, metrics });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Calculate Health Score
router.get('/metrics/patient/:patientId/health-score', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId;
    const metrics = await dbStore.metrics.find({ patientId });

    if (metrics.length === 0) {
      return res.json({ success: true, score: 75, message: 'Log metrics to get an accurate score. (Showing default 75)' });
    }

    // Health score algorithm: start at 100, subtract penalties for abnormal ranges
    let score = 100;
    let penalty = 0;
    let countedMetrics = 0;

    // Group metrics by type and find the latest values
    const latestMetrics: Record<string, any> = {};
    for (const m of metrics) {
      const key = m.metricType;
      if (!latestMetrics[key] || new Date(m.recordedDate) > new Date(latestMetrics[key].recordedDate)) {
        latestMetrics[key] = m;
      }
    }

    for (const key in latestMetrics) {
      const m = latestMetrics[key];
      countedMetrics++;
      const val = m.value;
      const min = m.normalRangeMin || 0;
      const max = m.normalRangeMax || 9999;

      if (val > max) {
        const excessPercent = (val - max) / max;
        penalty += Math.min(20, excessPercent * 40); // cap penalty per metric type at 20 pts
      } else if (val < min) {
        const deficitPercent = (min - val) / min;
        penalty += Math.min(20, deficitPercent * 40);
      }
    }

    score = Math.max(10, Math.round(score - penalty));

    let status = 'Excellent';
    if (score < 50) status = 'Critical';
    else if (score < 70) status = 'Moderate';
    else if (score < 85) status = 'Good';

    return res.json({
      success: true,
      score,
      status,
      latestMetricsCount: countedMetrics,
      message: `Health score calculated based on ${countedMetrics} vital factors.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. AI CHATBOT ROUTES
// ==========================================
router.post('/chatbot/chat', async (req: Request, res: Response) => {
  try {
    const { patientId, message, language } = req.body;
    if (!patientId || !message) {
      return res.status(400).json({ success: false, message: 'Patient ID and message are required.' });
    }

    const patient = await dbStore.patients.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Fetch conversation history
    const historyDocs = await dbStore.conversations.find({ patientId });
    const formattedHistory = historyDocs.map((h: any) => ([
      { role: 'user' as const, text: h.message },
      { role: 'assistant' as const, text: h.response }
    ])).flat();

    // Fetch medical history for context
    const docs = await dbStore.documents.find({ patientId });
    const metrics = await dbStore.metrics.find({ patientId });

    const conditions: string[] = [];
    const medications: any[] = [];
    const recentMetrics: any[] = [];

    // Parse documents for conditions & medicines
    docs.forEach((d: any) => {
      if (d.extractedData?.diagnosis) {
        conditions.push(...d.extractedData.diagnosis);
      }
      if (d.extractedData?.medications) {
        medications.push(...d.extractedData.medications);
      }
    });

    // Remove duplicates
    const uniqueConditions = Array.from(new Set(conditions));
    
    // Group metrics by type to get latest
    const latestMetrics: Record<string, any> = {};
    metrics.forEach((m: any) => {
      const key = m.metricType;
      if (!latestMetrics[key] || new Date(m.recordedDate) > new Date(latestMetrics[key].recordedDate)) {
        latestMetrics[key] = m;
      }
    });
    for (const key in latestMetrics) {
      recentMetrics.push({
        type: latestMetrics[key].metricType,
        value: latestMetrics[key].value,
        unit: latestMetrics[key].unit
      });
    }

    // Call Bedrock mock chat service
    const response = simulateBedrockChat({
      patientId,
      patientName: patient.name,
      message,
      language: language || 'english',
      history: formattedHistory.slice(-10), // Send last 10 dialogs for context
      medicalContext: {
        conditions: uniqueConditions,
        medications,
        recentMetrics
      }
    });

    // Save conversation to DB
    const chatDoc = await dbStore.conversations.create({
      patientId,
      message,
      response,
      language: language || 'english'
    });

    return res.json({
      success: true,
      chat: chatDoc
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/chatbot/history/:patientId', async (req: Request, res: Response) => {
  try {
    const history = await dbStore.conversations.find({ patientId: req.params.patientId });
    return res.json({ success: true, history });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. DOCTOR PORTAL & SECURE SHARING ROUTES
// ==========================================

// Patient: Generate QR Code consent details
router.post('/doctor/generate-qr', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorName, allowedRecords, durationHours } = req.body;
    if (!patientId || !doctorName) {
      return res.status(400).json({ success: false, message: 'Missing fields.' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (Number(durationHours) || 24));

    const qrHash = 'QR-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const access = await dbStore.doctorAccess.create({
      patientId,
      doctorName,
      accessType: 'qr_code',
      qrCodeHash: qrHash,
      allowedRecords: allowedRecords || [],
      expiresAt,
      isUsed: false
    });

    return res.json({
      success: true,
      qrCodeHash: qrHash,
      accessId: access._id || access.id,
      expiresAt,
      message: 'Time-limited QR Code hash generated. Expires in ' + (durationHours || 24) + ' hours.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Patient: Generate OTP for Doctor
router.post('/doctor/generate-otp', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorName, allowedRecords } = req.body;
    if (!patientId || !doctorName) {
      return res.status(400).json({ success: false, message: 'Missing fields.' });
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Valid for 10 minutes

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    const access = await dbStore.doctorAccess.create({
      patientId,
      doctorName,
      accessType: 'otp',
      otpCode,
      allowedRecords: allowedRecords || [],
      expiresAt,
      isUsed: false
    });

    return res.json({
      success: true,
      otpCode,
      accessId: access._id || access.id,
      expiresAt,
      message: 'Secure OTP valid for 10 minutes generated.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Doctor: Log in via OTP
router.post('/doctor/verify-otp', async (req: Request, res: Response) => {
  try {
    const { otpCode, doctorName } = req.body;
    if (!otpCode) {
      return res.status(400).json({ success: false, message: 'OTP Code is required.' });
    }

    const access = await dbStore.doctorAccess.findOne({ otpCode, isUsed: false });
    if (!access) {
      return res.status(404).json({ success: false, message: 'Invalid or already used OTP.' });
    }

    if (new Date() > new Date(access.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Mark OTP as used and log access time
    await dbStore.doctorAccess.findByIdAndUpdate(access._id || access.id, {
      isUsed: true,
      accessedAt: new Date(),
      doctorName: doctorName || access.doctorName
    });

    const patient = await dbStore.patients.findById(access.patientId);
    
    // Fetch only the allowed documents
    const allDocs = await dbStore.documents.find({ patientId: access.patientId });
    const allowedDocs = allDocs.filter((d: any) => 
      access.allowedRecords.includes(d._id?.toString()) || access.allowedRecords.includes(d.id?.toString())
    );

    return res.json({
      success: true,
      patient,
      documents: allowedDocs,
      message: 'Access granted. OTP verified.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Doctor: Access records via QR Hash
router.get('/doctor/access-qr/:hash', async (req: Request, res: Response) => {
  try {
    const access = await dbStore.doctorAccess.findOne({ qrCodeHash: req.params.hash });
    if (!access) {
      return res.status(404).json({ success: false, message: 'Access link not found.' });
    }

    if (new Date() > new Date(access.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Consent link has expired.' });
    }

    // Update log
    await dbStore.doctorAccess.findByIdAndUpdate(access._id || access.id, {
      accessedAt: new Date()
    });

    const patient = await dbStore.patients.findById(access.patientId);
    const allDocs = await dbStore.documents.find({ patientId: access.patientId });
    
    // Filter docs based on selected documents
    const allowedDocs = allDocs.filter((d: any) => 
      access.allowedRecords.includes(d._id?.toString()) || access.allowedRecords.includes(d.id?.toString())
    );

    return res.json({
      success: true,
      patient,
      documents: allowedDocs,
      doctorName: access.doctorName,
      message: 'Access granted via QR code scan.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Patient: View their consent audit trail logs
router.get('/doctor/patient/:patientId/access-logs', async (req: Request, res: Response) => {
  try {
    const logs = await dbStore.doctorAccess.find({ patientId: req.params.patientId });
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Patient: Revoke doctor access consent
router.post('/doctor/revoke/:accessId', async (req: Request, res: Response) => {
  try {
    const access = await dbStore.doctorAccess.findById(req.params.accessId);
    if (!access) {
      return res.status(404).json({ success: false, message: 'Access grant not found.' });
    }

    await dbStore.doctorAccess.findByIdAndUpdate(req.params.accessId, {
      isUsed: true,
      expiresAt: new Date()
    });

    return res.json({ success: true, message: 'Doctor access consent revoked successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Dashboard summary — medical profile aggregate
router.get('/patients/:id/summary', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const patient = await dbStore.patients.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const docs = await dbStore.documents.find({ patientId });
    const metrics = await dbStore.metrics.find({ patientId });

    const conditions: string[] = [];
    const medications: any[] = [];
    const allergies: string[] = [];
    const vaccinations: string[] = [];

    docs.forEach((d: any) => {
      if (d.extractedData?.diagnosis) conditions.push(...d.extractedData.diagnosis);
      if (d.extractedData?.medications) medications.push(...d.extractedData.medications);
      if (d.documentType === 'vaccination') {
        vaccinations.push(d.fileName);
      }
    });

    const latestMetrics: Record<string, any> = {};
    metrics.forEach((m: any) => {
      const key = m.metricType;
      if (!latestMetrics[key] || new Date(m.recordedDate) > new Date(latestMetrics[key].recordedDate)) {
        latestMetrics[key] = m;
      }
    });

    return res.json({
      success: true,
      summary: {
        patient,
        chronicConditions: Array.from(new Set(conditions)),
        activeMedications: medications,
        allergies,
        vaccinations,
        latestMetrics: Object.values(latestMetrics),
        totalDocuments: docs.length,
        lastVisit: docs.length > 0
          ? docs.sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0].uploadDate
          : null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
