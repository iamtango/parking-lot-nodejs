import { ParkingLot, Observer, Car } from '../types';

export const createParkingLot = (capacity: number): ParkingLot => {
  return {
    capacity,
    parkedCars: new Map<string, Car>(),
    observers: [],
    isFull: false
  };
};

export const getAvailableCapacity = (lot: ParkingLot): number => {
  return lot.capacity - lot.parkedCars.size;
};

export const addObserver = (lot: ParkingLot, observer: Observer): void => {
  lot.observers.push(observer);
};

export const park = (lot: ParkingLot, registrationNumber: string): Car => {
  if (getAvailableCapacity(lot) <= 0) {
    throw new Error('Parking lot is full');
  }

  if (lot.parkedCars.has(registrationNumber)) {
    throw new Error('Car already parked');
  }

  const car: Car = { registrationNumber };
  lot.parkedCars.set(registrationNumber, car);

  if (lot.parkedCars.size === lot.capacity) {
    lot.isFull = true;
    lot.observers.forEach(observer => observer.notifyFull());
  }

  return car;
};

export const unpark = (lot: ParkingLot, registrationNumber: string): Car => {
  const car = lot.parkedCars.get(registrationNumber);
  
  if (!car) {
    throw new Error('Car not found');
  }

  const wasFull = lot.isFull;
  lot.parkedCars.delete(registrationNumber);
  lot.isFull = lot.parkedCars.size === lot.capacity; // Should be false now anyway

  if (wasFull && lot.parkedCars.size < lot.capacity) {
    lot.observers.forEach(observer => observer.notifyAvailable());
  }

  return car;
};
