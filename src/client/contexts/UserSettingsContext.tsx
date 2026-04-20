/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext } from "preact";
import { useState, useContext, useEffect } from "preact/hooks";

type UserSettingsContextType = {
    videosDisabled: boolean;
    setVideosDisabled: (disabled: boolean) => void;
};

const UserSettingsContext = createContext<UserSettingsContextType | null>(null);

export function UserSettingsProvider({ children }: { children: any })
{
    const [videosDisabled, setVideosDisabled] = useState<boolean>(() =>
    {
        const saved = localStorage.getItem('disableVideos');
        return saved === 'true';
    });

    useEffect(() =>
    {
        const saved = localStorage.getItem('disableVideos');
        if (saved !== null)
        {
            setVideosDisabled(saved === 'true');
        }
    }, []);

    useEffect(() =>
    {
        localStorage.setItem('disableVideos', videosDisabled.toString());
    }, [videosDisabled]);

    return (
        <UserSettingsContext.Provider value={{ videosDisabled, setVideosDisabled }}>
            {children}
        </UserSettingsContext.Provider>
    );
}

export function useUserSettings()
{
    const context = useContext(UserSettingsContext);
    if (!context)
    {
        throw new Error('useUserSettings must be used within a UserSettingsProvider');
    }
    return context;
}