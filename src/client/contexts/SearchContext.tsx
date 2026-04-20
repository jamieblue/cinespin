/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { ComponentChildren, createContext } from "preact";
import { useState, useContext } from "preact/hooks";

type SearchContextType = {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ComponentChildren })
{
    const [searchQuery, setSearchQuery] = useState("");
    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch(): SearchContextType
{
    const ctx = useContext(SearchContext);
    if (!ctx) throw new Error("useSearch must be used within SearchProvider");
    return ctx;
}