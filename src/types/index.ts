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

export interface Attendant {
  id: string;
  name: string;
  managedLotIds: string[];
}

export interface Coordinator {
  id: string;
  name: string;
  managedAttendantIds: string[];
}

export interface ParkingResult {
  car: Car;
  lotId: string;
  attendantId?: string;
  message?: string;
}
