"use client";

import { useEffect, useState } from "react";

export function SafeChart({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!mounted) {
    return (
      fallback ?? (
        <div className="flex h-full min-h-72 items-center justify-center text-sm text-neutral-500">
          Loading chart...
        </div>
      )
    );
  }

  return <>{children}</>;
}
