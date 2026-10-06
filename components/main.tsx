"use client"

import { useMainQuotes } from "@/hooks/main"

export default function Main() {
    const { currentQuote } = useMainQuotes()

    return (
        <main className="flex-1 w-full flex flex-col justify-end">
            <div className="flex -space-x-3">
                <div className="relative z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-[#fa2c7a] text-xs font-bold font-mono text-white shadow-sm">
                    03
                </div>
                <div className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-[#fa2c7a] text-xs font-bold font-mono text-white shadow-sm">
                    02
                </div>
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-[#fa2c7a] text-xs font-bold font-mono text-white shadow-sm">
                    01
                </div>
            </div>
            <h1 className="text-7xl md:text-6xl font-bold font-bernoru leading-[1.1] w-full transition-opacity transition-discrete duration-500 ease-in-out">
                {currentQuote}
                <span className="text-orange-500 dark:invert">.</span>
            </h1>
        </main>
    )
}