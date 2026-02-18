import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-48">
    <div className="w-16 h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin" />
    <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] mt-10">Decrypting Ledger...</p>
  </div>
);
