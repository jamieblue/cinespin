/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import { authService } from "../../shared/util/authService";
import { User } from "../../shared/models/users/user";

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