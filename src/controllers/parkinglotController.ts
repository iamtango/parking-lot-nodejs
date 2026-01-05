import { Request, Response } from 'express';
import * as parkinglotService from '../services/parkinglotService';
import { ParkingStrategy } from '../types';

// Initialize lots, attendants, and coordinators in DB if they don't exist
(async () => {
  try {
    // 1. Create Lots
    await parkinglotService.createParkingLot('LOT-1', 10);
    await parkinglotService.createParkingLot('LOT-2', 5);
    await parkinglotService.createParkingLot('LOT-3', 8);

    // 2. Create Attendants
    await parkinglotService.createAttendant('ATT-1', 'Attendant One', ['LOT-1', 'LOT-2']);
    await parkinglotService.createAttendant('ATT-2', 'Attendant Two', ['LOT-3']);

    // 3. Create Coordinators
    await parkinglotService.createCoordinator('COORD-1', 'Coordinator One', ['ATT-1', 'ATT-2']);
    
    console.log('✅ Monitoring system initialized (Lots, Attendants, Coordinators)');
  } catch (error) {
    console.error('Error initializing system:', error);
  }
})();

export const parkCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationNumber, strategy, attendantId, coordinatorId } = req.body;
    if (!registrationNumber) {
      res.status(400).json({ success: false, message: 'Registration number is required' });
      return;
    }

    const parkStrategy = (strategy as ParkingStrategy) || ParkingStrategy.FIRST_AVAILABLE;
    
    let result: parkinglotService.ParkingResult;
    if (coordinatorId) {
      // Direct through coordinator
      result = await parkinglotService.directCarThroughCoordinator(coordinatorId, registrationNumber, parkStrategy);
    } else if (attendantId) {
      // Direct through attendant
      result = await parkinglotService.directCarThroughAttendant(attendantId, registrationNumber, parkStrategy);
    } else {
      // Default: Direct through all known lots
      const allLots = await parkinglotService.getStatus();
      const allLotIds = allLots.map(l => l.id);
      result = await parkinglotService.directCarToAvailableLot(allLotIds, registrationNumber, parkStrategy);
    }
    
    res.status(201).json({ 
      success: true, 
      data: result.car, 
      lotId: result.lotId,
      attendantId: result.attendantId,
      message: `Car parked successfully in ${result.lotId}`
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
