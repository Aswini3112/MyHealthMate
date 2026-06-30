import { IMedicalDocument } from '../models';

// ==========================================
// 1. AMAZON TEXTRACT & COMPREHEND MEDICAL MOCK
// ==========================================
export interface ExtractedData {
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
}

export function simulateOCRAndExtraction(fileName: string, mimeType: string): { ocrText: string; extractedData: ExtractedData; documentType: string } {
  const nameLower = fileName.toLowerCase();

  let ocrText = '';
  let extractedData: ExtractedData = {};
  let documentType = 'prescription';

  if (nameLower.includes('prescription') || nameLower.includes('rx') || nameLower.includes('doctor')) {
    documentType = 'prescription';
    ocrText = `
      APOLLO CLINICS - BENGALURU
      Dr. Ramesh Kumar, MD, DM (Cardiology)
      Reg No: KMC-58291
      Date: 12-May-2026

      Patient: Rajesh Kumar, 45 Y / Male
      Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension

      Rx:
      1. Tab. Metformin 500mg - Once daily after dinner - 3 months
      2. Tab. Telmisartan 40mg - Once daily in morning - 3 months
      3. Tab. Atorvastatin 10mg - Once daily at bedtime - 1 month

      Please review in 3 months with fasting blood sugar and HbA1c.
      Signature: [Dr. R. Kumar]
    `;
    extractedData = {
      doctorName: 'Dr. Ramesh Kumar',
      hospitalName: 'Apollo Clinics - Bengaluru',
      diagnosis: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      medications: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Once daily after dinner', duration: '3 months' },
        { name: 'Telmisartan', dosage: '40mg', frequency: 'Once daily in morning', duration: '3 months' },
        { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '1 month' }
      ],
      dateOfRecord: '2026-05-12',
      additionalNotes: 'Review in 3 months with FBS and HbA1c.'
    };
  } else if (nameLower.includes('lab') || nameLower.includes('blood') || nameLower.includes('report') || nameLower.includes('test')) {
    documentType = 'lab_report';
    ocrText = `
      DIAGNOPEOPLE DIAGNOSTICS
      Patient Name: Rajesh Kumar  Age/Sex: 45/M  Date: 18-May-2026
      Ref By: Dr. Ramesh Kumar

      TEST REPORT - BIOCHEMISTRY
      --------------------------------------------------
      TEST NAME                 RESULT    UNIT      REFERRALS
      --------------------------------------------------
      Fasting Blood Sugar (FBS) 142       mg/dL     (70-100)      [HIGH]
      Post Prandial Sugar (PPBS)189       mg/dL     (100-140)     [HIGH]
      HbA1c (Glycated Hb)       7.4       %         (4.0-5.6)     [HIGH]
      Total Cholesterol         210       mg/dL     (<200)        [HIGH]
      Serum Triglycerides       155       mg/dL     (<150)        [HIGH]
      HDL Cholesterol           38        mg/dL     (40-60)       [LOW]
      LDL Cholesterol           141       mg/dL     (<100)        [HIGH]
      --------------------------------------------------
    `;
    extractedData = {
      doctorName: 'Dr. Ramesh Kumar',
      hospitalName: 'DiagnoDB Diagnostics',
      diagnosis: ['Hyperglycemia', 'Dyslipidemia'],
      labValues: [
        { parameter: 'Fasting Blood Sugar', value: 142, unit: 'mg/dL', status: 'high' },
        { parameter: 'HbA1c', value: 7.4, unit: '%', status: 'high' },
        { parameter: 'Total Cholesterol', value: 210, unit: 'mg/dL', status: 'high' },
        { parameter: 'LDL Cholesterol', value: 141, unit: 'mg/dL', status: 'high' }
      ],
      dateOfRecord: '2026-05-18',
      additionalNotes: 'High blood glucose and high cholesterol metrics detected. Patient requires immediate dietary modifications.'
    };
  } else if (nameLower.includes('xray') || nameLower.includes('x-ray') || nameLower.includes('mri') || nameLower.includes('imaging') || nameLower.includes('ct')) {
    documentType = 'imaging';
    ocrText = `
      NIMHANS RAD DEPT - BENGALURU
      Patient: Rajesh Kumar  Age: 45  Sex: Male  Date: 02-May-2026
      Modality: Chest X-ray PA View

      FINDINGS:
      - Bony thorax appears normal.
      - Both lung fields are clear. No focal consolidation or effusion.
      - Cardiophrenic and costophrenic angles are sharp.
      - Cardiomegaly is not seen.
      - Hilar shadows are normal.

      IMPRESSION:
      Normal Chest Radiograph.
    `;
    extractedData = {
      doctorName: 'Dr. Anita Desai (Radiologist)',
      hospitalName: 'NIMHANS - Bengaluru',
      diagnosis: ['Normal Chest Radiograph'],
      dateOfRecord: '2026-05-02',
      additionalNotes: 'Lungs clear, heart size normal.'
    };
  } else if (nameLower.includes('discharge') || nameLower.includes('summary') || nameLower.includes('hospital')) {
    documentType = 'discharge_summary';
    ocrText = `
      MAX HEALTHCARE HOSPITAL
      DISCHARGE SUMMARY
      Patient: Rajesh Kumar  IP No: IP92831  Admitted: 20-Apr-2026 Discharged: 22-Apr-2026
      Attending Consultant: Dr. S. K. Gupta

      Diagnosis: Acute Gastroenteritis with Mild Dehydration.
      Clinical Summary: Patient presented with severe vomiting, watery stools and weakness. Managed with IV fluids and antibiotics.
      Condition at Discharge: Stable, afebrile, tolerating oral diet.

      Advice on Discharge:
      - Tab. Ciprofloxacin 500mg - Twice daily - 5 days
      - ORS sachets as required
      - Light home cooked diet
    `;
    extractedData = {
      doctorName: 'Dr. S. K. Gupta',
      hospitalName: 'Max Healthcare Hospital',
      diagnosis: ['Acute Gastroenteritis', 'Mild Dehydration'],
      medications: [
        { name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' }
      ],
      dateOfRecord: '2026-04-22',
      additionalNotes: 'Hospitalized for gastroenteritis. Fully recovered at discharge.'
    };
  } else if (nameLower.includes('vacc') || nameLower.includes('covid') || nameLower.includes('immun')) {
    documentType = 'vaccination';
    ocrText = `
      COWIN VACCINATION PORTAL
      Ministry of Health & Family Welfare, Government of India

      Certificate for COVID-19 Vaccination (Precaution Dose)
      Beneficiary Name: Rajesh Kumar  Age: 45  Gender: Male
      Beneficiary ID: 9283-1283-9128

      Vaccination Details:
      Vaccine Name: Covishield
      Date of Precaution Dose: 14-Jan-2025
      Vaccinated by: Sunita Devi, ANM
      Place: PHC Indiranagar, Bengaluru
    `;
    extractedData = {
      doctorName: 'Sunita Devi (ANM)',
      hospitalName: 'PHC Indiranagar',
      diagnosis: ['COVID-19 Vaccination Completed'],
      dateOfRecord: '2025-01-14',
      additionalNotes: 'Covishield precaution dose completed.'
    };
  } else {
    // Default fallback
    documentType = 'prescription';
    ocrText = `
      HEALTHCARE CENTER
      Date: 20-Jun-2026
      Patient: General Patient
      Report Detail: Regular general physical checkup.
      Vitals: BP 120/80 mmHg, Pulse 72 bpm.
      Rx: Multivitamin - Once daily - 30 days
    `;
    extractedData = {
      doctorName: 'Dr. Generic Doctor',
      hospitalName: 'General Healthcare Center',
      diagnosis: ['General Checkup'],
      medications: [
        { name: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' }
      ],
      dateOfRecord: '2026-06-20',
      additionalNotes: 'Vitals are normal.'
    };
  }

  return { ocrText, extractedData, documentType };
}

// ==========================================
// 2. AMAZON BEDROCK / AI CHATBOT MOCK
// ==========================================
export interface ChatParams {
  patientId: string;
  patientName: string;
  message: string;
  language: 'english' | 'hindi' | 'tamil';
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  medicalContext: {
    conditions: string[];
    medications: Array<{ name: string; dosage: string; frequency: string }>;
    recentMetrics: Array<{ type: string; value: number; unit: string }>;
  };
}

function applyEnglishDisclaimer(base: string): string {
  return `${base}\n\nDisclaimer: This response is generated by MyHealthMate AI and is for informational purposes only. Consult a doctor for professional medical advice.`;
}

// IMPORTANT: no Sarvam wrapper/prefix metadata should be visible to the user.
export function simulateBedrockChat(params: ChatParams): string {
  const { patientName, message, language, medicalContext } = params;
  const msgLower = message.toLowerCase();

  let englishBody = '';

  // Simple rule-based intelligent agent answering medical queries
  if (msgLower.includes('sugar') || msgLower.includes('diabetes') || msgLower.includes('glucose')) {
    const glucoseMetric = medicalContext.recentMetrics.find(m => m.type.includes('glucose'));
    const isDiabetes = medicalContext.conditions.some(c => c.toLowerCase().includes('diab'));

    englishBody = `Hello ${patientName}. Looking at your files, you ${isDiabetes ? 'have Type 2 Diabetes' : 'have logged sugar levels'}. ` +
      (glucoseMetric ? `Your last recorded glucose level was ${glucoseMetric.value} ${glucoseMetric.unit}. ` : '') +
      `For diabetes management, it is crucial to keep your Fasting Blood Glucose between 70-100 mg/dL and HbA1c below 6.5%. ` +
      `Ensure you take your Metformin or prescribed medications regularly after meals, cut down on refined carbohydrates (like white rice, maida), and engage in at least 30 minutes of brisk walking daily.`;
  } else if (msgLower.includes('pressure') || msgLower.includes('bp') || msgLower.includes('hypertension')) {
    const bpSystolic = medicalContext.recentMetrics.find(m => m.type.includes('systolic'));
    const bpDiastolic = medicalContext.recentMetrics.find(m => m.type.includes('diastolic'));

    englishBody = `Hello ${patientName}. Managing blood pressure is vital. ` +
      (bpSystolic && bpDiastolic ? `Your latest blood pressure vitals show ${bpSystolic.value}/${bpDiastolic.value} mmHg. ` : '') +
      `A normal range is generally below 120/80 mmHg. Since you have Hypertension logged in your profile, please ensure you:
      1. Limit salt intake to less than 1 teaspoon (5g) per day.
      2. Take your Telmisartan or other BP medications daily in the morning as prescribed.
      3. Avoid sudden stress and practice deep breathing or meditation.`;
  } else if (msgLower.includes('medication') || msgLower.includes('medicine') || msgLower.includes('tablet')) {
    if (medicalContext.medications.length > 0) {
      const medList = medicalContext.medications.map(m => `- ${m.name} (${m.dosage}) taken ${m.frequency}`).join('\n');
      englishBody = `Based on your profile, your active medications are:\n${medList}\n\nIt is important to maintain strict compliance. Do not skip doses or double up if you miss one. Let me know if you would like me to set up an alarm reminder for any of these.`;
    } else {
      englishBody = `I don't see any active prescription medications logged in your health profile. If you have recently received a prescription, please upload it in the 'Records' page and our OCR tool will automatically catalog your active drugs.`;
    }
  } else if (msgLower.includes('diet') || msgLower.includes('food') || msgLower.includes('eat')) {
    englishBody = `For a healthy lifestyle, I recommend an Indian-centric balanced diet:\n    - **Proteins**: Include dal, paneer, sprouts, curd, and lean meats.\n    - **Fiber**: Eat green leafy vegetables, cucumbers, oats, and whole grains.\n    - **Fats**: Use healthy fats in moderation (mustard oil, olive oil, ghee).\n    - **Avoid**: Deep-fried snacks (samosas, pakodas), sweet beverages, and refined flour.\n    *Note: Since you have active health indicators, keeping a low glycemic index diet is highly recommended.*`;
  } else if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    englishBody = `Hello! I am your AI Health Companion, powered by Amazon Bedrock. I have reviewed your medical history. I can help explain medical terms from your uploaded reports, analyze blood glucose and BP trends, list your active medications, or offer diet recommendations. What would you like to discuss today?`;
  } else {
    englishBody = `I hear you, ${patientName}. To provide the best support regarding your query, please remember to keep active logs of your vitals (Blood Glucose, Blood Pressure, Weight) in the 'Analytics' section. This allows me to analyze trends and suggest specific advice. If you are experiencing serious symptoms (like chest pain, severe breathlessness, or high fever), please contact an emergency medical provider immediately.`;
  }

  // Mock translation (no visible prefixes/wrappers). If translation is unavailable, return English.
  if (language === 'hindi') {
    // Translate ONLY body; no wrapper/prefix text.
    // (This remains a mock translation pipeline as the project currently lacks a real Sarvam call.)
    if (msgLower.includes('sugar') || msgLower.includes('diabetes') || msgLower.includes('glucose')) {
      const glucoseMetric = medicalContext.recentMetrics.find(m => m.type.includes('glucose'));
      const isDiabetes = medicalContext.conditions.some(c => c.toLowerCase().includes('diab'));
      return `नमस्ते ${patientName}. आपकी फाइलों के आधार पर, ${isDiabetes ? 'आपको टाइप 2 डायबिटीज है' : 'आपने शुगर लेवल लॉग किए हैं'}. ` +
        (glucoseMetric ? `आपका आखिरी रिकॉर्डेड ग्लूकोज स्तर ${glucoseMetric.value} ${glucoseMetric.unit} था। ` : '') +
        `डायबिटीज मैनेजमेंट के लिए, अपना फास्टिंग ब्लड ग्लूकोज 70-100 mg/dL के बीच और HbA1c 6.5% से नीचे रखना महत्वपूर्ण है। ` +
        `खाने के बाद नियमित रूप से अपनी Metformin या प्रिस्क्राइब्ड दवाएं लें, रिफाइंड कार्बोहाइड्रेट (जैसे सफेद चावल, मैदा) कम करें, और रोज़ कम से कम 30 मिनट की तेज़ चाल से चलें।` +
        `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
    }

    if (msgLower.includes('pressure') || msgLower.includes('bp') || msgLower.includes('hypertension')) {
      const bpSystolic = medicalContext.recentMetrics.find(m => m.type.includes('systolic'));
      const bpDiastolic = medicalContext.recentMetrics.find(m => m.type.includes('diastolic'));
      return `नमस्ते ${patientName}. ब्लड प्रेशर को मैनेज करना बहुत महत्वपूर्ण है। ` +
        (bpSystolic && bpDiastolic ? `आपके नवीनतम BP रीडिंग्स ${bpSystolic.value}/${bpDiastolic.value} mmHg दिखाते हैं। ` : '') +
        `सामान्य रेंज आमतौर पर 120/80 mmHg से कम होती है। चूंकि आपके प्रोफाइल में हाइपरटेंशन लॉग है, कृपया यह सुनिश्चित करें:\n1. नमक का सेवन रोज़ 1 चम्मच (5g) से कम रखें।\n2. अपनी Telmisartan या अन्य BP दवाएं रोज सुबह डॉक्टर के निर्देशानुसार लें।\n3. अचानक तनाव से बचें और गहरी सांस या ध्यान का अभ्यास करें।` +
        `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
    }

    if (msgLower.includes('medication') || msgLower.includes('medicine') || msgLower.includes('tablet')) {
      if (medicalContext.medications.length > 0) {
        const medList = medicalContext.medications.map(m => `- ${m.name} (${m.dosage}) ${m.frequency} लेते हुए`).join('\n');
        return `आपके प्रोफाइल के अनुसार, आपकी सक्रिय दवाएं ये हैं:\n${medList}\n\nदवाओं का नियमित और सही तरीके से पालन करना महत्वपूर्ण है। डोज़ मिस न करें और अगर एक डोज़ छूट जाए तो डबल न करें। अगर आप चाहें तो मैं इन दवाओं के लिए रिमाइंडर सेट करने में मदद कर सकता हूँ।` +
          `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
      }
      return `आपके स्वास्थ्य प्रोफाइल में मुझे कोई सक्रिय प्रिस्क्रिप्शन दवा दिखाई नहीं दे रही है। यदि आपने हाल ही में कोई प्रिस्क्रिप्शन लिया है, तो कृपया 'Records' पेज पर उसे अपलोड करें और हमारा OCR टूल आपकी सक्रिय दवाओं को अपने आप कैटलॉग कर देगा।` +
        `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
    }

    if (msgLower.includes('diet') || msgLower.includes('food') || msgLower.includes('eat')) {
      return `स्वस्थ जीवनशैली के लिए, मैं एक भारतीय-केंद्रित संतुलित डाइट की सलाह देता हूँ:\n- **प्रोटीन**: दाल, पनीर, स्प्राउट्स, दही और लीन मीट शामिल करें।\n- **फाइबर**: हरी पत्तेदार सब्जियां, खीरा, ओट्स और साबुत अनाज खाएं।\n- **फैट्स**: स्वस्थ फॅट्स सीमित मात्रा में लें (सरसों का तेल, ऑलिव ऑयल, घी)।\n- **बचें**: तले हुए स्नैक्स (समोसा, पकौड़े), मीठे पेय और रिफाइंड आटा।\n*नोट: चूंकि आपके स्वास्थ्य संकेत सक्रिय हैं, इसलिए लो ग्लाइसेमिक इंडेक्स डाइट बहुत फायदेमंद है।*` +
        `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
    }

    if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
      return `नमस्ते! मैं आपका AI Health Companion हूँ, जो Amazon Bedrock से संचालित है। मैंने आपकी मेडिकल हिस्ट्री देख ली है। मैं आपकी अपलोड की गई रिपोर्ट्स में मौजूद मेडिकल टर्म्स समझाने, ब्लड ग्लूकोज और BP के ट्रेंड्स का विश्लेषण करने, आपकी सक्रिय दवाओं की सूची बनाने या डाइट सुझाव देने में मदद कर सकता हूँ। आप आज किस बारे में बात करना चाहेंगे?` +
        `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
    }

    return `मैं समझता/समझती हूँ, ${patientName}। आपके प्रश्न के लिए सबसे अच्छी सहायता देने हेतु, कृपया 'Analytics' सेक्शन में अपने विटल्स (Blood Glucose, Blood Pressure, Weight) के नियमित लॉग रखें। इससे मैं ट्रेंड्स का विश्लेषण कर के आपके लिए खास सुझाव दे पाऊँगा/पाऊँगी। अगर आपको गंभीर लक्षण (जैसे सीने में दर्द, बहुत अधिक सांस फूलना, या तेज बुखार) हो रहे हैं, तो कृपया तुरंत इमरजेंसी मेडिकल प्रोवाइडर से संपर्क करें।` +
      `\n\nDisclaimer: यह प्रतिक्रिया MyHealthMate AI द्वारा सूचना के उद्देश्य से बनाई गई है। पेशेवर मेडिकल सलाह के लिए कृपया डॉक्टर से संपर्क करें।`;
  }

  if (language === 'tamil') {
    if (msgLower.includes('sugar') || msgLower.includes('diabetes') || msgLower.includes('glucose')) {
      const glucoseMetric = medicalContext.recentMetrics.find(m => m.type.includes('glucose'));
      const isDiabetes = medicalContext.conditions.some(c => c.toLowerCase().includes('diab'));
      return `வணக்கம் ${patientName}. உங்கள் கோப்புகளை பார்த்தபோது, ${isDiabetes ? 'உங்களுக்கு டைப் 2 நீரிழிவு (Diabetes) உள்ளது' : 'நீங்கள் சர்க்கரை அளவுகளை பதிவு செய்துள்ளீர்கள்'}. ` +
        (glucoseMetric ? `உங்கள் கடைசியாக பதிவான குளுக்கோஸ் அளவு ${glucoseMetric.value} ${glucoseMetric.unit}. ` : '') +
        `நீரிழிவு மேலாண்மைக்காக, உங்கள் ஃபாஸ்டிங் பிளட் சர்க்கரையை 70-100 mg/dL இடையில் வைத்திருக்கவும் மற்றும் HbA1c-ஐ 6.5%க்கு கீழே வைத்திருக்கவும் முக்கியம். ` +
        `சாப்பாட்டுக்குப் பிறகு உங்கள் Metformin அல்லது மருத்துவர் பரிந்துரைத்த மருந்துகளை வழக்கமாக எடுத்துக்கொள்ளவும், வெள்ளை அரிசி/மைதா போன்ற சுத்திகரிக்கப்பட்ட கார்போஹைட்ரேட்டுகளை குறைக்கவும், தினமும் குறைந்தது 30 நிமிடம் வேக நடை செய்யவும்.` +
        `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
    }

    if (msgLower.includes('pressure') || msgLower.includes('bp') || msgLower.includes('hypertension')) {
      const bpSystolic = medicalContext.recentMetrics.find(m => m.type.includes('systolic'));
      const bpDiastolic = medicalContext.recentMetrics.find(m => m.type.includes('diastolic'));
      return `வணக்கம் ${patientName}. இரத்த அழுத்தத்தை (Blood Pressure) சரியாக பராமரிப்பது மிகவும் முக்கியம். ` +
        (bpSystolic && bpDiastolic ? `உங்கள் சமீபத்திய BP ரீடிங்க்ஸ் ${bpSystolic.value}/${bpDiastolic.value} mmHg ஆக இருக்கிறது. ` : '') +
        `பொதுவாக சாதாரண வரம்பு 120/80 mmHg-க்கு கீழே இருக்கும். உங்கள் சுயவிவரத்தில் Hypertension பதிவு செய்யப்பட்டுள்ளதால், தயவுசெய்து:\n1. தினமும் 1 டீஸ்பூன் (5g)க்குள் உப்பை மட்டும் வைத்துக்கொள்ளுங்கள்.\n2. உங்கள் Telmisartan அல்லது பிற BP மருந்துகளை காலை நேரத்தில் மருத்துவர் சொன்னபடி வழக்கமாக எடுத்துக்கொள்ளுங்கள்.\n3. திடீர் மனஅழுத்தத்தை தவிர்க்கவும்; ஆழ்ந்த மூச்சு மற்றும் தியானத்தை பயிற்சி செய்யவும்.` +
        `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
    }

    if (msgLower.includes('medication') || msgLower.includes('medicine') || msgLower.includes('tablet')) {
      if (medicalContext.medications.length > 0) {
        const medList = medicalContext.medications.map(m => `- ${m.name} (${m.dosage}) (${m.frequency})`).join('\n');
        return `உங்கள் சுயவிவரத்தின் அடிப்படையில், உங்கள் செயலில் உள்ள மருந்துகள் இவை:\n${medList}\n\nமருந்துகளை கட்டுப்பாடுடன் முறையாக எடுத்துக்கொள்வது முக்கியம். டோஸ் தவற விடாதீர்கள்; தவறிவிட்டால் இரட்டிப்பாக எடுத்துக்கொள்ள வேண்டாம். நீங்கள் விரும்பினால், இவற்றுக்கான நினைவூட்டலை அமைக்க உதவுகிறேன்.` +
          `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
      }
      return `உங்கள் சுகாதாரப் பதிவில் செயலில் உள்ள எந்த மருந்தும் தெரியவில்லை. சமீபத்தில் ஒரு மருந்துச் சீட்டு பெற்றிருந்தால், 'Records' பக்கத்தில் அதைப் பதிவேற்றுங்கள்; எங்கள் OCR கருவி உங்கள் செயலில் உள்ள மருந்துகளை தானாகவே பட்டியலிடும்.` +
        `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
    }

    if (msgLower.includes('diet') || msgLower.includes('food') || msgLower.includes('eat')) {
      return `ஆரோக்கியமான வாழ்க்கைமுறைக்கு, இந்தியாவைச் சேர்ந்த சமநிலை உணவு முறையை பரிந்துரைக்கிறேன்:\n- **புரதம்**: பருப்பு, பன்னீர், ஸ்ப்ரௌட்ஸ், தயிர், மற்றும் மெலிந்த இறைச்சி சேர்க்கவும்.\n- **நார்ச்சத்து**: பச்சை இலைகள், வெள்ளரிக்காய், ஓட்ஸ், மற்றும் முழு தானியங்கள் சாப்பிடுங்கள்.\n- **கொழுப்பு**: ஆரோக்கியமான கொழுப்புகளை மிதமாக பயன்படுத்துங்கள் (கடுகு எண்ணெய், ஆலிவ் எண்ணெய், நெய்).\n- **தவிர்க்க**: எண்ணெயில் பொரித்த ஸ்நாக்ஸ் (சமோசா, பக்‌கோடா), இனிப்பு பானங்கள், மற்றும் சுத்திகரிக்கப்பட்ட மாவு.\n*குறிப்பு: உங்கள் உடல்நிலை குறிப்புகள் இருப்பதால், குறைந்த Glycemic Index டயட் மிகவும் பயனுள்ளதாக இருக்கும்.*` +
        `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
    }

    if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
      return `வணக்கம்! நான் Amazon Bedrock மூலம் இயக்கப்படும் உங்கள் AI Health Companion. உங்கள் மருத்துவ வரலாற்றை பார்த்தேன். உங்கள் பதிவேற்றிய அறிக்கைகளில் உள்ள மருத்துவ சொற்களை விளக்க உதவலாம், இரத்த சர்க்கரை மற்றும் BP டிரெண்ட்ஸ்களை பகுப்பாய்வு செய்யலாம், உங்கள் செயலில் உள்ள மருந்துகளின் பட்டியல் தரலாம், அல்லது உணவு பரிந்துரைகளையும் சொல்லலாம். இன்று நீங்கள் எதைப் பற்றி பேச விரும்புகிறீர்கள்?` +
        `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
    }

    return `உங்கள் வேண்டுகோளை புரிந்துகொண்டேன், ${patientName}. உங்கள் கேள்விக்கான சிறந்த உதவிக்காக, 'Analytics' பகுதியில் உங்கள் உயிரியல் அளவுகள் (Blood Glucose, Blood Pressure, Weight) குறித்து தொடர்ந்து பதிவுகளை வைத்திருங்கள். இதனால் நான் டிரெண்ட்ஸ்களை பகுப்பாய்வு செய்து குறிப்பிட்ட ஆலோசனைகளை வழங்க முடியும். மார்புவலி, கடும் மூச்சுத்திணறல், அல்லது அதிக காய்ச்சல் போன்ற தீவிர அறிகுறிகள் இருந்தால் உடனடியாக ஒரு மருத்துவ அவசர சேவையை அணுகுங்கள்.` +
      `\n\nDisclaimer: இந்த பதில் MyHealthMate AI மூலம் தகவல் நோக்கங்களுக்காக மட்டுமே உருவாக்கப்பட்டுள்ளது. தொழில்முறை மருத்துவ ஆலோசனைக்காக தயவுசெய்து மருத்துவரை அணுகவும்.`;
  }

  // Fallback: English only, clean
  return applyEnglishDisclaimer(englishBody);
}

// ==========================================
// 3. ABDM GATEWAY SANDBOX MOCK
// ==========================================
export interface ABHAPatient {
  abhaId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  history: Array<{
    date: string;
    type: 'prescription' | 'lab_report';
    fileName: string;
    doctorName: string;
    hospitalName: string;
  }>;
}

// Mock ABDM Central Patient Registry database
const MOCK_ABDM_REGISTRY: Record<string, ABHAPatient> = {
  '91-9283-1283-9128': {
    abhaId: '91-9283-1283-9128',
    name: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    phone: '9876543210',
    email: 'rajesh.kumar@gmail.com',
    address: {
      street: '12th Main Road, HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102'
    },
    history: [
      {
        date: '2026-05-12',
        type: 'prescription',
        fileName: 'Apollo_Prescription_May2026.pdf',
        doctorName: 'Dr. Ramesh Kumar',
        hospitalName: 'Apollo Clinics - Bengaluru'
      },
      {
        date: '2026-05-18',
        type: 'lab_report',
        fileName: 'Blood_Sugar_LabReport.pdf',
        doctorName: 'Dr. Ramesh Kumar',
        hospitalName: 'DiagnoDB Diagnostics'
      }
    ]
  },
  '12-3456-7890-1234': {
    abhaId: '12-3456-7890-1234',
    name: 'Priya Sharma',
    age: 38,
    gender: 'Female',
    phone: '9988776655',
    email: 'priya.sharma@yahoo.com',
    address: {
      street: 'Sector 4, Dwarka',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110075'
    },
    history: [
      {
        date: '2026-04-10',
        type: 'prescription',
        fileName: 'Fortis_Rx_Priya.pdf',
        doctorName: 'Dr. Anjali Mehta',
        hospitalName: 'Fortis Hospital - Delhi'
      }
    ]
  }
};

export const abdmGateway = {
  requestOTP(abhaId: string): { success: boolean; message: string; transactionId: string } {
    const formattedId = abhaId.trim();
    const exists = MOCK_ABDM_REGISTRY[formattedId] !== undefined || formattedId.length === 17; // Length of 12-3456-7890-1234

    if (!exists) {
      // Just simulate success for user experience during the demo if they type a random valid-looking format
      console.log(`ABHA ID ${formattedId} not in registry, creating mock session.`);
    }

    return {
      success: true,
      message: `OTP successfully sent to the mobile number linked with ABHA ID ${formattedId}. (Hint: Use OTP 123456)`,
      transactionId: `TXN-${Math.floor(Math.random() * 900000 + 100000)}`
    };
  },

  verifyOTP(abhaId: string, otp: string, transactionId: string): { success: boolean; patientRecord?: ABHAPatient; message: string } {
    if (otp !== '123456') {
      return { success: false, message: 'Invalid OTP. Please enter 123456 for testing.' };
    }

    const patientRecord = MOCK_ABDM_REGISTRY[abhaId] || {
      abhaId: abhaId,
      name: 'Simulated ABHA Patient',
      age: 30,
      gender: 'Male',
      phone: '9999988888',
      email: 'simulated.abha@abdm.gov.in',
      address: {
        street: 'ABDM Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      history: []
    };

    return {
      success: true,
      patientRecord,
      message: 'ABHA authentication completed successfully.'
    };
  },

  createNewABHA(aadhaarNo: string): { success: boolean; abhaId: string; message: string } {
    if (aadhaarNo.replace(/-/g, '').length !== 12) {
      return { success: false, abhaId: '', message: 'Invalid Aadhaar number. Must be 12 digits.' };
    }

    const randomAbha = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      abhaId: randomAbha,
      message: `New ABHA ID ${randomAbha} successfully generated and registered.`
    };
  }
};

