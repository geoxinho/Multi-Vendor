import { Schema, model, models, Document, Types } from "mongoose";

export interface IReview extends Document {
  product: Types.ObjectId;
  buyer: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Index for fast query of reviews by product
ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ product: 1, buyer: 1 });

export const Review = models.Review || model<IReview>("Review", ReviewSchema);
