"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface SettingsData {
  phone: string;
  storeName: string;
  storeDescription: string;
  lastBrandNameChangeAt: string | null;
}

export default function SellerSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    phone: "",
    storeName: "",
    storeDescription: "",
    lastBrandNameChangeAt: null,
  });

  const [daysUntilBrandChange, setDaysUntilBrandChange] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/seller/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          
          if (data.lastBrandNameChangeAt) {
            const lastChange = new Date(data.lastBrandNameChangeAt);
            const now = new Date();
            const daysSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
            if (daysSinceChange < 365) {
              setDaysUntilBrandChange(Math.ceil(365 - daysSinceChange));
            }
          }
        } else {
          toast.error("Failed to load settings");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: settings.phone,
          storeName: settings.storeName,
          storeDescription: settings.storeDescription,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Settings updated successfully!");
        
        // Update local state if brand name was changed
        if (daysUntilBrandChange === 0) {
           setSettings(prev => ({
             ...prev,
             lastBrandNameChangeAt: new Date().toISOString()
           }));
           setDaysUntilBrandChange(365);
        }
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const isBrandNameLocked = daysUntilBrandChange > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500">Manage your store's public details and contact information.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Personal Name (Read-Only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Personal Name</label>
            <input 
              type="text" 
              value={session?.user?.name || ""} 
              disabled 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Your personal name cannot be changed.</p>
          </div>

          <hr className="border-gray-100" />

          {/* Store Name */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-semibold text-gray-700">Brand / Store Name</label>
              {isBrandNameLocked && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Locked for {daysUntilBrandChange} days
                </span>
              )}
            </div>
            
            <input 
              type="text" 
              value={settings.storeName}
              onChange={(e) => setSettings(prev => ({...prev, storeName: e.target.value}))}
              disabled={isBrandNameLocked}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                isBrandNameLocked 
                  ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" 
                  : "border-gray-300 bg-white"
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can only change your brand name once every 365 days to maintain customer trust.
            </p>
          </div>

          {/* Store Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Description</label>
            <textarea 
              rows={4}
              value={settings.storeDescription}
              onChange={(e) => setSettings(prev => ({...prev, storeDescription: e.target.value}))}
              placeholder="Tell buyers about your brand and what you sell..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white transition-colors resize-none"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone Number</label>
            <input 
              type="tel" 
              value={settings.phone}
              onChange={(e) => setSettings(prev => ({...prev, phone: e.target.value}))}
              placeholder="e.g. 08012345678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">This number is used to contact you regarding your orders.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
