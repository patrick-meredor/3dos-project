import { Button } from "./ui/button";
import Image from "next/image";
import { ModeToggle } from "./ui/toggle";
import { Link } from "lucide-react";

export default function Header(){
    return (
        <header className="w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo_transparent.png" width={40} height={40} alt="Logo" className="dark:invert" />
          <h1 className="font-bernoru">DAY ONE</h1>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button>
            <a href="/login">
              Login
            </a>
          </Button>
        </div>
      </header>
    )
}