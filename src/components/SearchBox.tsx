"use client";

import { useRouter } from "next/navigation";
import { Search, iconProps } from "@/components/ui/icons";
import { useState, useTransition } from "react";

export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(next: string) {
    startTransition(() => {
      router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
    });
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search {...iconProps} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
      type="search"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        submit(e.target.value);
      }}
      placeholder="Search by client or project name…"
        className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm"
        style={{ opacity: isPending ? 0.7 : 1 }}
      />
    </div>
  );
}
