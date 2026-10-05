import { ModeToggle } from "./ui/toggle";

export default function Header(){
    return (
        <header className="w-full flex items-center justify-between border m-0">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-tight text-sm text-foreground/80">
            DayOne
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Theme Preview
          </span>
          <ModeToggle />
        </div>
      </header>
    )
}