import { Schema, model, models, Document, Types } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  condition: "new" | "used";
  images: string[];
  category: Types.ObjectId;
  seller: Types.ObjectId;
  stock: number;
  sold: number;
  rating: number;
  numReviews: number;
  status: "active" | "inactive";
  isFeatured: boolean;
  tags: string[];
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    condition: { type: String, enum: ["new", "used"], required: true },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stock: { type: Number, required: true, min: 0, default: 1 },
    sold: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", description: "text", tags: "text" });

export const Product = models.Product || model<IProduct>("Product", ProductSchema);
