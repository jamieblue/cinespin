/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState, useEffect } from "preact/hooks";
import axios from "axios";
import { User } from "../../shared/models/users/user";
import { authService } from "../../shared/util/authService";

export function GoogleLogin()
{
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () =>
    {
        try
        {
            const user = await authService.getCurrentUser();
            setUser(user);
        } catch (error)
        {
            // Don't log 401 errors as they're expected when not authenticated
            if (axios.isAxiosError(error) && error.response?.status !== 401)
            {
                console.error('Auth check failed:', error);
            }
        } finally
        {
            setLoading(false);
        }
    };

    const handleLogin = () =>
    {
        setLoading(true)
        window.location.href = '/auth/google';
    };

    return (
        <button onClick={handleLogin} disabled={loading} className="google-login-btn">
            <img src='/content/images/svg/google-logo.svg' alt='Google Logo' /> &nbsp; Sign in with Google
        </button>
    );
}