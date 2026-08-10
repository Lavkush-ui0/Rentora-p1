import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  rentalRequest: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee is required'],
      index: true,
    },
    rentalRequest: {
      type: Schema.Types.ObjectId,
      ref: 'RentalRequest',
      required: [true, 'Rental request reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from reviewing twice for the same rental
ReviewSchema.index({ reviewer: 1, rentalRequest: 1 }, { unique: true });

export const Review = model<IReview>('Review', ReviewSchema);
export default Review;
