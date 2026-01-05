import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendant extends Document {
  attendantId: string;
  name: string;
  managedLotIds: string[]; // References to ParkingLot lotId
}

const AttendantSchema = new Schema<IAttendant>({
  attendantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  managedLotIds: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<IAttendant>('Attendant', AttendantSchema);
