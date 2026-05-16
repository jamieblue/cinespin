import axios, { AxiosRequestConfig } from "axios";
import { Result } from "../models/api/Result";

const isBrowser = typeof window !== "undefined";

// Check if we're on localhost or local IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
const isLocalNetwork = isBrowser && (
    window.location?.hostname === "localhost" ||
    window.location?.hostname === "127.0.0.1" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(window.location?.hostname || "") ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location?.hostname || "") ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(window.location?.hostname || "")
);

// Build API base URL
const getApiBaseUrl = () =>
{
    if (!isBrowser)
    {
        return "http://localhost:3001";
    }

    if (isLocalNetwork)
    {
        const hostname = window.location?.hostname || "localhost";
        return `http://${ hostname }:3001`;
    }

    return "/";
};

const axiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

class ApiClient
{
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T>>
    {
        try
        {
            const response = await axiosInstance.get<Result<T>>(url, config);
            return response.data;
        }
        catch (error: any)
        {
            return this.handleError(error);
        }
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>>
    {
        try
        {
            const response = await axiosInstance.post<Result<T>>(url, data, config);
            return response.data;
        }
        catch (error: any)
        {
            return this.handleError(error);
        }
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>>
    {
        try
        {
            const response = await axiosInstance.put<Result<T>>(url, data, config);
            return response.data;
        }
        catch (error: any)
        {
            return this.handleError(error);
        }
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T>>
    {
        try
        {
            const response = await axiosInstance.delete<Result<T>>(url, config);
            return response.data;
        }
        catch (error: any)
        {
            return this.handleError(error);
        }
    }

    private handleError<T>(error: any): Result<T>
    {
        if (error.response?.data?.error)
        {
            return error.response.data;
        }

        if (error.response?.status === 401)
        {
            return { success: false, error: "Unauthorized - please log in" };
        }

        return { success: false, error: error.message || "Network error occurred" };
    }
}

export const apiClient = new ApiClient();