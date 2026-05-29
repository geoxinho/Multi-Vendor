import { Schema, model, models, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Category = models.Category || model<ICategory>("Category", CategorySchema);
