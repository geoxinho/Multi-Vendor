import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | CampusGo",
  description: "Read CampusGo's Terms and Conditions governing the use of our campus marketplace platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <img src="/main_logo.png" alt="Marketplace Logo" className="h-12 w-auto object-contain hover:scale-105 transition-transform" />
          </Link>
          <Link href="/help"
            className="text-sm text-[#A4860E] font-semibold hover:underline flex items-center gap-1.5">
            <i className="fa-solid fa-headset text-xs" />
            Help Desk &amp; Support
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-file-contract text-[#A4860E] text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Terms &amp; Conditions</h1>
          <p className="text-sm text-[#9B9B9B]">Last updated: August 2025 &nbsp;·&nbsp; Effective immediately upon account creation</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm divide-y divide-[#F5F5F5]">

          {/* Intro */}
          <Section icon="fa-handshake" title="Agreement to Terms">
            <p>
              By accessing or using <strong>CampusGo</strong> ("the Platform"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, you may not use the Platform.
              CampusGo is a campus-based marketplace connecting students and staff within affiliated institutions.
            </p>
          </Section>

          {/* Eligibility */}
          <Section icon="fa-user-check" title="Eligibility">
            <ul>
              <li>You must be a currently enrolled student, staff, or faculty member of an affiliated institution.</li>
              <li>You must be at least 16 years of age.</li>
              <li>You must provide accurate and truthful information during registration.</li>
              <li>Accounts are personal and non-transferable.</li>
            </ul>
          </Section>

          {/* Buyer terms */}
          <Section icon="fa-cart-shopping" title="Buyer Terms">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p className="font-semibold text-amber-800 flex items-center gap-2 mb-1">
                <i className="fa-solid fa-triangle-exclamation" />
                No Return Policy
              </p>
              <p className="text-amber-700">
                <strong>All purchases on CampusGo are final.</strong> Once an order is placed and confirmed by the seller, no returns, exchanges, or refunds will be processed. Please review product descriptions, images, and seller ratings carefully before purchasing.
              </p>
            </div>
            <ul>
              <li>Buyers are responsible for verifying product condition, description, and price before ordering.</li>
              <li>Delivery is confirmed by entering a PIN provided by the buyer to the seller upon receipt.</li>
              <li>Disputes must be raised within 24 hours of order confirmation via the support channel.</li>
              <li>CampusGo is not liable for product quality issues arising from seller misrepresentation, though such sellers may be reported and suspended.</li>
              <li>Buyers must not attempt to circumvent the platform to make off-platform payments.</li>
            </ul>
          </Section>

          {/* Seller terms */}
          <Section icon="fa-store" title="Seller Terms">
            <div className="p-4 bg-[#fdf8e8] border border-[#e8d48a] rounded-xl mb-4">
              <p className="font-semibold text-[#7a6310] flex items-center gap-2 mb-1">
                <i className="fa-solid fa-clock" />
                Payout Policy
              </p>
              <p className="text-[#7a6310]">
                <strong>Earnings are disbursed to your registered bank account 24 hours after an order is marked as completed and confirmed by the buyer.</strong> Ensure your bank details are accurate. CampusGo is not responsible for failed payouts due to incorrect account information.
              </p>
            </div>
            <ul>
              <li>Sellers must provide accurate product descriptions, images, and pricing.</li>
              <li>Sellers must hold valid NIN (National Identification Number) for identity verification.</li>
              <li>A valid passport photograph is required for KYC verification during registration.</li>
              <li>Sellers may not list prohibited items including but not limited to: weapons, drugs, counterfeit goods, or adult content.</li>
              <li>Sellers are responsible for fulfilling orders within the stated timeframe.</li>
              <li>CampusGo charges a platform commission on each sale. Commission rates are communicated in the seller dashboard.</li>
              <li>Accounts found engaging in fraudulent activity will be permanently suspended without prior notice.</li>
            </ul>
          </Section>

          {/* Prohibited conduct */}
          <Section icon="fa-ban" title="Prohibited Conduct">
            <ul>
              <li>Creating multiple accounts to manipulate ratings or reviews.</li>
              <li>Posting false, misleading, or defamatory content.</li>
              <li>Attempting to hack, scrape, or disrupt the Platform.</li>
              <li>Using the Platform for any unlawful purpose.</li>
              <li>Harassing other users.</li>
            </ul>
          </Section>

          {/* Escrow / PIN delivery */}
          <Section icon="fa-shield-halved" title="Escrow &amp; Delivery Confirmation">
            <p>
              CampusGo uses a PIN-based delivery confirmation system. When a buyer places an order, a unique delivery PIN is generated. The PIN must be shared with the seller upon physical receipt of the goods to confirm delivery. Funds are released to the seller 24 hours after PIN confirmation. Do not share your PIN before receiving your goods.
            </p>
          </Section>

          {/* Intellectual property */}
          <Section icon="fa-copyright" title="Intellectual Property">
            <p>
              All content on CampusGo — including logos, UI, and text — is owned by CampusGo or its licensors. Users retain ownership of content they upload (product images, etc.) but grant CampusGo a non-exclusive licence to display such content on the Platform.
            </p>
          </Section>

          {/* Limitation of liability */}
          <Section icon="fa-scale-balanced" title="Limitation of Liability">
            <p>
              CampusGo acts solely as an intermediary marketplace. We are not a party to any transaction between buyers and sellers. To the fullest extent permitted by law, CampusGo is not liable for any indirect, incidental, or consequential damages arising from the use of the Platform.
            </p>
          </Section>

          {/* Changes */}
          <Section icon="fa-pen-to-square" title="Changes to These Terms">
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. Significant changes will be communicated via email or an in-app notification.
            </p>
          </Section>

          {/* Contact */}
          <Section icon="fa-envelope" title="Contact Us">
            <p>
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:support@campusgo.ng" className="text-[#A4860E] hover:underline font-medium">support@campusgo.ng</a>.
            </p>
          </Section>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-[#9B9B9B]">
            Also read our{" "}
            <Link href="/privacy" className="text-[#A4860E] font-semibold hover:underline">Privacy Policy</Link>
          </p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-[#A4860E]/20">
            <i className="fa-solid fa-user-plus text-xs" />
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-base font-bold text-[#111111] flex items-center gap-2.5 mb-3">
        <span className="w-7 h-7 rounded-lg bg-[#fdf8e8] border border-[#e8d48a] flex items-center justify-center shrink-0">
          <i className={`fa-solid ${icon} text-[#A4860E] text-xs`} />
        </span>
        {title}
      </h2>
      <div className="text-sm text-[#4B4B4B] leading-relaxed space-y-2 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-1">
        {children}
      </div>
    </div>
  );
}
