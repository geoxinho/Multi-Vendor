import { Schema, model, models, Document, Types } from "mongoose";

export interface IReview extends Document {
  product: Types.ObjectId;
  buyer: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, buyer: 1 }, { unique: true });

export const Review = models.Review || model<IReview>("Review", ReviewSchema);
