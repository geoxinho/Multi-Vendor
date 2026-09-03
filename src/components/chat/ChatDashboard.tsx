"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import UserAvatar from "@/components/shared/UserAvatar";

interface Conversation {
  orderId: string;
  orderTitle: string;
  orderImage?: string;
  otherParty: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  latestMessage?: string;
  latestMessageAt: string;
  unreadCount: number;
  type?: "buy" | "sell";
}

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string; role: string };
  text: string;
  createdAt: string;
}

interface ChatDashboardProps {
  currentUserId: string;
  role: "buyer" | "seller";
}

export default function ChatDashboard({ currentUserId, role }: ChatDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderId = searchParams.get("orderId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/messages/conversations?role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // Auto-select if there's an initialOrderId or if none selected yet
        if (initialOrderId && !activeConv) {
          const conv = data.find((c: Conversation) => c.orderId === initialOrderId);
          if (conv) setActiveConv(conv);
        } else if (!activeConv && data.length > 0) {
          setActiveConv(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll conversations every 10s
    return () => clearInterval(interval);
  }, [role, initialOrderId]);

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = async (orderId: string) => {
    try {
      const res = await fetch(`/api/messages?orderId=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConv) {
      setLoadingMessages(true);
      fetchMessages(activeConv.orderId);
      const interval = setInterval(() => fetchMessages(activeConv.orderId), 3000); // Poll messages faster
      
      // Update URL to reflect active chat
      const params = new URLSearchParams(searchParams.toString());
      params.set("orderId", activeConv.orderId);
      router.replace(`?${params.toString()}`, { scroll: false });

      return () => clearInterval(interval);
    }
  }, [activeConv?.orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const text = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeConv.orderId,
          text,
          receiverId: activeConv.otherParty.id,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        fetchConversations(); // Update left sidebar latest message
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[600px] md:h-[700px] max-h-[80vh]">
      
      {/* ─── Sidebar: Conversation List ─── */}
      <div className={`w-full md:w-1/3 min-w-[280px] border-r border-gray-200 flex flex-col bg-gray-50/50 ${
        activeConv ? "hidden md:flex" : "flex"
      }`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chat about your orders</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[#A4860E] rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No active conversations.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => {
                const isActive = activeConv?.orderId === conv.orderId;
                return (
                  <button
                    key={conv.orderId}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-4 transition-colors hover:bg-white flex items-start gap-3 ${
                      isActive ? "bg-blue-50 hover:bg-blue-50 border-l-4 border-[#A4860E]" : "border-l-4 border-transparent"
                    }`}
                  >
                    <UserAvatar
                      name={conv.otherParty.name}
                      image={conv.otherParty.avatar}
                      role={conv.otherParty.role || (conv.type === "buy" ? "seller" : "buyer")}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={`text-sm truncate ${isActive ? "font-bold text-blue-900" : "font-semibold text-gray-900"}`}>
                          {conv.otherParty.name}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {new Date(conv.latestMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1 flex items-center gap-1.5 flex-wrap">
                        <span>Order: {conv.orderTitle}</span>
                        {conv.type === "buy" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded border border-blue-100 uppercase tracking-wide">Buy</span>
                        ) : conv.type === "sell" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-[#fdf8e8] text-[#A4860E] text-[9px] font-bold rounded border border-[#e8d48a] uppercase tracking-wide">Sell</span>
                        ) : null}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                          {conv.latestMessage || "No messages yet."}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-[#A4860E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shrink-0 ml-2">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Main: Chat Window ─── */}
      <div className={`flex-1 flex flex-col bg-white ${
        activeConv ? "flex" : "hidden md:flex"
      }`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveConv(null);
                    const params = new URLSearchParams(window.location.search);
                    params.delete("orderId");
                    router.replace(`?${params.toString()}`, { scroll: false });
                  }}
                  className="md:hidden mr-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <UserAvatar
                  name={activeConv.otherParty.name}
                  image={activeConv.otherParty.avatar}
                  role={activeConv.otherParty.role || (activeConv.type === "buy" ? "seller" : "buyer")}
                  size="md"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{activeConv.otherParty.name}</h3>
                  <p className="text-xs text-gray-500">Order: {activeConv.orderTitle}</p>
                </div>
              </div>
              <span className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-lg">
                Secure Chat
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {/* Warning Banner */}
              {role === "buyer" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-sm text-amber-800">
                  <svg className="w-5 h-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    <strong>Safety Tip:</strong> Please do not disclose the 6-digit Delivery PIN until the product has been physically received and verified.
                  </p>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-[#A4860E] rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender._id === currentUserId;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender._id !== msg.sender._id);

                  return (
                    <div key={msg._id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-6 shrink-0 flex items-end">
                          {showAvatar && (
                            <UserAvatar
                              name={msg.sender.name}
                              image={msg.sender.avatar}
                              role={msg.sender.role}
                              size="xs"
                            />
                          )}
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMe 
                          ? "bg-[#A4860E] text-white rounded-br-sm" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] bg-gray-50 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-5 py-2.5 bg-[#A4860E] hover:bg-[#8a6f0b] active:scale-95 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-base font-medium text-gray-500">Your Messages</p>
            <p className="text-sm mt-1">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
