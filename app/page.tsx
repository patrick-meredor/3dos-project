import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-10 font-sans">
      <Header />

      {/* Main hero card with glassmorphism to showcase the vignette depth */}
      <main className="flex flex-col items-center text-center my-auto w-full max-w-2xl py-12 px-8 sm:px-12 rounded-3xl border border-border/50 bg-card/60 dark:bg-card/25 backdrop-blur-xl shadow-2xl transition-all">
        <div className="mb-6 flex items-center justify-center p-3 rounded-2xl bg-foreground/[0.04] dark:bg-foreground/[0.06] border border-border/40">
          <Image
            className="dark:invert h-6 w-auto"
            src="/next.svg"
            alt="Next.js logo"  
            width={100}
            height={24}
            priority
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border/60 bg-muted/50 mb-6 text-foreground/90">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          Vignette Background Active
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-md">
          Responsive Vignette Background
        </h1>

        <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
          Adaptive studio lighting with smooth radial falloff. Switch between Light and Dark mode to observe how the ambient center and vignette corners react.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <a
            className="flex h-11 w-full sm:w-40 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-3.5 w-3.5"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={14}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-11 w-full sm:w-40 items-center justify-center rounded-xl border border-border/70 bg-background/50 hover:bg-muted/70 text-sm font-medium text-foreground transition-all active:scale-[0.98]"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

