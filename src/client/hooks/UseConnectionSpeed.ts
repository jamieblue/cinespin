import { useEffect, useState } from "preact/hooks";

export function useConnectionSpeed()
{
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() =>
    {
        const nav = navigator as any;
        const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
        const check = () =>
        {
            if (conn?.saveData) return setIsSlow(true);
            const eff: string | undefined = conn?.effectiveType;
            setIsSlow(eff ? eff.includes("2g") || eff.includes("3g") : false);
        };
        check();
        conn?.addEventListener?.("change", check);
        return () => conn?.removeEventListener?.("change", check);
    }, []);

    return isSlow;
}