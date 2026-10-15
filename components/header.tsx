import Image from "next/image";
import { ModeToggle } from "./ui/toggle";
import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/get-user";

export default async function Header(){
  const user = await getUser();
    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-background/60 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
          <Image
            src="/Day_One.svg"
            width={40}
            height={40}
            alt="Day One Logo"
            className="w-7 h-7 sm:w-10 sm:h-10 dark:invert transition-transform group-hover:scale-105"
          />
          <span className="font-bernoru text-base sm:text-lg tracking-wide">DAY ONE</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          <nav className="flex items-center gap-2 sm:gap-3 font-signika">
            <Link
              href="/roadmap"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors hover:text-foreground text-muted-foreground p-1 sm:p-0"
              title="Roadmap"
            >
              <Map className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline sm:inline">Roadmap</span>
            </Link>
            <Button
              variant="default"
              size="sm"
              nativeButton={false}
              render={<Link href={user ? "/dashboard" : "/login"} />}
              className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            >
              {user ? "Dashboard" : "Login"}
            </Button>
          </nav>
        </div>
      </header>
    )
}