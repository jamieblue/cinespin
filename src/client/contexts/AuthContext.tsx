/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import { authService } from "../../shared/util/authService";
import { User } from "../../shared/models/users/user";
import { listService } from "../../shared/services/listService";
import { FilmList } from "shared/models/lists/FilmList";

interface AuthContextType
{
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: any })
{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () =>
    {
        try
        {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            // if (currentUser && currentUser.id)
            // {
            //     const lists = await listService.getListsForUser(currentUser.id, currentUser.id);
            //     console.log(lists);
            //     if (lists.success && lists.data.lists)
            //     {
            //         setUser({ ...currentUser, lists: lists.data.lists });
            //     }
            //     else if (lists.success === false)
            //     {
            //         console.error('Failed to fetch user lists:', lists.error);
            //     }
            // }
        } catch (error)
        {
            setUser(null);
        } finally
        {
            setLoading(false);
        }
    };

    const logout = async () =>
    {
        try
        {
            await authService.logout();
            setUser(null);
        } catch (error)
        {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth()
{
    const context = useContext(AuthContext);
    if (!context)
    {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}