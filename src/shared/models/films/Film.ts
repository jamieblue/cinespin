import { Genre } from "./Genre";

export type Film = {
    id?: number;
    tmdb_id?: number;
    title: string;
    overview: string;
    poster_path: string;
    release_year: number;
    tmdb_vote_count: string;
    tmdb_rating: number;
    imdb_rating?: number;
    imdb_id?: string;
    imdb_vote_count?: string;
    metacritic_url?: string;
    metacritic_rating?: number;
    metacritic_vote_count?: string;
    genres: Genre[];
};
