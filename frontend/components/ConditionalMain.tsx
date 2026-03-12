"use client";
import { usePathname } from "next/navigation";

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </main>
  );
}
