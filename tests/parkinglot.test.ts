import * as parkinglotService from '../src/services/parkinglotService';
import { ParkingStrategy } from '../src/types';
import mongoose from 'mongoose';
import ParkingLotModel, { IParkingLot } from '../src/models/parkinglot';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Parking Lot MongoDB Persistence', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ParkingLotModel.deleteMany({});
    await parkinglotService.createParkingLot('LOT-1', 2);
  });

  test('should reduce capacity when car is parked', async () => {
    const lot = await ParkingLotModel.findOne({ lotId: 'LOT-1' });
    if (lot) {
      await parkinglotService.park(lot, 'KA-01-HH-1234');
    }
    
    const updatedStatus = await parkinglotService.getStatus();
    expect(updatedStatus[0].availableCapacity).toBe(1);
  });

  test('should fail when parking the same car twice across any lot', async () => {
    await parkinglotService.createParkingLot('LOT-2', 5);
    const lot1 = await ParkingLotModel.findOne({ lotId: 'LOT-1' });
    
    if (lot1) {
      await parkinglotService.park(lot1, 'DUPLICATE');
    }
    
    await expect(parkinglotService.directCar('DUPLICATE', ParkingStrategy.FIRST_AVAILABLE))
      .rejects.toThrow('Car already parked');
  });

  test('should increase capacity when car is unparked', async () => {
    const lot = await ParkingLotModel.findOne({ lotId: 'LOT-1' });
    if (lot) {
      await parkinglotService.park(lot, 'KA-01-HH-1234');
    }
    await parkinglotService.unpark('KA-01-HH-1234');
    
    const updatedStatus = await parkinglotService.getStatus();
    expect(updatedStatus[0].availableCapacity).toBe(2);
  });

  describe('Attendant Strategies', () => {
    beforeEach(async () => {
      await ParkingLotModel.deleteMany({});
      await parkinglotService.createParkingLot('LOT-A', 5);
      await parkinglotService.createParkingLot('LOT-B', 5);
    });

    test('should direct car to first available lot', async () => {
      const result = await parkinglotService.directCar('CAR-A', ParkingStrategy.FIRST_AVAILABLE);
      expect(result.lotId).toBe('LOT-A');
    });

    test('should park in least available lot (packing strategy)', async () => {
      // Park one car in LOT-A and three in LOT-B
      // LOT-A: 4 spaces left
      // LOT-B: 2 spaces left (Least available)
      const lotA = await ParkingLotModel.findOne({ lotId: 'LOT-A' });
      const lotB = await ParkingLotModel.findOne({ lotId: 'LOT-B' });
      
      if (lotA && lotB) {
        await parkinglotService.park(lotA, 'A1');
        await parkinglotService.park(lotB, 'B1');
        await parkinglotService.park(lotB, 'B2');
        await parkinglotService.park(lotB, 'B3');
      }

      const result = await parkinglotService.directCar('NEW-CAR', ParkingStrategy.LEAST_AVAILABLE);
      expect(result.lotId).toBe('LOT-B');
    });
  });
});
