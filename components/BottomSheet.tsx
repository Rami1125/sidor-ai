'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function BottomSheet({ children, onClose }: BottomSheetProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="
        fixed bottom-0 left-0 w-full 
        bg-white rounded-t-3xl shadow-2xl 
        p-6 z-[9999] 
        h-[75vh] overflow-y-auto 
        pointer-events-auto
      "
      style={{ direction: "rtl" }}
    >

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 left-3 text-gray-600 hover:text-gray-900 z-[10000]"
      >
        <X size={26} />
      </button>

      {/* Content */}
      <div className="mt-8 pb-20">
        {children}
      </div>

    </motion.div>
  );
}
