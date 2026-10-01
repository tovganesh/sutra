import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';

const router = Router();

router.get('/', ProjectController.getProjects);
router.post('/', ProjectController.createProject);
router.get('/:id', ProjectController.getProjectById);
router.post('/:id/wbs', ProjectController.addWbs);
router.post('/:id/milestones', ProjectController.addMilestone);
router.post('/:id/milestones/:milestoneId/achieve', ProjectController.achieveMilestone);
router.get('/:id/poc', ProjectController.getPoc);
router.post('/:id/commitments', ProjectController.recordCommitment);
router.post('/:id/actual-cost', ProjectController.recordActualCost);
router.post('/:id/settle-cwip', ProjectController.settleCwip);

export default router;
