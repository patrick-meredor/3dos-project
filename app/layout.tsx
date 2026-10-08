import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Signika } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GridBackground } from "@/components/grid-background";
import { cn } from "@/lib/utils";

const bernoru = localFont({
  src: './fonts/bernoru-blackultraexpanded.otf',
  variable: '--font-bernoru',
  display: 'swap',
});

const signika = Signika({
  subsets:['latin'],
  variable:'--font-signika',
});

const inter = Inter({
  subsets:['latin'],
  variable:'--font-sans',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Day One",
  description: "Day One. Stay Consistent. Be Strong.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, bernoru.variable, signika.variable)}
    >
      <body className="min-h-full flex flex-col relative selection:bg-primary/10">
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GridBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
