"use client";

import { useRouter } from "next/navigation";
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
    <input
      type="search"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        submit(e.target.value);
      }}
      placeholder="Search by client or project name…"
      className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
      style={{ opacity: isPending ? 0.7 : 1 }}
    />
  );
}
