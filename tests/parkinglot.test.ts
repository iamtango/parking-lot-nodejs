import { createParkingLot, park, unpark, getAvailableCapacity, addObserver } from '../src/services/parkinglotService';
import { ParkingLot, Observer } from '../src/types';

interface TestOwner extends Observer {
  notifiedFull: boolean;
  notifiedAvailable: boolean;
}

describe('Parking Lot', () => {
  let parkingLot: ParkingLot;
  let owner: TestOwner;

  beforeEach(() => {
    parkingLot = createParkingLot(2);
    owner = {
      notifiedFull: false,
      notifiedAvailable: false,
      notifyFull: function(this: TestOwner) { this.notifiedFull = true; },
      notifyAvailable: function(this: TestOwner) { this.notifiedAvailable = true; }
    };
    addObserver(parkingLot, owner);
  });

  test('should reduce capacity when car is parked', () => {
    park(parkingLot, 'KA-01-HH-1234');
    expect(getAvailableCapacity(parkingLot)).toBe(1);
  });

  test('should increase capacity when car is unparked', () => {
    park(parkingLot, 'KA-01-HH-1234');
    unpark(parkingLot, 'KA-01-HH-1234');
    expect(getAvailableCapacity(parkingLot)).toBe(2);
  });

  test('should fail when unparking a car that was not parked with right reason', () => {
    expect(() => unpark(parkingLot, 'NOT-PARKED')).toThrow('Car not found');
  });

  test('should notify owner when parking lot is full', () => {
    park(parkingLot, 'CAR-1');
    park(parkingLot, 'CAR-2');
    expect(owner.notifiedFull).toBe(true);
  });

  test('should notify owner when parking lot becomes available again', () => {
    park(parkingLot, 'CAR-1');
    park(parkingLot, 'CAR-2'); // Lot is full here
    unpark(parkingLot, 'CAR-1'); // Lot becomes available
    expect(owner.notifiedAvailable).toBe(true);
  });

  test('should not notify available if it was not full', () => {
    park(parkingLot, 'CAR-1');
    unpark(parkingLot, 'CAR-1');
    expect(owner.notifiedAvailable).toBe(false);
  });

  test('should properly unpark the car and return it', () => {
    park(parkingLot, 'KA-01-HH-1234');
    const unparkedCar = unpark(parkingLot, 'KA-01-HH-1234');
    expect(unparkedCar.registrationNumber).toBe('KA-01-HH-1234');
    expect(parkingLot.parkedCars.has('KA-01-HH-1234')).toBe(false);
  });
});
