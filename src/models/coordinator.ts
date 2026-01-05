import mongoose, { Schema, Document } from 'mongoose';

export interface ICoordinator extends Document {
  coordinatorId: string;
  name: string;
  managedAttendantIds: string[]; // References to Attendant attendantId
}

const CoordinatorSchema = new Schema<ICoordinator>({
  coordinatorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  managedAttendantIds: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<ICoordinator>('Coordinator', CoordinatorSchema);
