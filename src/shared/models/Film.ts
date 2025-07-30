import { Genre } from "./Genre";

export type Film = {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    release_date: number;
    vote_count: string;
    vote_average: number;
    imdb_rating?: number;
    imdb_id?: string;
    imdb_vote_count?: string;
    metacritic_rating?: number;
    metacritic_vote_count?: string;
    genres: Genre[];
};
