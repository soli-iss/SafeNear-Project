import { Router } from 'express';
import { getUsers, getUserById, insertUser, updateUser, deleteUser } from '../controllers/users.js';
import { requireAdmin } from '../controllers/auth.js';

const router = Router();

router.get('/', requireAdmin, getUsers);
router.get('/:id', requireAdmin, getUserById);
router.post('/', requireAdmin, insertUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;