import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

// Elixir's brand typeface is Century Gothic (see template.pptx theme), which
// isn't a licensed web font. Poppins is the closest freely-embeddable
// geometric sans, so it's the fallback for anyone without Century Gothic
// installed locally.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Elixir Project Estimator",
  description: "Project estimation and proposal cockpit for Elixir Solutions",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-mist text-brand-ink">
        <header className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/elixir-logo.png" alt="Elixir" width={95} height={32} priority />
              <span className="border-l border-black/10 pl-3 text-sm font-medium text-brand-ink/70">
                Project Estimator
              </span>
            </Link>
            <nav className="text-sm text-brand-ink/60">
              <Link href="/" className="transition-colors hover:text-brand-crimson">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
