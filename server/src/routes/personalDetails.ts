import express, { Request, Response } from 'express';
import { dbStore } from '../dbStore';

const router = express.Router();

// Get personal details by patientId
router.get('/personal/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const details = await dbStore.personalDetails.findOne({ patientId });
    return res.json({ success: true, details: details || null });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Create or update personal details
router.post('/personal/upsert', async (req: Request, res: Response) => {
  try {
    const { patientId, bloodGroup, allergies, existingDiseases, currentMedications, medicalHistory, emergencyContacts } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const existing = await dbStore.personalDetails.findOne({ patientId });

    if (!existing) {
      const created = await dbStore.personalDetails.create({
        patientId,
        bloodGroup,
        allergies,
        existingDiseases,
        currentMedications,
        medicalHistory,
        emergencyContacts
      });
      return res.json({ success: true, details: created, message: 'Personal details created.' });
    }

    const updated = await dbStore.personalDetails.findByIdAndUpdate(existing._id || existing.id, {
      bloodGroup,
      allergies,
      existingDiseases,
      currentMedications,
      medicalHistory,
      emergencyContacts
    });

    return res.json({ success: true, details: updated, message: 'Personal details updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

export default router;

