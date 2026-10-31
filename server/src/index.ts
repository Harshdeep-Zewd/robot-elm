import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS & JSON body parsing with high limit for global state synchronization
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve static artifacts if available
app.use('/artifacts', express.static(path.join('/tmp', 'artifacts')));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RoboServ ELM API', timestamp: new Date().toISOString() });
});

// Catch-all 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler returning valid JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start standalone server if not running in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🤖 Restaurant Robot ELM Platform API Server Running!`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

// Export default app for Vercel Serverless Function compatibility
export default app;
