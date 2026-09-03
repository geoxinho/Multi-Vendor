import mongoose, { Model } from "mongoose";
import { UserSchema, IUser } from "@/models/User";
import { ProductSchema, IProduct } from "@/models/Product";
import { OrderSchema, IOrder } from "@/models/Order";
import { School, ISchool } from "@/models/School";

/**
 * Normalizes any campus name, code, or slug to a safe, consistent MongoDB collection prefix.
 * e.g. "Adeleke University" -> "adeleke_university"
 *      "adeleke-university" -> "adeleke_university"
 *      "Federal Polytechnic Ede" -> "federal_polytechnic_ede"
 */
export function getCampusSlug(schoolNameOrSlug: string): string {
  if (!schoolNameOrSlug || typeof schoolNameOrSlug !== "string") return "general";
  const cleaned = schoolNameOrSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return cleaned || "general";
}

/**
 * Returns a Mongoose model bound to the campus-specific collection in MongoDB.
 * Example collection names:
 *   adeleke_university_users
 *   adeleke_university_products
 *   adeleke_university_orders
 */
export function getCampusModel<T>(
  schoolNameOrSlug: string,
  modelBaseName: string,
  schema: mongoose.Schema<T>,
  collectionSuffix: string
): Model<T> {
  const slug = getCampusSlug(schoolNameOrSlug);
  const modelName = `${slug}_${modelBaseName}`;
  const collectionName = `${slug}_${collectionSuffix}`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as Model<T>;
  }

  return mongoose.model<T>(modelName, schema, collectionName);
}

/**
 * Specific campus models
 */
export function getCampusUserModel(school: string): Model<IUser> {
  return getCampusModel<IUser>(school, "User", UserSchema, "users");
}

export function getCampusProductModel(school: string): Model<IProduct> {
  return getCampusModel<IProduct>(school, "Product", ProductSchema, "products");
}

export function getCampusOrderModel(school: string): Model<IOrder> {
  return getCampusModel<IOrder>(school, "Order", OrderSchema, "orders");
}

/**
 * Retrieves all active registered schools from MongoDB.
 */
export async function getAllActiveSchools(): Promise<{ name: string; slug: string }[]> {
  try {
    const schools = await School.find({ isActive: true }).select("name slug").lean();
    if (schools && schools.length > 0) {
      return schools.map((s: any) => ({ name: s.name, slug: s.slug || s.name }));
    }
  } catch (err) {
    console.error("[GET_ALL_ACTIVE_SCHOOLS]", err);
  }
  return [
    { name: "Adeleke University", slug: "adeleke-university" },
    { name: "Federal Polytechnic Ede", slug: "federal-polytechnic-ede" },
  ];
}

/**
 * Searches across all active campus user collections for a user matching the query.
 * Useful for login and password recovery when the campus isn't pre-specified.
 */
export async function findUserAcrossCampuses(
  filter: Record<string, any>
): Promise<{ user: IUser; campusSlug: string; school: string } | null> {
  const schools = await getAllActiveSchools();
  for (const s of schools) {
    try {
      const CampusUser = getCampusUserModel(s.slug);
      const user = await CampusUser.findOne(filter).lean();
      if (user) {
        return {
          user: user as unknown as IUser,
          campusSlug: getCampusSlug(s.slug),
          school: user.school || s.name,
        };
      }
    } catch {
      // Continue searching next campus
    }
  }
  return null;
}
