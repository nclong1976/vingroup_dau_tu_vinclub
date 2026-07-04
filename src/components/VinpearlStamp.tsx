import React from 'react';

interface VinpearlStampProps {
  className?: string;
  opacity?: string;
}

export default function VinpearlStamp({ className = "w-28 h-28", opacity = "0.95" }: VinpearlStampProps) {
  return (
    <div className={`relative select-none pointer-events-none flex items-center justify-center ${className}`} style={{ opacity }}>
      <img
        src="https://ilhzsadfwezqljvrbpwt.supabase.co/storage/v1/object/public/vinclub/image-Photoroom%20(6).png"
        className="w-full h-full object-contain"
        alt="Vinpearl Stamp & Signature"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
