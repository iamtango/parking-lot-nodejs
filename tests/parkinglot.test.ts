import * as parkinglotService from '../src/services/parkinglotService';
import { ParkingStrategy } from '../src/types';
import mongoose from 'mongoose';
import ParkingLotModel from '../src/models/parkinglot';
import AttendantModel from '../src/models/attendant';
import CoordinatorModel from '../src/models/coordinator';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Parking System Hierarchy', () => {
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
    await AttendantModel.deleteMany({});
    await CoordinatorModel.deleteMany({});
    
    // Setup initial state
    await parkinglotService.createParkingLot('LOT-1', 2);
    await parkinglotService.createParkingLot('LOT-2', 5);
    await parkinglotService.createAttendant('ATT-1', 'Attendant 1', ['LOT-1']);
    await parkinglotService.createAttendant('ATT-2', 'Attendant 2', ['LOT-2']);
    await parkinglotService.createCoordinator('COORD-1', 'Coordinator 1', ['ATT-1', 'ATT-2']);
  });

  test('should reduce capacity when car is parked through coordinator', async () => {
    const result = await parkinglotService.directCarThroughCoordinator('COORD-1', 'CAR-1', ParkingStrategy.FIRST_AVAILABLE);
    expect(result.lotId).toBe('LOT-1');
    expect(result.attendantId).toBe('ATT-1');
    
    const updatedStatus = await parkinglotService.getStatus();
    const lot1 = updatedStatus.find(l => l.id === 'LOT-1');
    expect(lot1?.availableCapacity).toBe(1);
  });

  test('should fail when car is already parked', async () => {
    await parkinglotService.directCarThroughCoordinator('COORD-1', 'DUPLICATE', ParkingStrategy.FIRST_AVAILABLE);
    
    await expect(parkinglotService.directCarThroughCoordinator('COORD-1', 'DUPLICATE', ParkingStrategy.FIRST_AVAILABLE))
      .rejects.toThrow('Car already parked');
  });

  test('should direct to second attendant if first attendant lots are full', async () => {
    // Fill LOT-1 (managed by ATT-1)
    await parkinglotService.directCarThroughAttendant('ATT-1', 'CAR-A1', ParkingStrategy.FIRST_AVAILABLE);
    await parkinglotService.directCarThroughAttendant('ATT-1', 'CAR-A2', ParkingStrategy.FIRST_AVAILABLE);

    // Coordinate new car
    const result = await parkinglotService.directCarThroughCoordinator('COORD-1', 'CAR-B1', ParkingStrategy.FIRST_AVAILABLE);
    expect(result.attendantId).toBe('ATT-2');
    expect(result.lotId).toBe('LOT-2');
  });

  test('should increase capacity when car is unparked', async () => {
    await parkinglotService.directCarThroughCoordinator('COORD-1', 'TEMP-CAR', ParkingStrategy.FIRST_AVAILABLE);
    await parkinglotService.unpark('TEMP-CAR');
    
    const updatedStatus = await parkinglotService.getStatus();
    const lot1 = updatedStatus.find(l => l.id === 'LOT-1');
    expect(lot1?.availableCapacity).toBe(2);
  });

  describe('Attendant Strategies', () => {
    test('should pak in least available lot (packing strategy)', async () => {
      // Setup: ATT-1 manages LOT-A(5) and LOT-B(5)
      await parkinglotService.createParkingLot('LOT-A', 5);
      await parkinglotService.createParkingLot('LOT-B', 5);
      await parkinglotService.createAttendant('ATT-STRAT', 'Strat Attendant', ['LOT-A', 'LOT-B']);
      
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

      const result = await parkinglotService.directCarThroughAttendant('ATT-STRAT', 'NEW-CAR', ParkingStrategy.LEAST_AVAILABLE);
      expect(result.lotId).toBe('LOT-B');
    });
  });
});
