/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import { useWindowSize } from "../../hooks/UseWindowsize";

type ProgressiveBackdropProps = {
    backdropPath?: string;
    className?: string;
};

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
let sizes = ["w300", "w780", "w1280", "original"];

export function ProgressiveBackdrop({ backdropPath, className }: ProgressiveBackdropProps)
{
    const [currentSrc, setCurrentSrc] = useState(`${ TMDB_IMAGE_BASE_URL }/w300${ backdropPath }`);
    const { isMobile } = useWindowSize();

    if (isMobile)
    {
        sizes = ["w300", "w780"];
    }

    useEffect(() =>
    {
        let canceled = false;

        const loadNext = (index: number) =>
        {
            if (index >= sizes.length) return;
            const nextSrc = `${ TMDB_IMAGE_BASE_URL }/${ sizes[index] }${ backdropPath }`;
            const img = new window.Image();
            img.src = nextSrc;
            img.onload = () =>
            {
                if (!canceled)
                {
                    setCurrentSrc(nextSrc);
                    loadNext(index + 1);
                }
            };
        };

        // Start progressive loading
        setCurrentSrc(`${ TMDB_IMAGE_BASE_URL }/w300${ backdropPath }`);
        loadNext(1);

        return () => { canceled = true; };
    }, [backdropPath]);

    return (
        <img
            src={currentSrc}
            alt="Backdrop"
            className={className}
            loading="eager"
            fetchPriority="high"
        />
    );
}