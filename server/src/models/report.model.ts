import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reportedBy: Types.ObjectId;
  targetType: 'USER' | 'LISTING' | 'MESSAGE';
  targetId: Types.ObjectId;
  reason: string;
  description?: string;
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  resolvedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported by user is required'],
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['USER', 'LISTING', 'MESSAGE'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = model<IReport>('Report', ReportSchema);
export default Report;
