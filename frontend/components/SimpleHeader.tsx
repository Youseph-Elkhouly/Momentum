"use client";

import Link from "next/link";
import Image from "next/image";

export function SimpleHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="px-4 sm:px-6 py-3">
        <Link href="/projects" className="inline-flex items-center">
          <Image
            src="/image.png"
            alt="Momentum"
            width={280}
            height={64}
            className="h-14 w-auto object-contain sm:h-16 md:h-20 lg:h-24"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
