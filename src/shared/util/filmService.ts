import axios from "axios";
import { Film } from "../../shared/models/films/Film";

class FilmService
{
    private static instance: FilmService;
    private readonly apiBaseUrl: string;

    private constructor()
    {
        // Hardcode for development, use relative for production
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : '/api'; // Relative URLs in production (same domain)
    }

    public static getInstance(): FilmService
    {
        if (!FilmService.instance)
        {
            FilmService.instance = new FilmService();
        }
        return FilmService.instance;
    }

    async getRandomFilm(): Promise<Film>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/random-film`);
            return response.data as Film;
        } catch (error)
        {
            throw new Error(`Failed to fetch random film: ${ error }`);
        }
    }

    async getRandomGoodFilm(): Promise<Film>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/random-good-film`);
            return response.data as Film;
        } catch (error)
        {
            throw new Error(`Failed to fetch random good film: ${ error }`);
        }
    }

    async getRandomBadFilm(): Promise<Film>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/random-bad-film`);
            return response.data as Film;
        } catch (error)
        {
            throw new Error(`Failed to fetch random bad film: ${ error }`);
        }
    }

    async searchFilms(query: string): Promise<Film[]>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/search`, {
                params: { searchTerm: query }
            });
            return response.data as Film[];
        } catch (error)
        {
            throw new Error(`Failed to search films: ${ error }`);
        }
    }

    async getPopularFilms(): Promise<Film[]>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/popular`);
            return response.data as Film[];
        } catch (error)
        {
            throw new Error(`Failed to fetch popular films: ${ error }`);
        }
    }

    async getUpcomingFilms(): Promise<Film[]>
    {
        try
        {
            const response = await axios.get(`${ this.apiBaseUrl }/tmdb/upcoming`);
            return response.data as Film[];
        } catch (error)
        {
            throw new Error(`Failed to fetch upcoming films: ${ error }`);
        }
    }
}

export const filmService = FilmService.getInstance();