import { Schema, model, models, Types } from "mongoose";

export interface IWishlist {
  buyer: Types.ObjectId;
  product: Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

// Prevent duplicate wishlist entries
WishlistSchema.index({ buyer: 1, product: 1 }, { unique: true });

export const Wishlist = models.Wishlist || model<IWishlist>("Wishlist", WishlistSchema);
