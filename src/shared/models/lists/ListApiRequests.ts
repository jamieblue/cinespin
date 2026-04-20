import { Film } from "../films/Film";
import { FilmList } from "./FilmList";
import { ListPrivacyType } from "./ListPrivacyType";

// Requests
export interface CreateListRequest
{
    name: string;
    description: string;
    privacy: ListPrivacyType;
    film?: Film;
}

export type AddFilmToListRequest = 
    | { listId: number; film: Film }
    | { listName: string; film: Film, userId: number };

export interface AddFilmToListResponse
{
    message: string;
}

// Responses
export interface CreateListResponse
{
    listId: number;
}

export interface GetMyListsResponse
{
    lists: FilmList[];
}

export interface GetListRequest
{
    listId: number;
}

export interface CheckFilmInListsQueryRequest {
    userId: number;
    tmdbIds: number[];
}

export interface CheckFilmInListsQueryResponse {
    liked: number[];
    disliked: number[];
}

export interface GetListResponse
{
    list: FilmList;
}

export interface RemoveFilmFromListRequest
{
    listId: number;
    filmId: number;
}

export interface RemoveFilmFromListResponse
{
    message: string;
}