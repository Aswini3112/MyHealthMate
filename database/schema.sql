-- MyHealthMate PostgreSQL Schema (AWS RDS)
-- MongoDB/DocumentDB used for document metadata in production architecture

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abha_id VARCHAR(28) UNIQUE,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  gender VARCHAR(10),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  address JSONB,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  s3_url VARCHAR(255),
  ocr_text TEXT,
  extracted_data JSONB,
  upload_date TIMESTAMP DEFAULT NOW(),
  doctor_name VARCHAR(100),
  hospital_name VARCHAR(100),
  is_shared BOOLEAN DEFAULT FALSE,
  share_count INTEGER DEFAULT 0
);

CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL NOT NULL,
  unit VARCHAR(20),
  recorded_date TIMESTAMP DEFAULT NOW(),
  normal_range_min DECIMAL,
  normal_range_max DECIMAL
);

CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'english',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doctor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(100),
  access_type VARCHAR(20) NOT NULL,
  qr_code_hash VARCHAR(255),
  otp_code VARCHAR(6),
  allowed_records JSONB,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  accessed_at TIMESTAMP
);

CREATE INDEX idx_documents_patient ON medical_documents(patient_id);
CREATE INDEX idx_metrics_patient ON health_metrics(patient_id);
CREATE INDEX idx_doctor_access_patient ON doctor_access(patient_id);
