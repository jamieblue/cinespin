import { Result } from "../models/api/Result";
import { apiClient } from "./apiClient";
import { GetFilmResponse, GetFilmsRequest, GetFilmsResponse } from "../../shared/models/films/TmdbApiRequests";

class FilmService
{
    private static instance: FilmService;
    private readonly apiBaseUrl: string;

    private constructor() { }

    public static getInstance(): FilmService
    {
        if (!FilmService.instance)
        {
            FilmService.instance = new FilmService();
        }
        return FilmService.instance;
    }

    async getRandomFilm(): Promise<Result<GetFilmResponse>>
    {
        return await apiClient.get<GetFilmResponse>('api/tmdb/random-film');
    }

    async getRandomGoodFilm(): Promise<Result<GetFilmResponse>>
    {
        return await apiClient.get<GetFilmResponse>('api/tmdb/random-good-film');
    }

    async getRandomBadFilm(): Promise<Result<GetFilmResponse>>
    {
        return await apiClient.get<GetFilmResponse>('api/tmdb/random-bad-film');
    }

    async searchFilms(query: string): Promise<Result<GetFilmsResponse>>
    {
        const request: GetFilmsRequest = { query: query };
        return await apiClient.post<GetFilmsResponse>('api/tmdb/search', request);
    }

    async getPopularFilms(): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.get<GetFilmsResponse>('api/tmdb/popular');
    }

    async getUpcomingFilms(): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.get<GetFilmsResponse>('api/tmdb/upcoming');
    }
}

export const filmService = FilmService.getInstance();