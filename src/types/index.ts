export interface Car {
  registrationNumber: string;
}

export interface Observer {
  notifyFull: () => void;
  notifyAvailable: () => void;
}

export interface ParkingLot {
  id: string;
  capacity: number;
  parkedCars: Map<string, Car>;
  observers: Observer[];
  isFull: boolean;
}

export enum ParkingStrategy {
  FIRST_AVAILABLE = 'FIRST_AVAILABLE',
  LEAST_AVAILABLE = 'LEAST_AVAILABLE',
  MOST_AVAILABLE = 'MOST_AVAILABLE'
}
