import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Patient, MedicalDocument, HealthMetric, ChatbotConversation, DoctorAccess } from './models';

// Fallback JSON DB Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface for Fallback Database State
interface FallbackDB {
  patients: any[];
  documents: any[];
  metrics: any[];
  conversations: any[];
  doctorAccess: any[];
  personalDetails: any[];
}

let isMongoConnected = false;
let localDB: FallbackDB = {
  patients: [],
  documents: [],
  metrics: [],
  conversations: [],
  doctorAccess: [],
  personalDetails: []
};

// Initialize directory and JSON file
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (fs.existsSync(DB_FILE)) {
  try {
    localDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to parse local db.json, resetting database.', err);
  }
} else {
  saveLocalDB();
}

function saveLocalDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(localDB, null, 2), 'utf8');
}

// Generate standard UUID-like string for mock entries
function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}

export async function connectDB(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/myhealthmate';
  console.log(`Connecting to database: ${mongoUri}...`);
  try {
    // Set 2 seconds connection timeout for fast fallback
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('MongoDB successfully connected.');
  } catch (err) {
    isMongoConnected = false;
    console.warn('MongoDB connection failed. Falling back to local JSON database at:', DB_FILE);
  }
}

export const dbStore = {
  isUsingMongo: () => isMongoConnected,

  // --- PERSONAL DETAILS ---
  personalDetails: {
    async findOne(filter: any) {
      if (isMongoConnected) {
        // @ts-ignore
        return await (await import('./models')).PersonalDetails.findOne(filter).lean();
      }
      return (localDB as any).personalDetails?.find((d: any) => {
        for (const key in filter) {
          if (filter[key] && d[key] !== filter[key]) return false;
        }
        return true;
      }) || null;
    },

    async create(data: any) {
      if (isMongoConnected) {
        const { PersonalDetails } = await import('./models');
        const doc = new PersonalDetails({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newDoc = {
        _id: generateId(),
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      (localDB as any).personalDetails = (localDB as any).personalDetails || [];
      (localDB as any).personalDetails.push(newDoc);
      saveLocalDB();
      return newDoc;
    },

    async findByIdAndUpdate(id: string, update: any) {
      if (isMongoConnected) {
        const { PersonalDetails } = await import('./models');
        return await PersonalDetails.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const list = (localDB as any).personalDetails || [];
      const index = list.findIndex((d: any) => d._id === id || d.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...update, updatedAt: new Date() };
      (localDB as any).personalDetails = list;
      saveLocalDB();
      return list[index];
    }
  },

  // --- PATIENTS ---
  patients: {
    async findOne(filter: any) {
      if (isMongoConnected) {
        return await Patient.findOne(filter).lean();
      }
      return localDB.patients.find(p => {
        for (const key in filter) {
          if (p[key] !== filter[key]) return false;
        }
        return true;
      }) || null;
    },

    async findById(id: string) {
      if (isMongoConnected) {
        return await Patient.findById(id).lean();
      }
      return localDB.patients.find(p => p._id === id || p.id === id) || null;
    },

    async create(data: any) {
      if (isMongoConnected) {
        const doc = new Patient({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newPatient = {
        _id: generateId(),
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      localDB.patients.push(newPatient);
      saveLocalDB();
      return newPatient;
    },

    async findByIdAndUpdate(id: string, update: any) {
      if (isMongoConnected) {
        return await Patient.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const index = localDB.patients.findIndex(p => p._id === id || p.id === id);
      if (index === -1) return null;
      localDB.patients[index] = {
        ...localDB.patients[index],
        ...update,
        updatedAt: new Date()
      };
      saveLocalDB();
      return localDB.patients[index];
    }
  },

  // --- MEDICAL DOCUMENTS ---
  documents: {
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await MedicalDocument.find(filter).lean();
      }
      return localDB.documents.filter(doc => {
        for (const key in filter) {
          if (filter[key] && doc[key] !== filter[key]) return false;
        }
        return true;
      });
    },

    async findById(id: string) {
      if (isMongoConnected) {
        return await MedicalDocument.findById(id).lean();
      }
      return localDB.documents.find(d => d._id === id || d.id === id) || null;
    },

    async create(data: any) {
      if (isMongoConnected) {
        const doc = new MedicalDocument({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newDoc = {
        _id: generateId(),
        id: generateId(),
        isShared: false,
        shareCount: 0,
        versions: [],
        uploadDate: new Date(),
        ...data
      };
      localDB.documents.push(newDoc);
      saveLocalDB();
      return newDoc;
    },

    async findByIdAndUpdate(id: string, update: any) {
      if (isMongoConnected) {
        return await MedicalDocument.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const index = localDB.documents.findIndex(d => d._id === id || d.id === id);
      if (index === -1) return null;
      localDB.documents[index] = {
        ...localDB.documents[index],
        ...update
      };
      saveLocalDB();
      return localDB.documents[index];
    }
  },

  // --- HEALTH METRICS ---
  metrics: {
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await HealthMetric.find(filter).sort({ recordedDate: 1 }).lean();
      }
      return localDB.metrics
        .filter(m => {
          for (const key in filter) {
            if (filter[key] && m[key] !== filter[key]) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime());
    },

    async create(data: any) {
      if (isMongoConnected) {
        const doc = new HealthMetric({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newMetric = {
        _id: generateId(),
        id: generateId(),
        recordedDate: new Date(),
        ...data
      };
      localDB.metrics.push(newMetric);
      saveLocalDB();
      return newMetric;
    }
  },

  // --- CHATBOT CONVERSATIONS ---
  conversations: {
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await ChatbotConversation.find(filter).sort({ createdAt: 1 }).lean();
      }
      return localDB.conversations
        .filter(c => {
          for (const key in filter) {
            if (filter[key] && c[key] !== filter[key]) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    async create(data: any) {
      if (isMongoConnected) {
        const doc = new ChatbotConversation({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newConversation = {
        _id: generateId(),
        id: generateId(),
        createdAt: new Date(),
        ...data
      };
      localDB.conversations.push(newConversation);
      saveLocalDB();
      return newConversation;
    }
  },

  // --- DOCTOR ACCESS ---
  doctorAccess: {
    async find(filter: any = {}) {
      if (isMongoConnected) {
        return await DoctorAccess.find(filter).lean();
      }
      return localDB.doctorAccess.filter(a => {
        for (const key in filter) {
          if (filter[key] && a[key] !== filter[key]) return false;
        }
        return true;
      });
    },

    async findOne(filter: any) {
      if (isMongoConnected) {
        return await DoctorAccess.findOne(filter).lean();
      }
      return localDB.doctorAccess.find(a => {
        for (const key in filter) {
          if (a[key] !== filter[key]) return false;
        }
        return true;
      }) || null;
    },

    async findById(id: string) {
      if (isMongoConnected) {
        return await DoctorAccess.findById(id).lean();
      }
      return localDB.doctorAccess.find(a => a._id === id || a.id === id) || null;
    },

    async create(data: any) {
      if (isMongoConnected) {
        const doc = new DoctorAccess({ ...data });
        const saved = await doc.save();
        return saved.toObject();
      }
      const newAccess = {
        _id: generateId(),
        id: generateId(),
        isUsed: false,
        ...data
      };
      localDB.doctorAccess.push(newAccess);
      saveLocalDB();
      return newAccess;
    },

    async findByIdAndUpdate(id: string, update: any) {
      if (isMongoConnected) {
        return await DoctorAccess.findByIdAndUpdate(id, update, { new: true }).lean();
      }
      const index = localDB.doctorAccess.findIndex(a => a._id === id || a.id === id);
      if (index === -1) return null;
      localDB.doctorAccess[index] = {
        ...localDB.doctorAccess[index],
        ...update
      };
      saveLocalDB();
      return localDB.doctorAccess[index];
    }
  }
};
