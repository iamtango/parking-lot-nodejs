import { Request, Response } from 'express';
import * as parkinglotService from '../services/parkinglotService';
import { ParkingStrategy } from '../types';

// Initialize lots in DB if they don't exist
(async () => {
  try {
    await parkinglotService.createParkingLot('LOT-1', 10);
    await parkinglotService.createParkingLot('LOT-2', 5);
  } catch (error) {
    console.error('Error initializing lots:', error);
  }
})();

export const parkCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationNumber, strategy } = req.body;
    if (!registrationNumber) {
      res.status(400).json({ success: false, message: 'Registration number is required' });
      return;
    }

    const parkStrategy = (strategy as ParkingStrategy) || ParkingStrategy.FIRST_AVAILABLE;
    const result = await parkinglotService.directCar(registrationNumber, parkStrategy);
    
    res.status(201).json({ 
      success: true, 
      data: result.car, 
      lotId: result.lotId,
      message: `Car parked in ${result.lotId}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, message });
  }
};

export const unparkCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationNumber } = req.params;
    const car = await parkinglotService.unpark(registrationNumber);
    
    res.status(200).json({ 
      success: true, 
      data: car, 
      message: `Car unparked successfully`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message === 'Car not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, message });
  }
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const lotsStatus = await parkinglotService.getStatus();
    
    res.status(200).json({
      success: true,
      lots: lotsStatus,
      totalCapacity: lotsStatus.reduce((acc, lot) => acc + lot.capacity, 0),
      totalParked: lotsStatus.reduce((acc, lot) => acc + lot.parkedCarsCount, 0)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationNumber } = req.query;
    const history = await parkinglotService.getHistory(registrationNumber as string);
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
};
