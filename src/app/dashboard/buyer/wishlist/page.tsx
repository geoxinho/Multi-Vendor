import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Wishlist } from "@/models/Wishlist";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) notFound();
  await connectDB();

  const items = await Wishlist.find({ buyer: session!.user.id })
    .populate("product", "title price images condition stock rating numReviews _id")
    .sort("-createdAt")
    .lean();

  const products = items
    .map((i) => i.product as Record<string, unknown>)
    .filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} saved item{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/products" className="text-sm text-green-600 hover:underline font-medium">
          Browse more →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-2">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mb-6">Save items you love by tapping the <i className="fa-solid fa-heart text-red-400" /> on any product</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const images = (p.images as string[]) ?? [];
            const id = String(p._id);
            return (
              <Link
                key={id}
                href={`/products/${id}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-square bg-gray-50">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={String(p.title)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {Number(p.stock) === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{String(p.title)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-bold">₦{Number(p.price).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">
                      <i className="fa-solid fa-star text-yellow-400" /> {Number(p.rating).toFixed(1)} ({Number(p.numReviews)})
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
