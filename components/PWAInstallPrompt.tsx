'use client';
import React, { useState, useEffect } from 'react';
import { Download, BellRing } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });

    // בקשת הרשאה לסאונד והתראות בטעינה הראשונה
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] bg-[#0B0F1A] text-white p-6 rounded-[2rem] shadow-2xl border border-emerald-500/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-xl text-black">
          <Download size={20} />
        </div>
        <div>
          <p className="text-sm font-black italic">התקן את sabanos</p>
          <p className="text-[10px] opacity-60">לגישה מהירה וקבלת צלצול בהודעות</p>
        </div>
      </div>
      <button 
        onClick={handleInstall}
        className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold text-xs"
      >
        התקן עכשיו
      </button>
    </div>
  );
}
