import React from "react";

interface WarehouseLogoProps {
  warehouse?: string | null;
  className?: string;
}

const logos: Record<string, string> = {
  "שארק 30": "/logos/shark30.png",
  "כראדי 32": "/logos/karadi32.png",
  "שי שרון": "/logos/shai-sharon.png",
};

export default function WarehouseLogos({ warehouse, className }: WarehouseLogoProps) {
  if (!warehouse) return null;

  const src = logos[warehouse];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={warehouse}
      className={className ? className : "w-full h-full object-contain"}
    />
  );
}
