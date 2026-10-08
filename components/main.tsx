"use client"

import { useMainQuotes } from "@/hooks/main"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function Main() {
    const { currentIndex, setCurrentIndex, items } = useMainQuotes()

    return (
        <main className="flex-1 w-full flex flex-col justify-end pb-8 sm:pb-14 px-4 sm:px-8 max-w-7xl mx-auto">
            {/* Three circles author avatars + active author pill */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300 py-1">
                    {items.map((item, idx) => {
                        const isActive = idx === currentIndex
                        return (
                            <button
                                key={item.author}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                title={item.author}
                                aria-label={`View quote by ${item.author}`}
                                className={cn(
                                    "relative rounded-full transition-all duration-300 focus:outline-none cursor-pointer",
                                    "h-14 w-14 sm:h-16 sm:w-16 overflow-hidden border-2 shadow-md",
                                    isActive
                                        ? "z-30 scale-110 border-orange-500 ring-4 ring-orange-500/25 shadow-lg"
                                        : "z-10 opacity-70 hover:opacity-100 hover:scale-105 border-background bg-muted"
                                )}
                            >
                                <div className="w-full h-full bg-white dark:bg-zinc-950 flex items-center justify-center">
                                    <Image
                                        src={item.image}
                                        alt={item.author}
                                        width={160}
                                        height={160}
                                        priority
                                        className="w-full h-full object-cover dark:invert transition-transform duration-300"
                                    />
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Active author indicator badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/70 border border-border/50 text-xs sm:text-sm font-semibold font-signika tracking-wider uppercase text-foreground">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span>{items[currentIndex]?.author}</span>
                </div>
            </div>

            {/* Rotating Quotes */}
            <div className="grid grid-cols-1 items-start min-h-[140px] sm:min-h-[180px]">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        aria-hidden={idx !== currentIndex}
                        className={cn(
                            "col-start-1 row-start-1 w-full transition-opacity duration-500 ease-in-out",
                            idx === currentIndex
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none select-none"
                        )}
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-bernoru leading-[1.1] tracking-tight">
                            {item.quote}
                            <span className="text-orange-500 dark:invert">.</span>
                        </h1>
                    </div>
                ))}
            </div>
        </main>
    )
}