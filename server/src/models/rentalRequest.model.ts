import { Schema, model, Document, Types } from 'mongoose';

export interface IRentalRequest extends Document {
  listing: Types.ObjectId;
  owner: Types.ObjectId;
  renter: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

const RentalRequestSchema = new Schema<IRentalRequest>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    renter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Renter reference is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RentalRequest = model<IRentalRequest>('RentalRequest', RentalRequestSchema);
export default RentalRequest;
