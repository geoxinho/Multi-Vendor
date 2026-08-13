"use client";

import { useState, useEffect } from "react";

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("campusgo_onboarding_seen");
    if (!hasSeenOnboarding) {
      // Small delay for a natural entrance after page loads
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const steps = [
    {
      icon: "fa-champagne-glasses",
      title: "Welcome to CampusGo",
      desc: "Nigeria's modern campus marketplace where students buy & sell verified products directly with peers.",
    },
    {
      icon: "fa-magnifying-glass",
      title: "Find Hostel Deals",
      desc: "Need textbooks, clothes, laptops, or hostel appliances? Browse active listings right on your campus.",
    },
    {
      icon: "fa-store",
      title: "Sell in a Flash",
      desc: "Clear out things you no longer need. Set up your store, post images, and start earning extra cash.",
    },
    {
      icon: "fa-shield-halved",
      title: "100% Escrow Protection",
      desc: "Trade securely. Payouts are safely held in escrow and only released when you verify delivery with a PIN.",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem("campusgo_onboarding_seen", "true");
    setShow(false);
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div 
        className="absolute inset-0 bg-[#0b0c10]/60 backdrop-blur-md transition-opacity duration-500 animate-fadeIn" 
        onClick={handleClose} 
      />

      {/* Onboarding Dialog */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-300 animate-scaleUp flex flex-col">
        
        {/* Top Banner Accent */}
        <div className="h-2 bg-gradient-to-r from-[#A4860E] via-[#d0ae25] to-[#A4860E]" />

        {/* Close Button */}
        <button 
          onClick={handleClose}
          aria-label="Skip onboarding"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-950 flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col items-center text-center">
          
          {/* Animated Icon Ring */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#fdf8e8] scale-125 animate-ping opacity-25" />
            <div className="w-16 h-16 rounded-full bg-[#fdf8e8] flex items-center justify-center text-[#A4860E] border border-[#e8d48a] shadow-sm relative">
              <i className={`fa-solid ${current.icon} text-2xl animate-pulse`} />
            </div>
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            {current.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-sm">
            {current.desc}
          </p>

          {/* Progress Indicators */}
          <div className="flex gap-2 mb-8 justify-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "bg-[#A4860E] w-6" : "bg-gray-200 hover:bg-gray-300 w-2"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-between gap-3 border-t border-gray-100 pt-5 mt-auto">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-[#A4860E] hover:bg-[#8a7009] text-white font-bold text-sm transition-colors flex items-center gap-1.5 shadow-lg shadow-[#A4860E]/20"
            >
              <span>{step === steps.length - 1 ? "Let's Go!" : "Next"}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Global CSS styles for modal animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scaleUp {
          animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
