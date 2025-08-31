import axios, { AxiosRequestConfig } from "axios";
import { Result } from "../models/api/Result";

const axiosInstance = axios.create({
    baseURL: window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
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
        } catch (error: any)
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
        } catch (error: any)
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
        } catch (error: any)
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
        } catch (error: any)
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
            return {
                success: false,
                error: 'Unauthorized - please log in'
            };
        }

        return {
            success: false,
            error: error.message || 'Network error occurred'
        };
    }
}

export const apiClient = new ApiClient();