import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import mapRoutes from './routes/mapsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import { actionLogger } from './controllers/logs.js';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from './utils/errors.js';


import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.NODE_LOCAL_PORT || 8080;

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public')));

// Custom CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(actionLogger);

app.use('/maps', mapRoutes);
app.use('/users', userRoutes);
app.use('/shelters', shelterRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/logs', logsRoutes);


//error handling middleware
app.use((err, req, res, next) => {
  console.log("Error occurred:", err);
  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });
  }
  else if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
  }
  else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });
  }
  else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  }
  else {
    console.log("Unexpected error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});