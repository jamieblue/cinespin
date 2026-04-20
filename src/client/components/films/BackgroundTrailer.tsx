/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";
import { ProgressiveBackdrop } from "../UI/ProgressiveBackdrop";
import { useUserSettings } from "../../contexts/UserSettingsContext";

type Props = {
    youtubeKey?: string;
    backdropUrl: string;
    startAt?: number;
    duration?: number;
    className?: string;
    /** Use youtube-nocookie.com. Note: can cause postMessage warnings in dev. */
    privacyEnhanced?: boolean;
    /** Hide the background video when the [startAt, startAt+duration) segment completes */
    hideOnEnd?: boolean;
    respectNetwork?: boolean;
    /** Minimum effectiveType required to load video. Default "3g" (blocks 2g/slow-2g). */
    minEffectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    showbackdrop?: boolean;
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
    // If already loaded, resolve immediately
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__ytApiPromise__) return window.__ytApiPromise__;

    window.__ytApiPromise__ = new Promise<void>((resolve) =>
    {
        // Set the global callback BEFORE adding the script to avoid race
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

// Runtime env hints (client-only)
const IS_LOCAL =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

export function BackgroundTrailer({
    youtubeKey,
    backdropUrl,
    startAt = 0,
    duration = 30,
    className,
    // In dev: use normal youtube.com to reduce postMessage noise; in prod: use nocookie
    privacyEnhanced = !IS_LOCAL,
    hideOnEnd = true,
    // In dev: allow loading even on slow links; in prod: respect network
    respectNetwork = !IS_LOCAL,
    minEffectiveType = "4g",
    showbackdrop = true
}: Props)
{
    const slotIdRef = useRef<string>(`yt-slot-${ Math.random().toString(36).slice(2) }`);
    const playerRef = useRef<any>(null);

    const [ready, setReady] = useState(false);
    const [backdropVisible, setbackdropVisible] = useState(true);
    const { videosDisabled, setVideosDisabled } = useUserSettings();

    const endTimeoutRef = useRef<number | null>(null);
    const fallbackTimerRef = useRef<number | null>(null);
    const moRef = useRef<MutationObserver | null>(null);

    const disabledByNetwork = (() =>
    {
        if (!respectNetwork) return false;
        const nav = navigator as any;
        const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
        if (conn?.saveData) return true;
        const eff: string | undefined = conn?.effectiveType;
        if (!eff) return false;
        const order = ["slow-2g", "2g", "3g", "4g"];
        return order.indexOf(eff) < order.indexOf(minEffectiveType);
    })();

    useEffect(() =>
    {
        // If no youtube key, just show the backdrop
        if (!youtubeKey)
        {
            setReady(false);
            setbackdropVisible(true);
            return;
        }

        if (videosDisabled || disabledByNetwork)
        {
            setReady(false);
            setbackdropVisible(true);
            return;
        }

        let canceled = false;

        (async () =>
        {
            try
            {
                await loadYouTubeAPI();
                if (canceled) return;

                // Always start clean on key change
                if (playerRef.current)
                {
                    try { playerRef.current.destroy(); } catch { }
                    playerRef.current = null;
                }

                const host = privacyEnhanced ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
                const slotId = slotIdRef.current;

                playerRef.current = new window.YT.Player(slotId, {
                    host,
                    videoId: youtubeKey,
                    width: "100%",
                    height: "100%",
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        rel: 0,
                        modestbranding: 1,
                        iv_load_policy: 3,
                        playsinline: 1,
                        start: Math.floor(startAt),
                        end: Math.floor(startAt + duration),
                        mute: 1,
                        loop: hideOnEnd ? 0 : 1,
                        ...(hideOnEnd ? {} : { playlist: youtubeKey }),
                        origin: window.location.origin,
                        enablejsapi: 1
                    },
                    events: {
                        onReady: (e: any) =>
                        {
                            if (canceled) return;
                            try
                            {
                                e.target.mute();
                                e.target.setPlaybackQuality?.("small");
                                e.target.playVideo();
                            } catch { }
                        },
                        onStateChange: (evt: any) =>
                        {
                            if (canceled) return;

                            if (evt.data === window.YT.PlayerState.PLAYING)
                            {
                                setReady(true);
                                setbackdropVisible(false);

                                // Schedule one end timeout instead of polling
                                if (hideOnEnd)
                                {
                                    const segmentLengthMs = duration * 1000;
                                    if (endTimeoutRef.current)
                                    {
                                        window.clearTimeout(endTimeoutRef.current);
                                    }
                                    endTimeoutRef.current = window.setTimeout(() =>
                                    {
                                        if (canceled) return;
                                        try { evt.target.pauseVideo?.(); } catch { }
                                        setReady(false);
                                        setbackdropVisible(true);
                                    }, Math.max(500, segmentLengthMs - 300));
                                }
                            }

                            if (evt.data === window.YT.PlayerState.ENDED)
                            {
                                if (hideOnEnd)
                                {
                                    setReady(false);
                                    setbackdropVisible(true);
                                } else
                                {
                                    try { evt.target.seekTo(startAt, true); } catch { }
                                }
                            }
                        },
                        onError: () =>
                        {
                            if (canceled) return;
                            setReady(false);
                            setbackdropVisible(true);
                            try { playerRef.current?.destroy?.(); } catch { }
                            playerRef.current = null;
                        }
                    }
                });

                // Fallback: if iframe appears but onReady is delayed, show video shell (backdrop stays until onReady/PLAYING)
                const slotEl = document.getElementById(slotId);
                if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = window.setTimeout(() =>
                {
                    if (!canceled && !ready && slotEl?.querySelector("iframe")) setReady(true);
                }, 1200);

                if (moRef.current) moRef.current.disconnect();
                if (slotEl)
                {
                    moRef.current = new MutationObserver(() =>
                    {
                        if (!canceled && !ready && slotEl.querySelector("iframe")) setReady(true);
                    });
                    moRef.current.observe(slotEl, { childList: true });
                }
            } catch
            {
                if (!canceled)
                {
                    setReady(false);
                    setbackdropVisible(true);
                }
            }
        })();

        return () =>
        {
            canceled = true;
            if (endTimeoutRef.current)
            {
                window.clearTimeout(endTimeoutRef.current);
                endTimeoutRef.current = null;
            }
            if (fallbackTimerRef.current) { window.clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
            if (moRef.current) { moRef.current.disconnect(); moRef.current = null; }
            if (playerRef.current) { try { playerRef.current.destroy(); } catch { } playerRef.current = null; }
        };
    }, [youtubeKey, startAt, duration, videosDisabled, privacyEnhanced, hideOnEnd, disabledByNetwork]);

    const handleDisableVideos = () =>
    {
        const newState = !videosDisabled;
        setVideosDisabled(newState);
    };

    return (
        <>
            {/* <span
                className="disable-video"
                onClick={handleDisableVideos}
                key={videosDisabled ? "disabled" : "enabled"}
            >
                <i class={videosDisabled ? "fa-solid fa-video" : "fa-solid fa-video-slash"}></i>
            </span> */}
            <div className={className ?? ""}>
                <ProgressiveBackdrop backdropPath={backdropUrl} className={backdropVisible && showbackdrop ? "visible fade-in" : "hidden fade-out"} />

                <div className="yt-bg" aria-hidden="true">
                    <div className={`yt-iframe ${ ready ? "visible" : "hidden" }`}>
                        <div
                            id={slotIdRef.current}
                            key={youtubeKey ?? "none"}
                            className="yt-slot"
                        />
                    </div>
                </div>

                <div className="overlay" />
            </div>
        </>
    );
}