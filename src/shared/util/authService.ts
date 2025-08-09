import axios from "axios";
import { User } from "src/shared/models/users/user";

class AuthService
{
    private static instance: AuthService;
    private readonly apiBaseUrl: string;

    private constructor()
    {
        // Hardcode for development, use relative for production
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : ''; // Relative URLs in production (same domain)
    }

    public static getInstance(): AuthService
    {
        if (!AuthService.instance)
        {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    getAuthURL(): string
    {
        return `${ this.apiBaseUrl }/auth/google`;
    }

    async getCurrentUser(): Promise<User | null>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/auth/me`, {
                withCredentials: true
            });
            return response.data.user;
        } catch (error)
        {
            throw new Error(`Failed to get current user: ${ error }`);
        }
    }

    async logout(): Promise<void>
    {
        try
        {
            await axios.post(`${ this.apiBaseUrl }/auth/logout`, {}, {
                withCredentials: true
            });
        } catch (error)
        {
            throw new Error(`Failed to logout: ${ error }`);
        }

    }
}

export const authService = AuthService.getInstance();