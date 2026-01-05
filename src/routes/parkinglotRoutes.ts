import { Router } from 'express';
import * as parkinglotController from '../controllers/parkinglotController';

const router = Router();

router.post('/park', parkinglotController.parkCar);
router.delete('/unpark/:registrationNumber', parkinglotController.unparkCar);
router.get('/status', parkinglotController.getStatus);
router.get('/history', parkinglotController.getHistory);

export default router;
