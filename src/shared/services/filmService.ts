import { Result } from "../models/api/Result";
import { apiClient } from "./apiClient";
import { GetRandomFilmRequest, GetFilmResponse, GetFilmsRequest, GetFilmsResponse, GetImdbRatingsBatchResponse } from "../../shared/models/films/TmdbApiRequests";
import { Film } from "../models/films/Film";

class FilmService
{
    private static instance: FilmService;

    private constructor() { }

    public static getInstance(): FilmService
    {
        if (!FilmService.instance)
        {
            FilmService.instance = new FilmService();
        }
        return FilmService.instance;
    }

    async getRandomFilm(request?: GetRandomFilmRequest, signal?: AbortSignal): Promise<Result<GetFilmResponse>>
    {
        if (!request)
        {
            return await apiClient.get<GetFilmResponse>('api/tmdb/random-film', { signal });
        }

        return await apiClient.get<GetFilmResponse>('api/tmdb/random-film', { params: request, signal });
    }

    async getFilmDetails(film: Film, signal?: AbortSignal): Promise<Result<GetFilmResponse>>
    {
        return await apiClient.post<GetFilmResponse>(`api/tmdb/film/`, film, { signal });
    }

    async searchFilms(query: string, signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        const request: GetFilmsRequest = { query: query };
        return await apiClient.post<GetFilmsResponse>('api/tmdb/search', request, { signal });
    }

    async getPopularFilms(signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.get<GetFilmsResponse>('api/tmdb/popular', { signal });
    }

    async getUpcomingFilms(signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.get<GetFilmsResponse>('api/tmdb/upcoming', { signal });
    }

    async getRecommendations(filmId: number, signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.get<GetFilmsResponse>(`api/tmdb/${ filmId }/recommendations`, { signal });
    }

    async getFilmsByDirector(directorIds: number[], signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.post<GetFilmsResponse>(`api/tmdb/films-by-director`, { directorIds }, { signal });
    }

    async getBestFilms(signal?: AbortSignal): Promise<Result<GetFilmsResponse>>
    {
        return await apiClient.post<GetFilmsResponse>(`api/tmdb/best-films`, { signal });
    }

    async getImdbRatingsBatch(tmdbIds: number[], signal?: AbortSignal): Promise<Result<GetImdbRatingsBatchResponse>>
    {
        return await apiClient.post<GetImdbRatingsBatchResponse>('api/tmdb/ratings/batch', { tmdbIds }, { signal });
    }
}

export const filmService = FilmService.getInstance();