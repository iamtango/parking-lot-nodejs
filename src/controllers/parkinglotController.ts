import { Request, Response } from 'express';
import * as parkinglotService from '../services/parkinglotService';

// For simplicity in this demo, we use a single global parking lot
// In a real app, this might come from a database
const myParkingLot = parkinglotService.createParkingLot(10);

// Basic owner for notification demonstration
const owner = {
  notifyFull: () => console.log('📢 Owner notified: Parking Lot is FULL!'),
  notifyAvailable: () => console.log('📢 Owner notified: Parking Lot is AVAILABLE!')
};
parkinglotService.addObserver(myParkingLot, owner);

export const parkCar = (req: Request, res: Response): void => {
  try {
    const { registrationNumber } = req.body;
    if (!registrationNumber) {
      res.status(400).json({ success: false, message: 'Registration number is required' });
      return;
    }
    const car = parkinglotService.park(myParkingLot, registrationNumber);
    res.status(201).json({ success: true, data: car, availableCapacity: parkinglotService.getAvailableCapacity(myParkingLot) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, message });
  }
};

export const unparkCar = (req: Request, res: Response): void => {
  try {
    const { registrationNumber } = req.params;
    const car = parkinglotService.unpark(myParkingLot, registrationNumber);
    res.status(200).json({ success: true, data: car, availableCapacity: parkinglotService.getAvailableCapacity(myParkingLot) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message === 'Car not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, message });
  }
};

export const getStatus = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    capacity: myParkingLot.capacity,
    availableCapacity: parkinglotService.getAvailableCapacity(myParkingLot),
    isFull: myParkingLot.isFull,
    parkedCarsCount: myParkingLot.parkedCars.size
  });
};
