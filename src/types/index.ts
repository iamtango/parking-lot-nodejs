export interface Car {
  registrationNumber: string;
}

export interface Observer {
  notifyFull: () => void;
  notifyAvailable: () => void;
}

export interface ParkingLot {
  capacity: number;
  parkedCars: Map<string, Car>; // Store the car object
  observers: Observer[];
  isFull: boolean;
}
