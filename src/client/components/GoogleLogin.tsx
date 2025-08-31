/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { authService } from "../../shared/util/authService";

export function GoogleLogin()
{
    const handleLogin = (e: MouseEvent) =>
    {
        e.stopPropagation();
        window.location.href = authService.getAuthURL();
    };

    return (
        <div className="google-login">
            <button onClick={handleLogin} className="google-login-btn">
                <img src='/content/images/svg/google-logo.svg' alt='Google Logo' /> &nbsp; Sign in with Google
            </button>
        </div>
    );
}