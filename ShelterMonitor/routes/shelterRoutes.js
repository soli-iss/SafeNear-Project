import { Router } from 'express';
import { getShelters, getShelterById, insertShelter, updateShelter, deleteShelter } from '../controllers/shelter.js';
import { requireAdmin } from '../controllers/auth.js';

const router = Router();

router.get('/', getShelters);
router.get('/:id', getShelterById);
router.post('/', requireAdmin, insertShelter);
router.put('/:id', requireAdmin, updateShelter);
router.delete('/:id', requireAdmin, deleteShelter);

export default router;
