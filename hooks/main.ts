import { useEffect, useState } from 'react'

export function useMainQuotes() {
    const quotes = [
        "It's not what we do once in a while that shapes our lives. It's what we do consistently",
        "The only way to do great work is to love what you do",
        "Success is not final, failure is not fatal: it is the courage to continue that counts",
        "Believe you can and you're halfway there",
        "Do not go where the path may lead, go instead where there is no path and leave a trail",
    ]
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        // Set up the timer to run every 5000 milliseconds (5 seconds)
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length)
        }, 5000)

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval)
    }, [quotes.length])

    return {
        currentQuote: quotes[currentIndex],
        currentIndex,
        quotes,
    }
}
