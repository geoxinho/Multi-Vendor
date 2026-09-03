"use client";

import { useState } from "react";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  passport?: string | null;
  role?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "full" | "lg" | "xl" | "2xl";
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const ROUNDED_MAP = {
  full: "rounded-full",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

export default function UserAvatar({
  name,
  image,
  passport,
  role,
  size = "md",
  className = "",
  rounded = "full",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initial = (name?.trim()?.[0] || "U").toUpperCase();
  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const isAdmin = role === "admin";

  // Sellers use uploaded passport (or image). Buyers always use initial.
  const photoUrl = !isBuyer ? (passport || image || "") : "";
  const hasPhoto = Boolean(photoUrl && !imgError);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = ROUNDED_MAP[rounded] || ROUNDED_MAP.full;

  const bgGradient = isAdmin
    ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white"
    : isSeller
    ? "bg-gradient-to-br from-[#A4860E] to-[#c9a820] text-white"
    : "bg-gradient-to-br from-amber-600 to-amber-800 text-white";

  if (hasPhoto) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden ${sizeClass} ${roundedClass} border border-gray-200/80 shadow-2xs ${className}`}
      >
        <img
          src={photoUrl}
          alt={name ? `${name}'s avatar` : "User Avatar"}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${roundedClass}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-bold select-none ${sizeClass} ${roundedClass} ${bgGradient} shadow-2xs ${className}`}
      title={name || "User"}
    >
      {initial}
    </div>
  );
}
