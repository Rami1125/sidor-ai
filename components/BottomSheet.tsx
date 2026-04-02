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

  useEffect(() => {
    // מלשינון מלא – בדיקה מה חוסם לחיצות
    setTimeout(() => {
      if (!sheetRef.current) return;

      const el = sheetRef.current;
      const styles = window.getComputedStyle(el);

      console.warn("✅ BOTTOM SHEET DEBUG START");
      console.log("Element:", el);
      console.log("zIndex:", styles.zIndex);
      console.log("position:", styles.position);
      console.log("pointer-events:", styles.pointerEvents);

      const topEl = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight - 20
      );

      console.log("Element capturing bottom clicks:", topEl);
      console.warn("✅ BOTTOM SHEET DEBUG END");
    }, 500);
  }, []);

  // לוג לכל ניסיון לחיצה על התוכן
  const onClickLayer = (e: any) => {
    console.log("CLICK EVENT ON SHEET:", e.target);
  };

  return (
    <motion.div
      ref={sheetRef}
      onClick={onClickLayer}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="
        fixed bottom-0 left-0 w-full 
        bg-white rounded-t-3xl shadow-2xl 
        p-6 z-[99999]
        h-[75vh] overflow-y-auto 
        pointer-events-auto
      "
      style={{ direction: "rtl" }}
    >

      {/* Close Button */}
      <button
        onClick={() => {
          console.log("✅ CLOSE BUTTON CLICKED");
          onClose();
        }}
        className="absolute top-3 left-3 text-gray-600 hover:text-gray-900 z-[100000]"
      >
        <X size={26} />
      </button>

      {/* CONTENT */}
      <div className="mt-10 pb-24">{children}</div>
    </motion.div>
  );
}
