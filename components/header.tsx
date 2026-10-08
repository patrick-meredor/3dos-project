import Image from "next/image";
import { ModeToggle } from "./ui/toggle";
import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/get-user";

export default async function Header(){
  const user = await getUser();
    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-6 py-4 bg-background/30 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo_transparent.png" width={40} height={40} alt="Logo" className="dark:invert" />
          <h1 className="font-bernoru">DAY ONE</h1>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <nav className="flex items-center gap-3 font-signika">
            <Link href="/roadmap" className="flex items-center gap-2 transition-colors"><Map className="h-5 w-5"/>Roadmap</Link>
            <Button variant="default" size="lg" nativeButton={false} render={<Link href={user ? "/dashboard" : "/login"} />}>
              {user ? "Dashboard" : "Login"}
            </Button>
          </nav>
        </div>
      </header>
    )
}