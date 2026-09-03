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

  // Fallback to legacy User model
  try {
    const { User } = await import("@/models/User");
    const legacyUser = await User.findOne(filter).lean();
    if (legacyUser) {
      return {
        user: legacyUser as unknown as IUser,
        campusSlug: getCampusSlug(legacyUser.school || ""),
        school: legacyUser.school || "",
      };
    }
  } catch {}

  return null;
}

/**
 * Searches across all active campus product collections (and legacy collection) for a product.
 */
export async function findProductAcrossCampuses(
  idOrFilter: string | Record<string, any>
): Promise<{ product: any; campusSlug: string; model: Model<IProduct> } | null> {
  const { Product } = await import("@/models/Product");
  const schools = await getAllActiveSchools();
  const filter = typeof idOrFilter === "string" ? { _id: idOrFilter } : idOrFilter;

  const targets: { model: Model<IProduct>; slug: string }[] = schools.map((s) => ({
    model: getCampusProductModel(s.slug),
    slug: s.slug,
  }));
  targets.push({ model: Product, slug: "general" });

  for (const { model, slug } of targets) {
    try {
      const doc = await model
        .findOne(filter)
        .populate("category", "name slug")
        .lean();
      if (doc) {
        const enriched = await populateSingleProductSeller(doc, slug);
        return { product: enriched, campusSlug: slug, model };
      }
    } catch (err) {
      console.error(`[findProductAcrossCampuses] Error searching campus "${slug}":`, err);
      // Continue searching next campus
    }
  }
  return null;
}


/**
 * Helper to ensure a product's seller is populated from campus user models
 */
export async function populateSingleProductSeller(product: any, schoolHint?: string): Promise<any> {
  if (!product) return product;

  // If seller is already populated with a valid name/storeName, return
  if (product.seller && typeof product.seller === "object" && (product.seller.name || product.seller.storeName)) {
    return product;
  }

  const sellerId = product.seller?._id || product.seller;
  if (!sellerId) return product;

  // Try school hint first if available
  const school = schoolHint || product.school;
  if (school) {
    try {
      const CampusUser = getCampusUserModel(school);
      const sellerDoc = await CampusUser.findById(sellerId)
        .select("name storeName email phone avatar school nin bankDetails")
        .lean();
      if (sellerDoc) {
        return { ...product, seller: sellerDoc };
      }
    } catch {}
  }

  // Fallback: search across all campuses
  const found = await findUserAcrossCampuses({ _id: sellerId });
  if (found && found.user) {
    return { ...product, seller: found.user };
  }

  return product;
}

/**
 * Batch populates seller objects for an array of products across campus user models
 */
export async function populateProductsWithSellers(products: any[]): Promise<any[]> {
  if (!Array.isArray(products) || products.length === 0) return products;

  // Find all seller IDs that need population
  const neededSellerIds = new Set<string>();
  for (const p of products) {
    if (!p.seller || typeof p.seller !== "object" || (!p.seller.name && !p.seller.storeName)) {
      const sId = p.seller?._id || p.seller;
      if (sId) neededSellerIds.add(sId.toString());
    }
  }

  if (neededSellerIds.size === 0) return products;

  // Search across campus user models for these sellers
  const sellerMap = new Map<string, any>();
  const schools = await getAllActiveSchools();
  const userModels = schools.map((s) => getCampusUserModel(s.slug));
  try {
    const { User } = await import("@/models/User");
    userModels.push(User);
  } catch {}

  const idsArray = Array.from(neededSellerIds);
  await Promise.all(
    userModels.map(async (m) => {
      try {
        const users = await m
          .find({ _id: { $in: idsArray } })
          .select("name storeName avatar school email phone")
          .lean();
        for (const u of users) {
          sellerMap.set(u._id.toString(), u);
        }
      } catch {}
    })
  );

  return products.map((p) => {
    const sId = (p.seller?._id || p.seller)?.toString();
    if (sId && sellerMap.has(sId)) {
      return { ...p, seller: sellerMap.get(sId) };
    }
    return p;
  });
}
