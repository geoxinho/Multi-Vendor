"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string; role: string };
  text: string;
  createdAt: string;
}

interface OrderChatboxProps {
  orderId: string;
  currentUserId: string;
  receiverId: string;
}

export default function OrderChatbox({ orderId, currentUserId, receiverId }: OrderChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?orderId=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // simple polling
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, text, receiverId }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-[400px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <h3 className="font-bold text-gray-900">Order Chat</h3>
        <p className="text-xs text-gray-500">Communicate directly regarding this order.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 my-auto">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === currentUserId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}>
                  {!isMe && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.sender.name}</p>}
                  <p>{msg.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${isMe ? "text-green-200" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
