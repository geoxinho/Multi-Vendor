import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const navItems = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: <i className="fa-solid fa-chart-line text-lg" />,
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    icon: <i className="fa-solid fa-users text-lg" />,
  },
  {
    href: "/dashboard/admin/products",
    label: "Products",
    icon: <i className="fa-solid fa-box text-lg" />,
  },
  {
    href: "/dashboard/admin/orders",
    label: "Orders",
    icon: <i className="fa-solid fa-receipt text-lg" />,
  },
  {
    href: "/dashboard/admin/payouts",
    label: "Payouts",
    icon: <i className="fa-solid fa-money-bill-transfer text-lg" />,
  },
  {
    href: "/dashboard/admin/categories",
    label: "Categories",
    icon: <i className="fa-solid fa-tags text-lg" />,
  },
  {
    href: "/dashboard/admin/schools",
    label: "Campuses",
    icon: <i className="fa-solid fa-graduation-cap text-lg" />,
  },
  {
    href: "/dashboard/admin/reports",
    label: "Complaints",
    icon: <i className="fa-solid fa-triangle-exclamation text-lg" />,
  },
  {
    href: "/dashboard/admin/campaigns",
    label: "Campaigns",
    icon: <i className="fa-solid fa-paper-plane text-lg" />,
  },
  {
    href: "/dashboard/admin/support",
    label: "Support Msgs",
    icon: <i className="fa-solid fa-headset text-lg" />,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDashboardLayout navItems={navItems}>
      {children}
    </AdminDashboardLayout>
  );
}
