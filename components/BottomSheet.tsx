'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function BottomSheet({ children, onClose }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={sheetRef}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="
        fixed bottom-0 left-0 w-full 
        bg-white rounded-t-3xl shadow-2xl 
        z-[99999] 
        h-[75vh] 
        pointer-events-auto 
        flex flex-col
      "
      style={{ direction: "rtl" }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 left-3 text-gray-600 hover:text-gray-900 z-[100000]"
      >
        <X size={26} />
      </button>

      {/* SCROLLABLE AREA */}
      <div className="mt-12 px-4 pb-32 overflow-y-auto">
        {children}
      </div>

      {/* AI BUTTON – ALWAYS CLICKABLE */}
      <div className="absolute bottom-4 left-0 w-full px-6">
        <button
          onClick={() => console.log("✅ AI BUTTON CLICKED")}
          className="
            bg-blue-600 hover:bg-blue-700 
            text-white font-bold 
            w-full py-3 rounded-full 
            shadow-xl text-lg
            z-[200000]
          "
        >
          עדכן באמצעות AI
        </button>
      </div>
    </motion.div>
  );
}
