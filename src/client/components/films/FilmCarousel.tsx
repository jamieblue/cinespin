/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect, useRef } from "preact/hooks";
import { Film } from "../../../shared/models/films/Film";
import { FilmList } from "../../../shared/models/lists/FilmList";
import { FilmTile } from "./FilmTile";
import { FilmGridLoadingPlaceholder } from "./FilmGridLoadingPlaceHolder";
import { filmService } from "../../../shared/services/filmService";
import { chunk } from "lodash";
import { useAuth } from "../../contexts/AuthContext";
import { listService } from "../../../shared/services/listService";

type Props = {
    title: string;
    fontawesome?: string;
    small?: boolean;
    currentList?: FilmList;
    onRemoveFilm?: (film: Film, list: FilmList) => void;
} & (
        | { films: Film[]; fetchFilms?: never; }
        | { films?: never; fetchFilms: () => Promise<Film[]>; }
    );

export function FilmGrid({ title, films: filmsProp, fetchFilms, fontawesome, small, currentList, onRemoveFilm }: Props)
{
    const { user } = useAuth();
    const [films, setFilms] = useState<Film[]>(filmsProp || []);
    const [loading, setLoading] = useState(false);
    const enrichmentStartedRef = useRef(false);
    const canceledRef = useRef(false);
    const scrollerRef = useRef<HTMLUListElement | null>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);
    const [pageInfo, setPageInfo] = useState({ page: 0, total: 0 });
    const EDGE_EPS = 8;
    
    // Always keep latest user in a ref to avoid stale closures
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Make these refs instead of state to avoid conflicts between grids
    const itemWidthRef = useRef(0);
    const scrollEndTimerRef = useRef<number | null>(null);
    const touchEndTimerRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef<number>(0);
    const isTouchScrollingRef = useRef(false);
    const isUpdatingRef = useRef(false); // Prevent recursive updates

    // Generate unique ID for this grid instance
    const gridIdRef = useRef(`grid-${ Math.random().toString(36).substring(2, 11) }`);

    // Helper function to enrich films with liked/disliked status
    const enrichFilmsWithStatus = async (filmsToEnrich: Film[]) => {
        // Always use the CURRENT user from ref, not closure
        const currentUser = userRef.current;
        
        console.log('🔍 enrichFilmsWithStatus called:', { 
            hasUser: !!currentUser, 
            userId: currentUser?.id, 
            filmCount: filmsToEnrich.length 
        });
        
        if (!currentUser || !filmsToEnrich.length) {
            console.log('⚠️ Skipping enrichment - no user or no films');
            return filmsToEnrich;
        }

        try {
            console.log('📡 Fetching liked/disliked status for', filmsToEnrich.length, 'films');
            const likedAndDisliked = await listService.checkFilmsInLists({
                userId: currentUser.id,
                tmdbIds: filmsToEnrich.map(f => f.tmdb_id)
            });

            if (likedAndDisliked.success) {
                console.log('✅ Got liked/disliked data:', {
                    liked: likedAndDisliked.data?.liked,
                    disliked: likedAndDisliked.data?.disliked
                });
                return filmsToEnrich.map(f => ({
                    ...f,
                    liked: likedAndDisliked.data?.liked.includes(f.tmdb_id) ?? false,
                    disliked: likedAndDisliked.data?.disliked.includes(f.tmdb_id) ?? false
                }));
            }
        } catch (error) {
            console.error("Failed to check films in lists:", error);
        }

        return filmsToEnrich;
    };

    useEffect(() =>
    {
        enrichmentStartedRef.current = false;
        
        const loadAndEnrichFilms = async () => {
            if (filmsProp) {
                setFilms(filmsProp);
                const enrichedFilms = await enrichFilmsWithStatus(filmsProp);
                setFilms(enrichedFilms);
            }
            else if (fetchFilms) {
                setLoading(true);
                try {
                    const fetchedFilms = await fetchFilms();
                    setFilms(fetchedFilms);
                    setLoading(false);
                    const enrichedFilms = await enrichFilmsWithStatus(fetchedFilms);
                    setFilms(enrichedFilms);
                } catch (error) {
                    console.error("Failed to fetch films:", error);
                    setLoading(false);
                }
            }
        };
        
        loadAndEnrichFilms();
    }, [filmsProp, fetchFilms]);

    // Separate effect to re-enrich when user logs in
    useEffect(() => {
        const reEnrichWhenUserLoads = async () => {
            if (!user || films.length === 0) return;
            
            console.log('User loaded, re-enriching films with liked/disliked status');
            const enrichedFilms = await enrichFilmsWithStatus(films);
            setFilms(enrichedFilms);
        };
        
        reEnrichWhenUserLoads();
    }, [user?.id]); // Only depend on user ID to avoid infinite loops

    useEffect(() =>
    {
        return () =>
        {
            canceledRef.current = true;
            if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
            if (touchEndTimerRef.current) clearTimeout(touchEndTimerRef.current);
        };
    }, []);

    useEffect(() =>
    {
        if (!films?.length || enrichmentStartedRef.current) return;
        enrichmentStartedRef.current = true;
        setLoading(false);

        (async () =>
        {
            const idsNeedingRatings = films
                .filter(f => (f.imdb_rating ?? 0) === 0)
                .map(f => f.tmdb_id);

            const batches = chunk(idsNeedingRatings, 5);

            for (const batch of batches)
            {
                if (canceledRef.current) break;

                const res = await filmService.getImdbRatingsBatch(batch);
                if (canceledRef.current || !res?.success) continue;

                const ratings = res.data?.ratings ?? [];
                if (!ratings.length) continue;

                setFilms(prev => prev.map(f =>
                {
                    const r = ratings.find(x => x.tmdb_id === f.tmdb_id);
                    return r ? {
                        ...f,
                        imdb_id: r.imdb_id,
                        imdb_rating: r.imdb_rating ?? 0,
                        imdb_vote_count: r.imdb_vote_count ?? "0",
                        metacritic_url: r.metacritic_url,
                        metacritic_rating: r.metacritic_rating ?? 0,
                        metacritic_vote_count: r.metacritic_vote_count ?? "0",
                        youtube_key: r.youtube_key ?? undefined
                    } : f;
                }));
            }
        })();
    }, [films]);

    const updateScrollMeta = () =>
    {
        const el = scrollerRef.current;
        if (!el || isUpdatingRef.current)
        {
            setAtStart(true);
            setAtEnd(true);
            setPageInfo({ page: 0, total: 0 });
            return;
        }

        isUpdatingRef.current = true;

        const scrollLeft = Math.round(el.scrollLeft);
        const clientWidth = el.clientWidth;
        const maxScrollLeft = Math.max(0, el.scrollWidth - clientWidth);

        const start = scrollLeft <= EDGE_EPS;
        const end = scrollLeft >= (maxScrollLeft - EDGE_EPS);

        // Calculate item width if not already calculated
        let currentItemWidth = itemWidthRef.current;
        if (!currentItemWidth && el.children.length > 0)
        {
            const firstItem = el.children[0] as HTMLElement;
            if (firstItem)
            {
                const style = window.getComputedStyle(firstItem);
                const width = firstItem.offsetWidth;
                const marginLeft = parseFloat(style.marginLeft) || 0;
                const marginRight = parseFloat(style.marginRight) || 0;
                currentItemWidth = width + marginLeft + marginRight;
                itemWidthRef.current = currentItemWidth;
            }
        }

        // Calculate pages based on actual item layout
        let page = 0;
        let totalPages = 1;

        if (currentItemWidth > 0 && clientWidth > 0)
        {
            const itemsPerPage = Math.floor(clientWidth / currentItemWidth);
            const totalItems = films?.length;
            totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

            // Calculate current page based on scroll position and item layout
            const itemsScrolled = Math.round(scrollLeft / currentItemWidth);
            page = Math.min(totalPages - 1, Math.floor(itemsScrolled / itemsPerPage));
        }

        setAtStart(start);
        setAtEnd(end);
        setPageInfo(p =>
        {
            if (p.page === page && p.total === totalPages)
            {
                isUpdatingRef.current = false;
                return p;
            }
            isUpdatingRef.current = false;
            return { page, total: totalPages };
        });
    };

    // Reset item width when films change
    useEffect(() =>
    {
        itemWidthRef.current = 0;
        // Small delay to let DOM update
        const timeout = setTimeout(() =>
        {
            updateScrollMeta();
        }, 50);
        return () => clearTimeout(timeout);
    }, [films]);

    // Enhanced scroll listener with better touch handling
    useEffect(() =>
    {
        const el = scrollerRef.current;
        if (!el) return;
        let raf = 0;
        let scrollTimeout: number | null = null;

        const onTouchStart = () =>
        {
            isTouchScrollingRef.current = true;
            if (touchEndTimerRef.current)
            {
                clearTimeout(touchEndTimerRef.current);
                touchEndTimerRef.current = null;
            }
        };

        const onTouchEnd = () =>
        {
            // Start monitoring for end of momentum scrolling
            if (touchEndTimerRef.current)
            {
                clearTimeout(touchEndTimerRef.current);
            }

            let lastPosition = el.scrollLeft;
            let checkCount = 0;
            const maxChecks = 20;

            const checkScrollEnd = () =>
            {
                if (canceledRef.current) return;

                const currentPosition = el.scrollLeft;

                if (Math.abs(currentPosition - lastPosition) < 1)
                {
                    checkCount++;
                    if (checkCount >= 3)
                    {
                        isTouchScrollingRef.current = false;
                        updateScrollMeta();
                        return;
                    }
                } else
                {
                    checkCount = 0;
                    lastPosition = currentPosition;
                }

                if (checkCount < maxChecks)
                {
                    touchEndTimerRef.current = window.setTimeout(checkScrollEnd, 50);
                }
            };

            touchEndTimerRef.current = window.setTimeout(checkScrollEnd, 100);
        };

        const onScroll = () =>
        {
            lastScrollTimeRef.current = Date.now();

            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(updateScrollMeta);

            if (scrollTimeout) clearTimeout(scrollTimeout);

            scrollTimeout = window.setTimeout(() =>
            {
                if (!canceledRef.current) updateScrollMeta();
            }, 100);
        };

        // Add event listeners
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('touchcancel', onTouchEnd, { passive: true });
        el.addEventListener('scroll', onScroll, { passive: true });

        // Use a resize observer instead of window resize listener for better isolation
        let resizeObserver: ResizeObserver | null = null;
        if ('ResizeObserver' in window)
        {
            resizeObserver = new ResizeObserver(() =>
            {
                if (!canceledRef.current) updateScrollMeta();
            });
            resizeObserver.observe(el);
        }

        return () =>
        {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
            el.removeEventListener('scroll', onScroll);
            if (raf) cancelAnimationFrame(raf);
            if (scrollTimeout) clearTimeout(scrollTimeout);
            if (touchEndTimerRef.current) clearTimeout(touchEndTimerRef.current);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [films?.length]); // Remove itemWidth dependency

    // Simplified stabilization
    const stabilizeAfterSmoothScroll = () =>
    {
        const el = scrollerRef.current;
        if (!el) return;

        let last = -1;
        let stableFrames = 0;
        const MAX_STABLE = 6;

        const tick = () =>
        {
            if (canceledRef.current) return;

            const now = el.scrollLeft;
            if (Math.abs(now - last) < 1) stableFrames++;
            else
            {
                stableFrames = 0;
                last = now;
            }
            updateScrollMeta();
            if (stableFrames < MAX_STABLE) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const pageScroll = (dir: 1 | -1) =>
    {
        const el = scrollerRef.current;
        const currentItemWidth = itemWidthRef.current;
        if (!el || !currentItemWidth) return;

        // Clear touch timers since this is programmatic
        if (touchEndTimerRef.current)
        {
            clearTimeout(touchEndTimerRef.current);
            touchEndTimerRef.current = null;
        }
        isTouchScrollingRef.current = false;

        // Scroll by one page worth of items
        const itemsPerPage = Math.floor(el.clientWidth / currentItemWidth);
        const scrollDistance = itemsPerPage * currentItemWidth * dir;
        const target = Math.max(0, Math.min(el.scrollLeft + scrollDistance, el.scrollWidth - el.clientWidth));

        el.scrollTo({ left: target, behavior: 'smooth' });
        stabilizeAfterSmoothScroll();
    };

    const scrollToPage = (page: number) =>
    {
        const el = scrollerRef.current;
        const currentItemWidth = itemWidthRef.current;
        if (!el || !currentItemWidth) return;

        // Clear touch timers since this is programmatic
        if (touchEndTimerRef.current)
        {
            clearTimeout(touchEndTimerRef.current);
            touchEndTimerRef.current = null;
        }
        isTouchScrollingRef.current = false;

        // Calculate target position based on actual item layout
        const itemsPerPage = Math.floor(el.clientWidth / currentItemWidth);
        const targetItemIndex = page * itemsPerPage;
        const target = Math.min(targetItemIndex * currentItemWidth, el.scrollWidth - el.clientWidth);

        el.scrollTo({ left: target, behavior: 'smooth' });
        stabilizeAfterSmoothScroll();
    };

    if (loading)
    {
        return (
            <FilmGridLoadingPlaceholder fontawesome={fontawesome} title={title} />
        );
    }

    return (
        <div className="film-list-container fade-in carousel-row" data-grid-id={gridIdRef.current}>
            <div className="row-header">
                <h2>
                    {fontawesome && <i className={fontawesome}></i>} {title}
                </h2>

                {pageInfo.total > 1 && (
                    <div
                        className="carousel-page-indicator"
                        role="tablist"
                        aria-label="Carousel pages"
                    >
                        {Array.from({ length: pageInfo.total }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={i === pageInfo.page}
                                aria-label={`Go to page ${ i + 1 } of ${ pageInfo.total }`}
                                className={`dot ${ i === pageInfo.page ? 'active' : '' }`}
                                onClick={() => scrollToPage(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <>
                <div className="scroller-wrapper">
                    <button
                        className="carousel-btn prev"
                        disabled={atStart}
                        onClick={() => pageScroll(-1)}
                        aria-label="Previous page"
                    >
                        <i class="fa-solid fa-chevron-left" />
                    </button>
                    <ul
                        ref={scrollerRef}
                        className={`film-list scroller ${ small ? 'small' : '' }`}
                        aria-label={`${ title } carousel`}
                        aria-live="polite"
                    >
                        {films.map(f => (
                            <li key={f.tmdb_id}>
                                <FilmTile
                                    film={f}
                                    small={small}
                                    currentList={currentList}
                                    onRemoveFilm={onRemoveFilm}
                                />
                            </li>
                        ))}
                    </ul>
                    <button
                        className="carousel-btn next"
                        disabled={atEnd}
                        onClick={() => pageScroll(1)}
                        aria-label="Next page"
                    >
                        <i class="fa-solid fa-chevron-right" />
                    </button>
                </div>
            </>
        </div>
    );
}