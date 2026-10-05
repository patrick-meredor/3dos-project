import { ModeToggle } from "./ui/toggle";

export function Header(){
    return (
        <header className="w-full max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-tight text-sm text-foreground/80">
            3dos
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