export const scrollLock = {
    enable: () =>
    {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${ window.innerWidth - document.documentElement.clientWidth }px`; // Prevent layout shift
    },
    disable: () =>
    {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
};

export function scrollToTop(smooth = true)
{
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = smooth && !prefersReduced ? 'smooth' : 'auto';
    const scroller = document.scrollingElement || document.documentElement || document.body;

    if ((scroller as HTMLElement).scrollTop === 0)
    {
        return;
    }

    try
    {
        if ((scroller as any).scrollTo)
        {
            (scroller as any).scrollTo({ top: 0, left: 0, behavior });
            return;
        }
    }
    catch
    {
        return;
    }

    if (typeof window.scrollTo === "function")
    {
        window.scrollTo({ top: 0, left: 0, behavior });
        return;
    }

    (scroller as HTMLElement).scrollTop = 0;
}