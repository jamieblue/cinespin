import { Film } from "../films/Film";

// Responses
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