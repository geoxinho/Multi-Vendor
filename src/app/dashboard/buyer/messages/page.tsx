import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatDashboard from "@/components/chat/ChatDashboard";

export default async function BuyerMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Chat directly with sellers regarding your orders.</p>
      </div>

      <ChatDashboard currentUserId={session.user.id} role="buyer" />
    </div>
  );
}
