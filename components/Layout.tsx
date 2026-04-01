'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Truck, Box, MessageSquare, Settings, ChevronLeft } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ... (שאר המערכים של menuItems ו-teamMembers נשארים אותו דבר)

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111B21] font-sans" dir="rtl">
      <Head>
        <title>SABAN OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Header, Main ו-Sidebar כפי שכתבנו קודם */}
      <header className="...">...</header>
      
      <main className="pt-16">
        {children} {/* כאן נכנס תוכן הדפים */}
      </main>

      {/* AnimatePresence של התפריט */}
      <AnimatePresence>
        {/* ... */}
      </AnimatePresence>
    </div> 
  );
}
