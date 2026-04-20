/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";

type Props = {
    youtubeKey?: string;
    startAt?: number;
    duration?: number;
    play: boolean;
    preload?: boolean;
    className?: string;
    disabled?: boolean;
    privacyEnhanced?: boolean;
    avoidRecommendations?: boolean;
};

declare global
{
    interface Window
    {
        YT?: any;
        onYouTubeIframeAPIReady?: () => void;
        __ytApiPromise__?: Promise<void>;
    }
}

function loadYouTubeAPI(): Promise<void>
{
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__ytApiPromise__) return window.__ytApiPromise__;
    window.__ytApiPromise__ = new Promise<void>((resolve) =>
    {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () =>
        {
            prev?.();
            resolve();
        };
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
    });
    return window.__ytApiPromise__;
}

const IS_LOCAL =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

export function TileBackgroundTrailer({
    youtubeKey,
    startAt = 0,
    duration = 30,
    play,
    preload = true,
    className,
    disabled = false,
    privacyEnhanced = !IS_LOCAL,
    avoidRecommendations = true
}: Props)
{
    const slotIdRef = useRef(`tile-yt-${ Math.random().toString(36).slice(2) }`);
    const playerRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [started, setStarted] = useState(false);          // NEW: video actually started buffering/playing
    const [errorCode, setErrorCode] = useState<number | null>(null); // NEW: store YT error code
    const loopGuardRef = useRef<number | null>(null);
    const startGuardRef = useRef<number | null>(null);      // NEW: timeout guard

    const segStart = Math.max(0, startAt);
    const segEnd = Math.max(segStart + Math.max(1, duration), segStart + 1);

    const disabledByNetwork = (() =>
    {
        const nav = navigator as any;
        const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
        if (conn?.saveData) return true;
        const eff: string | undefined = conn?.effectiveType;
        if (!eff) return false;
        return eff.includes("2g") || eff.includes("3g");
    })();

    useEffect(() =>
    {
        setLoadError(false);
        setStarted(false);
        setErrorCode(null);
    }, [youtubeKey]);

    const shouldInit = !!youtubeKey && !loadError && !disabled && !disabledByNetwork && (preload || play);

    useEffect(() =>
    {
        let canceled = false;
        if (!shouldInit) return;

        (async () =>
        {
            try
            {
                await loadYouTubeAPI();
                if (canceled) return;

                if (playerRef.current)
                {
                    try { playerRef.current.seekTo(segStart, true); } catch { }
                    return;
                }

                const host = privacyEnhanced
                    ? "https://www.youtube-nocookie.com"
                    : "https://www.youtube.com";

                playerRef.current = new window.YT.Player(slotIdRef.current, {
                    host,
                    videoId: youtubeKey,
                    width: "100%",
                    height: "100%",
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        disablekb: 1,
                        rel: 0,
                        fs: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        mute: 1,
                        start: Math.floor(segStart),
                        end: Math.floor(segEnd),
                        origin: window.location.origin
                    },
                    events: {
                        onReady: (e: any) =>
                        {
                            if (canceled) return;
                            try
                            {
                                e.target.mute();
                                e.target.setPlaybackQuality("small");
                                e.target.seekTo(segStart, true);
                                setReady(true);
                                if (play) e.target.playVideo();
                            } catch { }
                        },
                        onStateChange: (evt: any) =>
                        {
                            if (canceled) return;
                            const ps = window.YT.PlayerState;
                            if (evt?.data === ps.PLAYING || evt?.data === ps.BUFFERING)
                            {
                                setStarted(true);
                            }
                            if (evt?.data === ps.ENDED)
                            {
                                try { evt.target.seekTo(segStart, true); } catch { }
                            }
                        },
                        onError: (evt: any) =>
                        {
                            if (canceled) return;
                            setErrorCode(evt?.data ?? -1);
                            setLoadError(true);
                            setReady(false);
                            try { playerRef.current?.destroy?.(); } catch { }
                            playerRef.current = null;
                        }
                    }
                });
            } catch
            {
                if (!canceled)
                {
                    setLoadError(true);
                    setReady(false);
                }
            }
        })();

        return () => { canceled = true; };
    }, [shouldInit, youtubeKey, privacyEnhanced, segStart, segEnd, play]);

    // Play / pause effect
    useEffect(() =>
    {
        const p = playerRef.current;
        if (!p || !ready || loadError) return;
        try
        {
            if (play)
            {
                const t = p.getCurrentTime?.() ?? 0;
                if (t < segStart || t > segEnd) p.seekTo(segStart, true);
                p.playVideo?.();
            } else
            {
                p.pauseVideo?.();
                p.seekTo?.(segStart, true);
            }
        } catch { }
    }, [play, ready, segStart, segEnd, loadError]);

    // Guard: if user hovers (play true) but we never reach PLAYING/BUFFERING soon, treat as error (embedding blocked / region)
    useEffect(() =>
    {
        if (loadError)
        {
            if (startGuardRef.current) { clearTimeout(startGuardRef.current); startGuardRef.current = null; }
            return;
        }
        if (play && ready && !started)
        {
            if (startGuardRef.current) clearTimeout(startGuardRef.current);
            startGuardRef.current = window.setTimeout(() =>
            {
                if (!started && !loadError)
                {
                    setLoadError(true);
                    setErrorCode(errorCode ?? 999); // custom code
                    try { playerRef.current?.destroy?.(); } catch { }
                    playerRef.current = null;
                }
            }, 1500); // 1.5s grace
        } else
        {
            if (startGuardRef.current) { clearTimeout(startGuardRef.current); startGuardRef.current = null; }
        }
        return () =>
        {
            if (startGuardRef.current) { clearTimeout(startGuardRef.current); startGuardRef.current = null; }
        };
    }, [play, ready, started, loadError, errorCode]);

    // Loop guard (avoid end-screen)
    useEffect(() =>
    {
        const p = playerRef.current;
        if (!p || !ready || !avoidRecommendations || loadError)
        {
            if (loopGuardRef.current)
            {
                clearInterval(loopGuardRef.current);
                loopGuardRef.current = null;
            }
            return;
        }
        if (!play)
        {
            if (loopGuardRef.current)
            {
                clearInterval(loopGuardRef.current);
                loopGuardRef.current = null;
            }
            return;
        }
        loopGuardRef.current = window.setInterval(() =>
        {
            try
            {
                const t = p.getCurrentTime?.() ?? 0;
                if (t >= segEnd - 0.6) p.seekTo(segStart, true);
            } catch { }
        }, 300);
        return () =>
        {
            if (loopGuardRef.current)
            {
                clearInterval(loopGuardRef.current);
                loopGuardRef.current = null;
            }
        };
    }, [play, ready, segStart, segEnd, avoidRecommendations, loadError]);

    // Cleanup
    useEffect(() =>
    {
        return () =>
        {
            if (loopGuardRef.current) { clearInterval(loopGuardRef.current); loopGuardRef.current = null; }
            if (startGuardRef.current) { clearTimeout(startGuardRef.current); startGuardRef.current = null; }
            if (playerRef.current) { try { playerRef.current.destroy(); } catch { } playerRef.current = null; }
        };
    }, []);

    // Do not render iframe if an error occurred
    if (loadError) return null;

    // Hide until actually started (prevents brief YouTube overlay flashes)
    const visibleClass = (play && started) ? "playing" : "";
    return (
        <div className={`${ className ?? "" } tile-trailer-wrapper ${ visibleClass } ${ ready ? "ready" : "loading" }`}>
            <div className="tile-trailer-iframe">
                <div id={slotIdRef.current} className="tile-trailer-slot" />
            </div>
        </div>
    );
}