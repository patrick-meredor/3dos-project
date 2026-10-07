"use client"

import { useMainQuotes } from "@/hooks/main"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function Main() {
    const { currentIndex, quotes } = useMainQuotes()

    return (
        <main className="flex-1 w-full flex flex-col justify-end">
            <div className="flex -space-x-3 mb-2">
                <div className="relative z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-xs shadow-sm">
                    <Image src="/carousel_1.png" alt="Profile Picture" width={100} height={100} className="rounded-full object-cover" />
                </div>
                <div className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-xs shadow-sm">
                    <Image src="/carousel_2.png" alt="Profile Picture" width={100} height={100} className="rounded-full object-cover" />
                </div>
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground text-xs shadow-sm">
                    <Image src="/carousel_3.png" alt="Profile Picture" width={100} height={100} className="rounded-full object-cover" />
                </div>
            </div>
            <div className="grid grid-cols-1 items-start">
                {quotes.map((quote, idx) => (
                    <h1
                        key={idx}
                        aria-hidden={idx !== currentIndex}
                        className={cn(
                            "col-start-1 row-start-1 text-7xl md:text-6xl font-bold font-bernoru leading-[1.1] w-full transition-opacity duration-500 ease-in-out",
                            idx === currentIndex
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none select-none"
                        )}
                    >
                        {quote}
                        <span className="text-orange-500 dark:invert">.</span>
                    </h1>
                ))}
            </div>
        </main>
    )
}