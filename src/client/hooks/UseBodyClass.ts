import { useEffect } from "preact/hooks";

export function useBodyClass(className: string)
{
    useEffect(() =>
    {
        document.body.classList.add(className);
        return () =>
        {
            document.body.classList.remove(className);
        };
    }, [className]);
}