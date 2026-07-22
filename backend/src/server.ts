import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import attributeRoutes from './routes/attributes';
import positionRoutes from './routes/positions';
import profileRoutes from './routes/profile';
import cvRoutes from './routes/cvs';
import searchRoutes from './routes/search';
import statsRoutes from './routes/stats';

import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(authenticateToken);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Recroot backend server listening on port ${PORT}`);
});
