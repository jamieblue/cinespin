import axios from "axios";
import { User } from "src/shared/models/users/user";

class AuthService
{
    private static instance: AuthService;

    public static getInstance(): AuthService
    {
        if (!AuthService.instance)
        {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    async getCurrentUser(): Promise<User | null>
    {
        try
        {
            const response = await axios.get(`/auth/me`, {
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
            await axios.post(`/auth/logout`, {}, {
                withCredentials: true
            });
        } catch (error)
        {
            throw new Error(`Failed to logout: ${ error }`);
        }

    }
}

export const authService = AuthService.getInstance();