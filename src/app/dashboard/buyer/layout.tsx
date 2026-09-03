import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Navbar from "@/components/shared/Navbar";
import RequireCampusModal from "@/components/dashboard/RequireCampusModal";

const navItems = [
  {
    href: "/dashboard/buyer",
    label: "Overview",
    icon: <i className="fa-solid fa-chart-line text-lg" />,
  },
  {
    href: "/dashboard/buyer/orders",
    label: "My Orders",
    icon: <i className="fa-solid fa-bag-shopping text-lg" />,
  },
  {
    href: "/dashboard/buyer/wishlist",
    label: "Wishlist",
    icon: <i className="fa-solid fa-heart text-lg" />,
  },
  {
    href: "/dashboard/buyer/messages",
    label: "Messages",
    icon: <i className="fa-solid fa-envelope text-lg" />,
  },
];


export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <RequireCampusModal />
      <div className="flex flex-1">
        <DashboardSidebar title="Buyer Dashboard" navItems={navItems} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 min-w-0 max-w-6xl w-full">{children}</main>
      </div>
    </div>
  );
}
