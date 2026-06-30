import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IPersonalDetails extends Document {
  patientId: mongoose.Types.ObjectId | string;
  bloodGroup?: string;
  allergies?: string[];
  existingDiseases?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
  emergencyContacts?: IEmergencyContact[];

  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String, required: true }
});

const PersonalDetailsSchema = new Schema<IPersonalDetails>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true },
    bloodGroup: { type: String, default: '' },
    allergies: { type: [String], default: [] },
    existingDiseases: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    medicalHistory: { type: [String], default: [] },
    emergencyContacts: { type: [EmergencyContactSchema], default: [] }
  },
  { timestamps: true }
);

export const PersonalDetails = mongoose.model<IPersonalDetails>('PersonalDetails', PersonalDetailsSchema);

