import React from "react";
import { Truck, ShieldCheck, RotateCcw, Hand } from "lucide-react";

export function TopMarquee() {
  return (
    <div className="top-marquee z-60">
      <marquee behavior="scroll" direction="left" scrollamount="6" >
        <span className="inline-flex items-center gap-2 mr-6">
          <Truck className="w-4 h-4 text-[#14b8a6]" />
          <span>Free Shipping — You shop we ship</span>
        </span>
        <span className="inline-flex items-center gap-2 mr-6">
          <Hand className="w-4 h-4 text-[#14b8a6]" />
          <span>Made In India — Crafted with Pride</span>
        </span>
        <span className="inline-flex items-center gap-2 mr-6">
          <ShieldCheck className="w-4 h-4 text-[#14b8a6]" />
          <span>Secure Payment — SSL protected</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[#14b8a6]" />
          <span>Free Returns — 7-day money back</span>
        </span>
      </marquee>
    </div>
  );
}
