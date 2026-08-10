import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: 
    | 'RENTAL_REQUEST' 
    | 'REQUEST_ACCEPTED' 
    | 'REQUEST_REJECTED' 
    | 'NEW_MESSAGE' 
    | 'RENTAL_REMINDER' 
    | 'RENTAL_COMPLETED' 
    | 'NEW_REVIEW' 
    | 'LISTING_REMOVED' 
    | 'ACCOUNT_STATUS';
  title: string;
  message: string;
  relatedId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'RENTAL_REQUEST',
        'REQUEST_ACCEPTED',
        'REQUEST_REJECTED',
        'NEW_MESSAGE',
        'RENTAL_REMINDER',
        'RENTAL_COMPLETED',
        'NEW_REVIEW',
        'LISTING_REMOVED',
        'ACCOUNT_STATUS',
      ],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
export default Notification;
