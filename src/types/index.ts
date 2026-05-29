export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  condition: "new" | "used";
  sellerId: string;
  quantity: number;
  stock: number;
}

export interface ProductSummary {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: "new" | "used";
  rating: number;
  numReviews: number;
  seller: { _id: string; name: string; storeName: string };
  category: { _id: string; name: string; slug: string };
  stock: number;
  sold: number;
}
