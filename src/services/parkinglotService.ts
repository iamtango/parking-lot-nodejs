import { Car, ParkingStrategy, ParkingResult } from '../types';

export { ParkingResult };
import ParkingLotModel, { IParkingLot, IParkedCar } from '../models/parkinglot';
import ParkingHistoryModel, { ParkingAction } from '../models/parkingHistory';
import AttendantModel, { IAttendant } from '../models/attendant';
import CoordinatorModel, { ICoordinator } from '../models/coordinator';

// Create a new lot in DB
export const createParkingLot = async (lotId: string, capacity: number): Promise<void> => {
  const existing = await ParkingLotModel.findOne({ lotId });
  if (existing) return;
  
  const newLot = new ParkingLotModel({
    lotId,
    capacity,
    parkedCars: [],
    isFull: false
  });
  await newLot.save();
};

export const createAttendant = async (attendantId: string, name: string, managedLotIds: string[]): Promise<void> => {
  const existing = await AttendantModel.findOne({ attendantId });
  if (existing) return;

  const newAttendant = new AttendantModel({
    attendantId,
    name,
    managedLotIds
  });
  await newAttendant.save();
};

export const createCoordinator = async (coordinatorId: string, name: string, managedAttendantIds: string[]): Promise<void> => {
  const existing = await CoordinatorModel.findOne({ coordinatorId });
  if (existing) return;

  const newCoordinator = new CoordinatorModel({
    coordinatorId,
    name,
    managedAttendantIds
  });
  await newCoordinator.save();
};

export const getAvailableCapacityFromDoc = (lot: IParkingLot): number => {
  return lot.capacity - lot.parkedCars.length;
};

// Check if car is already parked in any lot
export const isCarAlreadyParked = async (registrationNumber: string): Promise<boolean> => {
  const lot = await ParkingLotModel.findOne({ 'parkedCars.registrationNumber': registrationNumber });
  return !!lot;
};

export const park = async (lotDoc: IParkingLot, registrationNumber: string): Promise<Car> => {
  if (await isCarAlreadyParked(registrationNumber)) {
    throw new Error('Car already parked in another lot');
  }

  if (getAvailableCapacityFromDoc(lotDoc) <= 0) {
    throw new Error('Parking lot is full');
  }

  lotDoc.parkedCars.push({ registrationNumber, parkedAt: new Date() } as IParkedCar);
  
  if (lotDoc.parkedCars.length === lotDoc.capacity) {
    lotDoc.isFull = true;
    console.log(`📢 Lot ${lotDoc.lotId} is now FULL!`);
  }

  await lotDoc.save();

  // Log to history
  await new ParkingHistoryModel({
    registrationNumber,
    lotId: lotDoc.lotId,
    action: ParkingAction.PARK
  }).save();

  return { registrationNumber };
};

export const unpark = async (registrationNumber: string): Promise<Car> => {
  const lotDoc = await ParkingLotModel.findOne({ 'parkedCars.registrationNumber': registrationNumber });
  
  if (!lotDoc) {
    throw new Error('Car not found');
  }

  const wasFull = lotDoc.isFull;
  lotDoc.parkedCars = lotDoc.parkedCars.filter(
    (car: IParkedCar) => car.registrationNumber !== registrationNumber
  );
  lotDoc.isFull = false;

  await lotDoc.save();

  // Log to history
  await new ParkingHistoryModel({
    registrationNumber,
    lotId: lotDoc.lotId,
    action: ParkingAction.UNPARK
  }).save();

  if (wasFull) {
    console.log(`📢 Lot ${lotDoc.lotId} now has available space!`);
  }

  return { registrationNumber };
};

export const directCarToAvailableLot = async (lotIds: string[], registrationNumber: string, strategy: ParkingStrategy): Promise<ParkingResult> => {
  const lots = await ParkingLotModel.find({ lotId: { $in: lotIds } });
  const availableLots = lots.filter(lot => getAvailableCapacityFromDoc(lot) > 0);

  if (availableLots.length === 0) {
    throw new Error('No available parking lots');
  }

  let targetLot: IParkingLot;

  switch (strategy) {
    case ParkingStrategy.FIRST_AVAILABLE:
      targetLot = availableLots[0];
      break;
    
    case ParkingStrategy.LEAST_AVAILABLE:
      targetLot = availableLots.sort((a, b) => getAvailableCapacityFromDoc(a) - getAvailableCapacityFromDoc(b))[0];
      break;

    case ParkingStrategy.MOST_AVAILABLE:
      targetLot = availableLots.sort((a, b) => getAvailableCapacityFromDoc(b) - getAvailableCapacityFromDoc(a))[0];
      break;
    
    default:
      targetLot = availableLots[0];
  }

  const car = await park(targetLot, registrationNumber);
  return { car, lotId: targetLot.lotId };
};

export const directCarThroughAttendant = async (attendantId: string, registrationNumber: string, strategy: ParkingStrategy): Promise<ParkingResult> => {
  const attendant = await AttendantModel.findOne({ attendantId });
  if (!attendant) {
    throw new Error('Attendant not found');
  }

  return await directCarToAvailableLot(attendant.managedLotIds, registrationNumber, strategy);
};

export const directCarThroughCoordinator = async (coordinatorId: string, registrationNumber: string, strategy: ParkingStrategy): Promise<ParkingResult> => {
  const coordinator = await CoordinatorModel.findOne({ coordinatorId });
  if (!coordinator) {
    throw new Error('Coordinator not found');
  }

  if (await isCarAlreadyParked(registrationNumber)) {
    throw new Error('Car already parked');
  }

  const attendants = await AttendantModel.find({ attendantId: { $in: coordinator.managedAttendantIds } });
  
  // Find an attendant that has at least one lot with space
  for (const attendant of attendants) {
    try {
      const result = await directCarThroughAttendant(attendant.attendantId, registrationNumber, strategy);
      return { ...result, attendantId: attendant.attendantId };
    } catch (e) {
      // If this attendant couldn't find a spot, try the next one
      continue;
    }
  }

  throw new Error('No available attendants with free parking spots');
};

export const getStatus = async () => {
  const lots = await ParkingLotModel.find();
  return lots.map(lot => ({
    id: lot.lotId,
    capacity: lot.capacity,
    availableCapacity: getAvailableCapacityFromDoc(lot),
    isFull: lot.isFull,
    parkedCarsCount: lot.parkedCars.length
  }));
};

export const getHistory = async (registrationNumber?: string) => {
  const query = registrationNumber ? { registrationNumber } : {};
  return await ParkingHistoryModel.find(query).sort({ createdAt: -1 });
};
