import { Router } from 'express';
import * as taskController from '../controllers/taskController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', taskController.listTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/complete', taskController.completeTask);
router.patch('/:id/reopen', taskController.reopenTask);
router.get('/:id/history', taskController.getTaskHistory);

export default router;
