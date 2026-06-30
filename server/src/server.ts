import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './dbStore';
import apiRouter from './routes/api';
import personalDetailsRouter from './routes/personalDetails';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for easier hackathon testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploads folder as static files for documents
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API routes prefix
app.use('/api', apiRouter);
app.use('/api', personalDetailsRouter);

// Basic health check endpoint

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start server and connect DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`MyHealthMate backend running on http://localhost:${PORT}`);
  });
};

startServer();
