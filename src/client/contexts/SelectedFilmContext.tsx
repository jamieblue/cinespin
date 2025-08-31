/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext } from "preact";
import { useState, useContext } from "preact/hooks";
import { Film } from "../../shared/models/films/Film";

const SelectedFilmContext = createContext<[Film | null, (film: Film | null) => void]>([null, () => { }]);

export function SelectedFilmProvider({ children })
{
    const state = useState<Film | null>(null);
    return (
        <SelectedFilmContext.Provider value={state}>
            {children}
        </SelectedFilmContext.Provider>
    );
}

export function useSelectedFilm()
{
    return useContext(SelectedFilmContext);
}