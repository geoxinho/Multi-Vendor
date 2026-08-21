import SellerDashboardLayout from "@/components/dashboard/SellerDashboardLayout";

const navItems = [
  {
    href: "/dashboard/seller",
    label: "Overview",
    icon: <i className="fa-solid fa-chart-line text-lg" />,
  },
  {
    href: "/dashboard/seller/products",
    label: "My Products",
    icon: <i className="fa-solid fa-box-open text-lg" />,
  },
  {
    href: "/dashboard/seller/orders",
    label: "Sales Orders",
    icon: <i className="fa-solid fa-receipt text-lg" />,
  },
  {
    href: "/dashboard/seller/purchases",
    label: "My Purchases",
    icon: <i className="fa-solid fa-bag-shopping text-lg" />,
  },
  {
    href: "/dashboard/seller/payouts",
    label: "Payouts",
    icon: <i className="fa-solid fa-money-bill-transfer text-lg" />,
  },
  {
    href: "/dashboard/seller/messages",
    label: "Messages",
    icon: <i className="fa-solid fa-envelope text-lg" />,
  },
  {
    href: "/dashboard/seller/settings",
    label: "Settings",
    icon: <i className="fa-solid fa-gear text-lg" />,
  },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerDashboardLayout title="Seller Dashboard" navItems={navItems}>
      {children}
    </SellerDashboardLayout>
  );
}
