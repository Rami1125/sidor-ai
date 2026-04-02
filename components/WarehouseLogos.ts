import React from 'react';

const logos: Record<string, string> = {
  "שארק 30": "/logos/shark30.png",
  "כראדי 32": "/logos/karadi32.png",
  "שי שרון": "/logos/shai-sharon.png"
};

export default function WarehouseLogos(warehouse: string) {
  const src = logos[warehouse];

  if (!src) return null;

  return (
    <img
      src={src}
      className="w-full h-full object-contain"
      alt={warehouse}
    />
  );
}
