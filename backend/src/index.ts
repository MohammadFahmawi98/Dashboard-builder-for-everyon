import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboards';
import dataSourceRoutes from './routes/dataSources';
import widgetRoutes from './routes/widgets';
import workspaceRoutes from './routes/workspaces';
import queryRoutes from './routes/queries';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173', // Add other allowed origins here
  // Add other origins as needed
];

const corsOptions = {
  origin: function (origin, callback) {
    // Explicitly allow only defined origins, block all others
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
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
app.use('/queries', queryRoutes);

app.listen(PORT, async () => {
  await connectRedis();
  console.log(`DASHLY server running on http://localhost:${PORT}`);
});

export default app;