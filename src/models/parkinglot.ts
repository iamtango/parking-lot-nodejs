import mongoose, { Schema, Document } from 'mongoose';

export interface IParkedCar {
  registrationNumber: string;
  parkedAt: Date;
}

export interface IParkingLot extends Document {
  lotId: string;
  capacity: number;
  parkedCars: IParkedCar[];
  isFull: boolean;
}

const ParkedCarSchema = new Schema<IParkedCar>({
  registrationNumber: { type: String, required: true },
  parkedAt: { type: Date, default: Date.now }
});

const ParkingLotSchema = new Schema<IParkingLot>({
  lotId: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  parkedCars: [ParkedCarSchema],
  isFull: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for fast lookup by registration number across all lots
ParkingLotSchema.index({ 'parkedCars.registrationNumber': 1 });

export default mongoose.model<IParkingLot>('ParkingLot', ParkingLotSchema);
