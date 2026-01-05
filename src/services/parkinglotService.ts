import { Car, ParkingStrategy } from '../types';
import ParkingLotModel, { IParkingLot, IParkedCar } from '../models/parkinglot';
import ParkingHistoryModel, { ParkingAction } from '../models/parkingHistory';

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

export const directCar = async (registrationNumber: string, strategy: ParkingStrategy): Promise<{ car: Car, lotId: string }> => {
  if (await isCarAlreadyParked(registrationNumber)) {
    throw new Error('Car already parked');
  }

  const allLots = await ParkingLotModel.find();
  const availableLots = allLots.filter(lot => getAvailableCapacityFromDoc(lot) > 0);

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
