import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboards';
import dataSourceRoutes from './routes/dataSources';
import widgetRoutes from './routes/widgets';
import workspaceRoutes from './routes/workspaces';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'dashly-api', version: '0.1.0', docs: '/health' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dashly-api', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/dashboards', dashboardRoutes);
app.use('/data-sources', dataSourceRoutes);
app.use('/widgets', widgetRoutes);
app.use('/workspaces', workspaceRoutes);

app.listen(PORT, async () => {
  await connectRedis();
  console.log(`DASHLY server running on http://localhost:${PORT}`);
});

export default app;
