import { Film } from "../films/Film";
import { RandomFilmRatingThreshold } from "./RandomFilmRatingThreshold";

export interface GetRandomFilmRequest
{
    rating?: number;
    count?: number;
    randomFilmRatingThreshold?: RandomFilmRatingThreshold;
    hydration?: boolean;
    getYoutubeKey?: boolean;
}

export interface GetFilmResponse
{
    film: Film;
}

export interface GetFilmsRequest
{
    query: string;
}

export interface GetFilmsResponse
{
    films: Film[];
}

export type ImdbBatchItem = {
    tmdb_id: number;
    imdb_id?: string;
    imdb_rating: number;
    imdb_vote_count: string;
    metacritic_url?: string;
    metacritic_rating: number;
    metacritic_vote_count: string;
};

export type GetImdbRatingsBatchResponse = {
    ratings: Partial<Film>[];
};