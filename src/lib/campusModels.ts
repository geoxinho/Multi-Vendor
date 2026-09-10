import mongoose, { Model } from "mongoose";
import { User, UserSchema, IUser } from "@/models/User";
import { Product, ProductSchema, IProduct } from "@/models/Product";
import { Order, OrderSchema, IOrder } from "@/models/Order";
import { School, ISchool } from "@/models/School";
import { Category } from "@/models/Category";

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

// In-memory micro-caches for database rendering speed
let cachedActiveSchools: { data: { name: string; slug: string }[]; expiresAt: number } | null = null;
let cachedDiscoveredSlugs: { data: string[]; expiresAt: number } | null = null;

/**
 * Retrieves all active registered schools from MongoDB (cached for 60s).
 */
export async function getAllActiveSchools(): Promise<{ name: string; slug: string }[]> {
  const now = Date.now();
  if (cachedActiveSchools && cachedActiveSchools.expiresAt > now) {
    return cachedActiveSchools.data;
  }

  try {
    const schools = await School.find({ isActive: true }).select("name slug").lean();
    if (schools && schools.length > 0) {
      const data = schools.map((s: any) => ({ name: s.name, slug: s.slug || s.name }));
      cachedActiveSchools = { data, expiresAt: now + 60_000 };
      return data;
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
 * Searches in parallel across all active campus user collections for a user matching the query.
 */
export async function findUserAcrossCampuses(
  filter: Record<string, any>
): Promise<{ user: IUser; campusSlug: string; school: string } | null> {
  const schools = await getAllActiveSchools();
  const queries = schools.map(async (s) => {
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
    } catch {}
    return null;
  });

  const results = await Promise.all(queries);
  for (const r of results) {
    if (r) return r;
  }

  // Fallback to legacy User model
  try {
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
 * Finds multiple users by their IDs across all campus user collections.
 * Returns a Map keyed by the string user ID.
 */
export async function findUsersByIdsAcrossCampuses(
  ids: (string | mongoose.Types.ObjectId)[]
): Promise<Map<string, any>> {
  const result = new Map<string, any>();
  if (!ids || ids.length === 0) return result;

  const stringIds = ids.map((id) => id.toString());
  const objectIds = stringIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  try {
    const db = mongoose.connection.db;
    if (db) {
      const allCols = await db.listCollections().toArray();
      const userColNames = allCols
        .map((c) => c.name)
        .filter((n) => n.endsWith("_users") || n === "users");

      await Promise.all(
        userColNames.map(async (colName) => {
          try {
            const col = db.collection(colName);
            const filterQuery: any =
              objectIds.length > 0
                ? { $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] }
                : { _id: { $in: stringIds } };
            const found = await col.find(filterQuery).toArray();
            for (const u of found) {
              result.set(u._id.toString(), u);
            }
          } catch {}
        })
      );
    }
  } catch (err) {
    console.error("[findUsersByIdsAcrossCampuses] Direct collection search error:", err);
  }

  // Fallback: Check via active registered school models if any IDs were not found
  const missingIds = stringIds.filter((id) => !result.has(id));
  if (missingIds.length > 0) {
    try {
      const schools = await getAllActiveSchools();
      const userModels: Model<any>[] = schools.map((s) => getCampusUserModel(s.slug));
      userModels.push(User);

      await Promise.all(
        userModels.map(async (m) => {
          try {
            const docs = await m
              .find({
                $or: [{ _id: { $in: objectIds } }, { _id: { $in: missingIds } }],
              })
              .lean();
            for (const d of docs) {
              result.set((d as any)._id.toString(), d);
            }
          } catch {}
        })
      );
    } catch {}
  }

  return result;
}

/**
 * Finds all admin users across all user collections.
 */
export async function findAdminsAcrossCampuses(): Promise<any[]> {
  const admins: any[] = [];
  const adminEmails = new Set<string>();

  try {
    const db = mongoose.connection.db;
    if (db) {
      const allCols = await db.listCollections().toArray();
      const userColNames = allCols
        .map((c) => c.name)
        .filter((n) => n.endsWith("_users") || n === "users" || n === "admins");

      await Promise.all(
        userColNames.map(async (colName) => {
          try {
            const col = db.collection(colName);
            const found = await col.find({ role: "admin" }).toArray();
            for (const u of found) {
              if (u.email && !adminEmails.has(u.email.toLowerCase())) {
                adminEmails.add(u.email.toLowerCase());
                admins.push(u);
              }
            }
          } catch {}
        })
      );
    }
  } catch (err) {
    console.error("[findAdminsAcrossCampuses] Error:", err);
  }

  return admins;
}

/**
 * Searches across all campus product collections in parallel for blazing-fast product rendering.
 */
export async function findProductAcrossCampuses(
  idOrFilter: string | Record<string, any>
): Promise<{ product: any; campusSlug: string; model: Model<IProduct> } | null> {
  const schools = await getAllActiveSchools();
  const filter = typeof idOrFilter === "string" ? { _id: idOrFilter } : idOrFilter;

  const targets: { model: Model<IProduct>; slug: string }[] = schools.map((s) => ({
    model: getCampusProductModel(s.slug),
    slug: s.slug,
  }));
  targets.push({ model: Product, slug: "general" });

  // Discover and cache any other collection ending with _products (cached for 60s)
  const now = Date.now();
  if (cachedDiscoveredSlugs && cachedDiscoveredSlugs.expiresAt > now) {
    for (const slug of cachedDiscoveredSlugs.data) {
      if (!targets.some((t) => t.slug === slug || getCampusSlug(t.slug) === slug)) {
        targets.push({
          model: getCampusModel<IProduct>(slug, "Product", ProductSchema, "products"),
          slug,
        });
      }
    }
  } else {
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        const discovered: string[] = [];
        for (const col of collections) {
          if (col.name.endsWith("_products") && col.name !== "products") {
            const slug = col.name.replace(/_products$/, "");
            discovered.push(slug);
            if (!targets.some((t) => t.slug === slug || getCampusSlug(t.slug) === slug)) {
              targets.push({
                model: getCampusModel<IProduct>(slug, "Product", ProductSchema, "products"),
                slug,
              });
            }
          }
        }
        cachedDiscoveredSlugs = { data: discovered, expiresAt: now + 60_000 };
      }
    } catch (err) {
      console.warn("[findProductAcrossCampuses] dynamic collections discovery warning:", err);
    }
  }

  // Query all candidate collections simultaneously in parallel
  const searchPromises = targets.map(async ({ model, slug }) => {
    try {
      let doc: any = null;
      try {
        doc = await model
          .findOne(filter)
          .populate("category", "name slug")
          .lean();
      } catch {
        doc = await model.findOne(filter).lean();
      }

      if (doc) {
        const enriched = await populateSingleProductSeller(doc, slug);
        return { product: enriched, campusSlug: slug, model };
      }
    } catch (err) {
      console.error(`[findProductAcrossCampuses] Error searching campus "${slug}":`, err);
    }
    return null;
  });

  const searchResults = await Promise.all(searchPromises);
  for (const res of searchResults) {
    if (res) return res;
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

/**
 * Finds all orders across all campus order collections and the root orders collection.
 * Normalizes string and ObjectId queries for buyer, items.seller, and _id.
 */
export async function findOrdersAcrossCampuses(filter: any = {}): Promise<any[]> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      const { connectDB } = await import("@/lib/db");
      await connectDB();
    }
    const realDb = mongoose.connection.db;
    if (!realDb) return [];

    const allCols = await realDb.listCollections().toArray();
    const orderColNames = [
      ...new Set(
        allCols
          .map((c) => c.name)
          .filter((n) => n.endsWith("_orders") || n === "orders")
      ),
    ];

    // Build normalized query to match both string and ObjectId representations
    const normalizedQuery: any = { ...filter };

    if (filter.buyer) {
      const buyerStr = filter.buyer.toString();
      const conds: any[] = [buyerStr];
      if (mongoose.Types.ObjectId.isValid(buyerStr)) {
        conds.push(new mongoose.Types.ObjectId(buyerStr));
      }
      normalizedQuery.buyer = { $in: conds };
    }

    if (filter["items.seller"]) {
      const sellerStr = filter["items.seller"].toString();
      const conds: any[] = [sellerStr];
      if (mongoose.Types.ObjectId.isValid(sellerStr)) {
        conds.push(new mongoose.Types.ObjectId(sellerStr));
      }
      normalizedQuery["items.seller"] = { $in: conds };
    }

    if (filter._id) {
      const idStr = filter._id.toString();
      const conds: any[] = [idStr];
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        conds.push(new mongoose.Types.ObjectId(idStr));
      }
      normalizedQuery._id = { $in: conds };
    }

    const seenIds = new Set<string>();
    const orders: any[] = [];

    await Promise.all(
      orderColNames.map(async (colName) => {
        try {
          const col = realDb.collection(colName);
          const docs = await col.find(normalizedQuery).sort({ createdAt: -1 }).toArray();
          for (const doc of docs) {
            const idStr = doc._id.toString();
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              orders.push(doc);
            }
          }
        } catch (err) {
          console.warn(`[findOrdersAcrossCampuses] Error querying ${colName}:`, err);
        }
      })
    );

    orders.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return orders;
  } catch (err) {
    console.error("[findOrdersAcrossCampuses] Error:", err);
    return [];
  }
}

