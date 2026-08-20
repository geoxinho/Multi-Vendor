import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CampusGo",
  description: "Learn how CampusGo collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/main_logo.png" alt="CampusGo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-lg text-[#111111]">Campus<span className="text-[#A4860E]">Go</span></span>
          </Link>
          <Link href="/auth/register"
            className="text-sm text-[#A4860E] font-semibold hover:underline flex items-center gap-1.5">
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to Register
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-shield-halved text-[#A4860E] text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#9B9B9B]">Last updated: August 2025 &nbsp;·&nbsp; Your privacy matters to us</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm divide-y divide-[#F5F5F5]">

          <Section icon="fa-circle-info" title="Introduction">
            <p>
              CampusGo (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal data. This Privacy Policy explains what information we collect, why we collect it, how it is used, and your rights regarding your data. By using CampusGo, you consent to the practices described here.
            </p>
          </Section>

          <Section icon="fa-database" title="Information We Collect">
            <p className="font-medium text-[#111111] mb-2">We collect the following types of information:</p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-[#F0F0F0]">
                <p className="font-semibold text-[#111111] text-xs uppercase tracking-wide mb-1.5">Registration Data</p>
                <ul>
                  <li>Full name, email address, phone number</li>
                  <li>School / institution</li>
                  <li>Passport photograph (for identity verification)</li>
                  <li>NIN — sellers only (stored encrypted)</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-[#F0F0F0]">
                <p className="font-semibold text-[#111111] text-xs uppercase tracking-wide mb-1.5">Financial Data — Sellers Only</p>
                <ul>
                  <li>Bank name and account number</li>
                  <li>Account name (verified via Paystack)</li>
                  <li>This data is used solely for processing payouts</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-[#F0F0F0]">
                <p className="font-semibold text-[#111111] text-xs uppercase tracking-wide mb-1.5">Usage Data</p>
                <ul>
                  <li>Pages visited, searches performed</li>
                  <li>Order history and transaction records</li>
                  <li>Device and browser information (IP address, user agent)</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section icon="fa-bullseye" title="How We Use Your Information">
            <ul>
              <li>To create and manage your CampusGo account.</li>
              <li>To process orders and facilitate transactions between buyers and sellers.</li>
              <li>To verify your identity during registration (KYC).</li>
              <li>To process payouts to seller bank accounts via Paystack.</li>
              <li>To send transactional emails (order updates, verification codes).</li>
              <li>To detect and prevent fraud or prohibited activity.</li>
              <li>To improve platform performance and user experience.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </Section>

          <Section icon="fa-share-nodes" title="Sharing of Information">
            <p className="mb-2">We do <strong>not</strong> sell your personal data. We may share it with:</p>
            <ul>
              <li><strong>Paystack</strong> — for payment processing and bank account verification.</li>
              <li><strong>Cloudinary</strong> — for secure image hosting (profile and product images).</li>
              <li><strong>Email service providers</strong> — for transactional emails only.</li>
              <li><strong>Law enforcement</strong> — where required by law or court order.</li>
            </ul>
            <p className="mt-2 text-xs text-[#9B9B9B]">All third-party services are bound by their own privacy policies and applicable data protection laws.</p>
          </Section>

          <Section icon="fa-image" title="Passport &amp; Identity Data">
            <p>
              Passport photographs uploaded during registration are stored securely on Cloudinary and used solely for identity verification purposes. They are not shared with other users, buyers, or third parties outside of the KYC process. You may request deletion of your passport image by contacting support.
            </p>
          </Section>

          <Section icon="fa-cookie-bite" title="Cookies &amp; Tracking">
            <p>
              CampusGo uses session cookies to keep you signed in and remember your preferences. We do not use third-party advertising cookies. You can disable cookies in your browser settings, but this may affect functionality.
            </p>
          </Section>

          <Section icon="fa-lock" title="Data Security">
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul>
              <li>Passwords hashed with bcrypt (salt rounds: 12)</li>
              <li>HTTPS/TLS encryption for all data in transit</li>
              <li>Sensitive fields (NIN, bank details) stored with restricted access</li>
              <li>Regular security reviews</li>
            </ul>
            <p className="mt-2">
              Despite these measures, no system is completely secure. Please use a strong, unique password and do not share your account credentials.
            </p>
          </Section>

          <Section icon="fa-clock-rotate-left" title="Data Retention">
            <ul>
              <li>Account data is retained for as long as your account is active.</li>
              <li>Transaction records are retained for 7 years for legal compliance.</li>
              <li>Deleted accounts have their personal data anonymised within 30 days, except where retention is required by law.</li>
            </ul>
          </Section>

          <Section icon="fa-person-circle-check" title="Your Rights">
            <p className="mb-2">You have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request that we correct inaccurate data.</li>
              <li><strong>Deletion</strong> — request deletion of your account and associated data.</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong>Objection</strong> — object to certain types of data processing.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:privacy@campusgo.ng" className="text-[#A4860E] hover:underline font-medium">privacy@campusgo.ng</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section icon="fa-child-reaching" title="Minors">
            <p>
              CampusGo is not intended for use by anyone under the age of 16. We do not knowingly collect personal data from minors. If you believe a minor has registered, please contact us immediately.
            </p>
          </Section>

          <Section icon="fa-pen-to-square" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. The date at the top of this page indicates when it was last revised. Continued use of the Platform after changes constitutes acceptance of the updated Policy.
            </p>
          </Section>

          <Section icon="fa-envelope" title="Contact">
            <p>
              Questions about this Privacy Policy? Contact us:
            </p>
            <div className="mt-2 p-3 bg-[#fdf8e8] rounded-xl border border-[#e8d48a] text-xs space-y-1">
              <p><i className="fa-solid fa-envelope text-[#A4860E] mr-2" /><a href="mailto:privacy@campusgo.ng" className="text-[#A4860E] hover:underline">privacy@campusgo.ng</a></p>
              <p><i className="fa-solid fa-location-dot text-[#A4860E] mr-2" />Adeleke University, Ede, Osun State, Nigeria</p>
            </div>
          </Section>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-[#9B9B9B]">
            Also read our{" "}
            <Link href="/terms" className="text-[#A4860E] font-semibold hover:underline">Terms &amp; Conditions</Link>
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
