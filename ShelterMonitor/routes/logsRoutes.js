import { Router } from 'express';
import { getLogs } from '../controllers/logs.js';
import { requireAdmin } from '../controllers/auth.js';

const router = Router();

router.get('/', requireAdmin, getLogs);

export default router;
