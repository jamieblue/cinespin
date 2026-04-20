/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext } from 'preact';
import { useState, useContext, useCallback } from 'preact/hooks';
import { BottomSheet } from '../components/UI/BottomSheet';
import { Film } from '../../shared/models/films/Film';
import { getRatingColor } from '../../shared/util/metacriticHelper';
import { GenerateFilmSlug } from '../../shared/util/filmHelper';
import { route } from 'preact-router';

type State = {
    film: Film | null;
    open: boolean;
};

type Ctx = {
    openFilmSheet: (film: Film) => void;
    closeFilmSheet: () => void;
};

const FilmSheetCtx = createContext<Ctx | null>(null);

export function FilmBottomSheetProvider({ children }: { children: preact.ComponentChildren })
{
    const [state, setState] = useState<State>({ film: null, open: false });
    const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

    const openFilmSheet = useCallback((film: Film) =>
    {
        setState({ film, open: true });
    }, []);

    const closeFilmSheet = useCallback(() =>
    {
        setState(s => ({ ...s, open: false }));
    }, []);

    const onNavigate = (film: Film) =>
    {
        route(`/films/${ encodeURIComponent(GenerateFilmSlug(film.title)) }/${ encodeURIComponent(String(film.tmdb_id)) }`);
        closeFilmSheet();
    };

    const handleShare = async () =>
    {
        if (!state.film) return;
        const url = `${ window.location.origin }/films/${ encodeURIComponent(GenerateFilmSlug(state.film.title)) }/${ encodeURIComponent(String(state.film.tmdb_id)) }`;
        try
        {
            await navigator.clipboard.writeText(url);
            setCopyStatus("copied");
            setTimeout(() => setCopyStatus("idle"), 1500);
        }
        catch
        {
            setCopyStatus("error");
            setTimeout(() => setCopyStatus("idle"), 1500);
        }
    };

    return (
        <FilmSheetCtx.Provider value={{ openFilmSheet, closeFilmSheet }}>
            {children}
            <BottomSheet open={state.open} onClose={closeFilmSheet} height="65%">
                {state.film && (
                    <div class="film-sheet-content">
                        <div class="film-sheet-header-row">
                            <div class="film-sheet-poster">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${ state.film.poster_path }`}
                                    alt={state.film.title}
                                    loading="lazy"
                                />
                            </div>
                            <div class="film-sheet-meta">
                                <h3>{state.film.title} ({state.film.release_year})</h3>
                                <div class="sheet-actions">
                                    <button class="sheet-btn" onClick={() => onNavigate(state.film!)}><i class="fa-solid fa-eye-slash red"></i> <span>Watched</span></button>
                                    <button class="sheet-btn"><i className="fa-solid fa-plus"></i> <span>Add to List</span></button>
                                    <button class="sheet-btn"><i class="fa-solid fa-thumbs-up green"></i> <span>Good</span></button>
                                    <button class="sheet-btn"><i class="fa-solid fa-thumbs-down red"></i> <span>Bad</span></button>
                                </div>
                            </div>
                        </div>
                        <div className="sheet-large-actions">
                            <button class="sheet-btn" onClick={() => onNavigate(state.film!)}><i class="fa-solid fa-film"></i> <span>Go to film</span></button>
                            <button class="sheet-btn" onClick={handleShare}>
                                <i class="fa-solid fa-share"></i>
                                <span>
                                    {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Share"}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </FilmSheetCtx.Provider>
    );
}

export function useFilmBottomSheet()
{
    const ctx = useContext(FilmSheetCtx);
    if (!ctx) throw new Error('useFilmBottomSheet used outside FilmBottomSheetProvider');
    return ctx;
}