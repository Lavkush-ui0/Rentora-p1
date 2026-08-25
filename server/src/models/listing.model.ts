import { Schema, model, Document, Types } from 'mongoose';

export interface IListing extends Document {
  owner: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  images: string[];
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  rentalPrice: number;
  priceUnit: 'DAY' | 'WEEK' | 'MONTH';
  securityDeposit: number;
  availability: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'RENTED' | 'REMOVED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  viewCount: number;
  requestCount: number;
  rating: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    condition: {
      type: String,
      enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
      required: [true, 'Condition is required'],
    },
    rentalPrice: {
      type: Number,
      required: [true, 'Rental price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceUnit: {
      type: String,
      enum: ['DAY', 'WEEK', 'MONTH'],
      required: [true, 'Price unit is required'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'RENTED', 'REMOVED'],
      default: 'PAUSED',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: [true, 'Location/Campus is required'],
      trim: true,
      index: true,
      default: 'NIET Plot 19',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for ultra-fast catalog and discovery sorting
ListingSchema.index({ approvalStatus: 1, status: 1, availability: 1, createdAt: -1 });
ListingSchema.index({ approvalStatus: 1, status: 1, availability: 1, rentalPrice: 1 });
ListingSchema.index({ approvalStatus: 1, status: 1, availability: 1, requestCount: -1, viewCount: -1 });
ListingSchema.index({ approvalStatus: 1, status: 1, availability: 1, location: 1 });
ListingSchema.index({ owner: 1, status: 1 });
ListingSchema.index({ owner: 1, approvalStatus: 1 });

// Create compound text index for keyword search
ListingSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 2 } }
);

export const Listing = model<IListing>('Listing', ListingSchema);
export default Listing;
