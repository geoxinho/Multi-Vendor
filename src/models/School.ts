import { Schema, model, models, Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  slug: string;
  code?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, uppercase: true, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (models.School) {
  try {
    delete (models as any).School;
  } catch {}
}

export const School = models.School || model<ISchool>("School", SchoolSchema);