/**
 * Populates buyer, seller, and product data for orders from campus collections.
 */
export async function populateOrdersWithUsersAndProducts(orders: any[]): Promise<any[]> {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const db = mongoose.connection.db;
  if (!db) return orders;

  const allUserIds = new Set<string>();
  const allProductIds = new Set<string>();

  for (const o of orders) {
    if (o.buyer && typeof o.buyer !== "object") {
      allUserIds.add(o.buyer.toString());
    } else if (o.buyer?._id && !o.buyer.name) {
      allUserIds.add(o.buyer._id.toString());
    }

    if (Array.isArray(o.items)) {
      for (const item of o.items) {
        if (item.seller && typeof item.seller !== "object") {
          allUserIds.add(item.seller.toString());
        } else if (item.seller?._id && !item.seller.name && !item.seller.storeName) {
          allUserIds.add(item.seller._id.toString());
        }

        if (item.product && typeof item.product !== "object") {
          allProductIds.add(item.product.toString());
        } else if (item.product?._id && !item.product.title) {
          allProductIds.add(item.product._id.toString());
        }
      }
    }
  }

  const userMap = new Map<string, any>();
  const productMap = new Map<string, any>();

  // Fetch users across all user collections
  if (allUserIds.size > 0) {
    const userIdsArray = Array.from(allUserIds);
    const userObjIds = userIdsArray
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const allCols = await db.listCollections().toArray();
    const userColNames = allCols
      .map((c) => c.name)
      .filter((n) => n.endsWith("_users") || n === "users" || n === "admins");

    await Promise.all(
      userColNames.map(async (colName) => {
        try {
          const col = db.collection(colName);
          const filterQ: any =
            userObjIds.length > 0
              ? { $or: [{ _id: { $in: userObjIds } }, { _id: { $in: userIdsArray } }] }
              : { _id: { $in: userIdsArray } };
          const found = await col
            .find(filterQ)
            .project({ name: 1, storeName: 1, email: 1, phone: 1, school: 1, avatar: 1, bankDetails: 1 })
            .toArray();
          for (const u of found) {
            userMap.set(u._id.toString(), {
              _id: u._id.toString(),
              name: u.name || u.storeName || "Unknown",
              storeName: u.storeName,
              email: u.email,
              phone: u.phone,
              school: u.school,
              avatar: u.avatar,
              bankDetails: u.bankDetails,
            });
          }
        } catch {}
      })
    );
  }

  // Fetch products across all product collections
  if (allProductIds.size > 0) {
    const prodIdsArray = Array.from(allProductIds);
    const prodObjIds = prodIdsArray
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const allCols = await db.listCollections().toArray();
    const productColNames = allCols
      .map((c) => c.name)
      .filter((n) => n.endsWith("_products") || n === "products");

    await Promise.all(
      productColNames.map(async (colName) => {
        try {
          const col = db.collection(colName);
          const filterQ: any =
            prodObjIds.length > 0
              ? { $or: [{ _id: { $in: prodObjIds } }, { _id: { $in: prodIdsArray } }] }
              : { _id: { $in: prodIdsArray } };
          const found = await col.find(filterQ).project({ title: 1, images: 1, price: 1 }).toArray();
          for (const p of found) {
            productMap.set(p._id.toString(), {
              _id: p._id.toString(),
              title: p.title,
              images: p.images,
              price: p.price,
            });
          }
        } catch {}
      })
    );
  }

  return orders.map((o) => {
    const bId = (o.buyer?._id || o.buyer)?.toString();
    const buyer = bId ? userMap.get(bId) || o.buyer || { _id: bId } : o.buyer;

    const items = (o.items || []).map((item: any) => {
      const sId = (item.seller?._id || item.seller)?.toString();
      const pId = (item.product?._id || item.product)?.toString();
      return {
        ...item,
        seller: sId ? userMap.get(sId) || item.seller || { _id: sId } : item.seller,
        product: pId ? productMap.get(pId) || item.product || { _id: pId } : item.product,
      };
    });

    return {
      ...o,
      _id: o._id.toString(),
      buyer,
      items,
    };
  });
}

/**
 * Finds a single order by ID across all collections and populates its buyer, seller, and product.
 */
export async function findOrderByIdAcrossCampuses(id: string): Promise<any | null> {
  const orders = await findOrdersAcrossCampuses({ _id: id });
  if (orders.length === 0) return null;
  const populated = await populateOrdersWithUsersAndProducts(orders);
  return populated[0] || null;
}

/**
 * Updates an order across both the root orders collection and all campus order collections.
 */
export async function updateOrderAcrossCampuses(id: string, updates: any): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const allCols = await db.listCollections().toArray();
    const orderColNames = [
      ...new Set(
        allCols
          .map((c) => c.name)
          .filter((n) => n.endsWith("_orders") || n === "orders")
      ),
    ];

    const conds: any[] = [id];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conds.push(new mongoose.Types.ObjectId(id));
    }

    await Promise.all(
      orderColNames.map(async (colName) => {
        try {
          const col = db.collection(colName);
          await col.updateMany({ _id: { $in: conds } }, { $set: updates });
        } catch {}
      })
    );
  } catch (err) {
    console.error("[updateOrderAcrossCampuses] Error:", err);
  }
}
