import { useEffect, useState } from 'react'

export interface QuoteAuthor {
    quote: string
    author: string
    image: string
}

export const quoteItems: QuoteAuthor[] = [
    {
        quote: "Similarly we become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.",
        author: "Aristotle",
        image: "/carousel_1.png",
    },
    {
        quote: "The best project you'll ever work on is you. Don't dream about success, get up and work for it.",
        author: "Dean Graziosi",
        image: "/carousel_2.png",
    },
    {
        quote: "Do the best you can until you know better. Then when you know better, do better.",
        author: "Maya Angelou",
        image: "/carousel_3.png",
    },
]

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
