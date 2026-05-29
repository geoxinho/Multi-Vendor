import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span className="font-bold text-xl text-white">
                Market<span className="text-green-400">Hub</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nigeria&apos;s modern multi-vendor marketplace. Buy and sell new &amp; used products from verified sellers.
            </p>

          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-green-400 transition-colors">All Products</Link></li>
              <li><Link href="/products?condition=new" className="hover:text-green-400 transition-colors">New Items</Link></li>
              <li><Link href="/products?condition=used" className="hover:text-green-400 transition-colors">Used Items</Link></li>
            </ul>
          </div>

          {/* Sellers */}
          <div>
            <h3 className="text-white font-semibold mb-4">Sellers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/register" className="hover:text-green-400 transition-colors">Start Selling</Link></li>
              <li><Link href="/dashboard/seller" className="hover:text-green-400 transition-colors">Seller Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="hover:text-green-400 transition-colors">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-green-400 transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MarketHub. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Payments secured by</span>
            <span className="text-green-400 font-semibold ml-1">Paystack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
