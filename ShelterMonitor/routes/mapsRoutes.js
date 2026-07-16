import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMaps, getMapById, insertMap, updateMap, deleteMap } from '../controllers/maps.js';
import { requireAdmin } from '../controllers/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

const router = Router();

router.get('/', getMaps);
router.get('/:id', getMapById);
router.post('/', requireAdmin, upload.single('mapFile'), insertMap);
router.put('/:id', requireAdmin, upload.single('mapFile'), updateMap);
router.delete('/:id', requireAdmin, deleteMap);

export default router;