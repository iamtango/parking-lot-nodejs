import mongoose, { Schema, Document } from 'mongoose';

export enum ParkingAction {
  PARK = 'PARK',
  UNPARK = 'UNPARK'
}

export interface IParkingHistory extends Document {
  registrationNumber: string;
  lotId: string;
  action: ParkingAction;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingHistorySchema = new Schema<IParkingHistory>({
  registrationNumber: { type: String, required: true },
  lotId: { type: String, required: true },
  action: { type: String, enum: Object.values(ParkingAction), required: true },
}, {
  timestamps: true 
});

// Index for fast lookup by registration number or lot
ParkingHistorySchema.index({ registrationNumber: 1 });
ParkingHistorySchema.index({ lotId: 1 });
ParkingHistorySchema.index({ createdAt: -1 });

export default mongoose.model<IParkingHistory>('ParkingHistory', ParkingHistorySchema);
