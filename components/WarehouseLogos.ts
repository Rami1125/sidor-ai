import React from "react";

const logos: Record<string, string> = {
  "שארק 30": "/logos/shark30.png",
  "כראדי 32": "/logos/karadi32.png",
  "שי שרון": "/logos/shai-sharon.png",
};

interface Props {
  warehouse?: string | null;
  className?: string;
}

export default function WarehouseLogos({ warehouse, className }: Props) {
  if (!warehouse) return null;

  const src = logos[warehouse];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={warehouse}
      className={className ?? "w-full h-full object-contain"}
    />
  );
}
