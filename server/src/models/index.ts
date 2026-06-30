import mongoose, { Schema, Document } from 'mongoose';

// --- PATIENT ---
export interface IPatient extends Document {
  abhaId?: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  abhaId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  }
}, { timestamps: true });

// --- MEDICAL DOCUMENT ---
export interface IVersion {
  versionNum: number;
  s3Url: string;
  ocrText?: string;
  extractedData?: any;
  uploadDate: Date;
}

export interface IMedicalDocument extends Document {
  patientId: mongoose.Types.ObjectId | string;
  documentType: 'prescription' | 'lab_report' | 'imaging' | 'discharge_summary' | 'vaccination' | 'insurance';
  fileName: string;
  s3Url: string;
  ocrText: string;
  extractedData: {
    doctorName?: string;
    hospitalName?: string;
    diagnosis?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    labValues?: Array<{
      parameter: string;
      value: number;
      unit: string;
      status: 'normal' | 'high' | 'low';
    }>;
    dateOfRecord?: string;
    additionalNotes?: string;
  };
  uploadDate: Date;
  isShared: boolean;
  shareCount: number;
  versions: IVersion[];
}

const MedicalDocumentSchema = new Schema<IMedicalDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  documentType: { 
    type: String, 
    enum: ['prescription', 'lab_report', 'imaging', 'discharge_summary', 'vaccination', 'insurance'],
    required: true 
  },
  fileName: { type: String, required: true },
  s3Url: { type: String, required: true },
  ocrText: { type: String, default: '' },
  extractedData: {
    doctorName: String,
    hospitalName: String,
    diagnosis: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    labValues: [{
      parameter: String,
      value: Number,
      unit: String,
      status: { type: String, enum: ['normal', 'high', 'low'] }
    }],
    dateOfRecord: String,
    additionalNotes: String
  },
  uploadDate: { type: Date, default: Date.now },
  isShared: { type: Boolean, default: false },
  shareCount: { type: Number, default: 0 },
  versions: [{
    versionNum: Number,
    s3Url: String,
    ocrText: String,
    extractedData: Schema.Types.Mixed,
    uploadDate: Date
  }]
});

// --- HEALTH METRIC ---
export interface IHealthMetric extends Document {
  patientId: mongoose.Types.ObjectId | string;
  metricType: 'glucose' | 'bp_systolic' | 'bp_diastolic' | 'weight' | 'cholesterol' | 'medication_adherence';
  value: number;
  unit: string;
  recordedDate: Date;
  normalRangeMin?: number;
  normalRangeMax?: number;
}

const HealthMetricSchema = new Schema<IHealthMetric>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  metricType: { 
    type: String, 
    enum: ['glucose', 'bp_systolic', 'bp_diastolic', 'weight', 'cholesterol', 'medication_adherence'],
    required: true 
  },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  recordedDate: { type: Date, default: Date.now },
  normalRangeMin: Number,
  normalRangeMax: Number
});

// --- CHATBOT CONVERSATION ---
export interface IChatbotConversation extends Document {
  patientId: mongoose.Types.ObjectId | string;
  message: string;
  response: string;
  language: 'english' | 'hindi' | 'tamil';
  createdAt: Date;
}

const ChatbotConversationSchema = new Schema<IChatbotConversation>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  language: { type: String, enum: ['english', 'hindi', 'tamil'], default: 'english' },
  createdAt: { type: Date, default: Date.now }
});

// --- DOCTOR ACCESS ---
export interface IDoctorAccess extends Document {
  patientId: mongoose.Types.ObjectId | string;
  doctorName: string;
  accessType: 'qr_code' | 'otp';
  qrCodeHash?: string;
  otpCode?: string;
  allowedRecords: string[]; // Document IDs
  expiresAt: Date;
  isUsed: boolean;
  accessedAt?: Date;
}

const DoctorAccessSchema = new Schema<IDoctorAccess>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorName: { type: String, required: true },
  accessType: { type: String, enum: ['qr_code', 'otp'], required: true },
  qrCodeHash: String,
  otpCode: String,
  allowedRecords: [{ type: String }],
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  accessedAt: Date
});

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export const MedicalDocument = mongoose.model<IMedicalDocument>('MedicalDocument', MedicalDocumentSchema);
export const HealthMetric = mongoose.model<IHealthMetric>('HealthMetric', HealthMetricSchema);
export const ChatbotConversation = mongoose.model<IChatbotConversation>('ChatbotConversation', ChatbotConversationSchema);
export const DoctorAccess = mongoose.model<IDoctorAccess>('DoctorAccess', DoctorAccessSchema);

export * from './PersonalDetails';

