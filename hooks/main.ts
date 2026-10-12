"use client";
import { useState, useEffect } from 'react'

import { quoteItems, type QuoteAuthor } from '@/lib/quotes'

export { quoteItems }
export type { QuoteAuthor }

export function useMainQuotes() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        // Automatically cycle every 6 seconds
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % quoteItems.length)
        }, 6000)

        return () => clearInterval(interval)
    }, [])

    return {
        currentQuote: quoteItems[currentIndex].quote,
        currentAuthor: quoteItems[currentIndex].author,
        currentIndex,
        setCurrentIndex,
        quotes: quoteItems.map((item) => item.quote),
        items: quoteItems,
    }
}
