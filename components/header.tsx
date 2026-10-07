import Image from "next/image";
import { ModeToggle } from "./ui/toggle";
import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header(){
    return (
        <header className="w-full flex items-center justify-between py-4 px-4 fixed">
        <div className="flex items-center gap-2">
          <Image src="/logo_transparent.png" width={40} height={40} alt="Logo" className="dark:invert" />
          <h1 className="font-bernoru">DAY ONE</h1>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <nav className="flex items-center gap-3">
            <Link href="/roadmap" className="flex items-center gap-2 transition-colors"><Map className="h-5 w-5"/>Roadmap</Link>
            <Button variant="default" size="lg" nativeButton={false} render={<Link href="/login" />}>
              Login
            </Button>
          </nav>
        </div>
      </header>
    )
}