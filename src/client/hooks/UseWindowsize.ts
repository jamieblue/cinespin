import { useState, useEffect, useRef } from "preact/hooks";

export function useWindowSize()
{
    const [size, setSize] = useState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 820);
    const [resizeFinished, setResizeFinished] = useState(true);
    const timeoutRef = useRef<number | undefined>(undefined);

    useEffect(() =>
    {
        function handleResize()
        {
            setSize({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
            setIsMobile(window.innerWidth < 820);

            setResizeFinished(false);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() =>
            {
                setResizeFinished(true);
            }, 200); // 200ms debounce
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return { ...size, isMobile, resizeFinished };
}