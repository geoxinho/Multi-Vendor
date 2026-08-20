import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] border-t border-[#E5E5E5] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="CampusGo"
                className="h-7 w-auto object-contain"
              />
              <span className="font-bold text-lg text-[#111111]">
                Campus<span className="text-[#A4860E]">Go</span>
              </span>
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-sm">
              Nigeria&apos;s modern multi-vendor marketplace. Buy and sell new
              &amp; used products from verified campus sellers.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-[#111111] mb-4">Shop</h3>
            <ul className="space-y-2.5 text-sm text-[#6B6B6B]">
              <li>
                <Link
                  href="/products"
                  className="hover:text-[#111111] transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?condition=new"
                  className="hover:text-[#111111] transition-colors"
                >
                  New Items
                </Link>
              </li>
              <li>
                <Link
                  href="/products?condition=used"
                  className="hover:text-[#111111] transition-colors"
                >
                  Used Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-sm font-semibold text-[#111111] mb-4">
              Support &amp; Account
            </h3>
            <ul className="space-y-2.5 text-sm text-[#6B6B6B]">
              <li>
                <Link
                  href="/help"
                  className="hover:text-[#A4860E] font-medium transition-colors flex items-center gap-1.5"
                >
                  {" "}
                  Help Desk
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="hover:text-[#111111] transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="hover:text-[#111111] transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/seller"
                  className="hover:text-[#111111] transition-colors"
                >
                  Seller Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-[#111111] mb-4">
              Legal &amp; Policy
            </h3>
            <ul className="space-y-2.5 text-sm text-[#6B6B6B]">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#111111] transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[#111111] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-[#111111] transition-colors"
                >
                  Contact Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[#E5E5E5] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#9B9B9B]">
          <p>
            &copy; {new Date().getFullYear()} CampusGo. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="hover:text-[#6B6B6B] transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#6B6B6B] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/help"
              className="hover:text-[#6B6B6B] transition-colors"
            >
              Help Desk
            </Link>
          </div>
          <p>
            Payments secured by{" "}
            <span className="font-semibold text-[#6B6B6B]">Paystack</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
