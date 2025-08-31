import { AddFilmToListRequest, AddFilmToListResponse, CreateListRequest, CreateListResponse, GetListRequest, GetListResponse, GetMyListsResponse, RemoveFilmFromListRequest, RemoveFilmFromListResponse } from "../models/lists/ListApiRequests";
import { Result } from "../models/api/Result";
import { apiClient } from "./apiClient";
import { ListPrivacyType } from "../models/lists/ListPrivacyType";
import { Film } from "../models/films/Film";

class ListService
{
    private static instance: ListService;

    private constructor() { }

    public static getInstance(): ListService
    {
        if (!ListService.instance)
        {
            ListService.instance = new ListService();
        }
        return ListService.instance;
    }

    async getMyLists(): Promise<Result<GetMyListsResponse>>
    {
        return await apiClient.get<GetMyListsResponse>('/lists/my-lists');
    }

    async createList(name: string, description: string, privacy: ListPrivacyType, film?: Film): Promise<Result<CreateListResponse>>
    {
        const request: CreateListRequest = {
            name,
            description,
            privacy,
            film
        };

        return await apiClient.post<CreateListResponse>('/lists/create', request);
    }

    async addFilmToList(request: AddFilmToListRequest): Promise<Result<AddFilmToListResponse>>
    {
        return await apiClient.put<AddFilmToListResponse>('/lists/add-to-list', request);
    }

    async getList(request: GetListRequest): Promise<Result<GetListResponse>>
    {
        return await apiClient.get<GetListResponse>(`/lists/get-list/${ request.listId }`);
    }

    async getListBySlug(slug: string): Promise<Result<GetListResponse>>
    {
        return await apiClient.get<GetListResponse>(`/lists/view/${ slug }`);
    }

    async doesSlugExist(slug: string): Promise<Result<boolean>>
    {
        return await apiClient.get<boolean>(`/lists/does-slug-exist/${ slug }`);
    }

    async removeFilmFromList(request: RemoveFilmFromListRequest): Promise<Result<RemoveFilmFromListResponse>>
    {
        return await apiClient.delete<RemoveFilmFromListResponse>('/lists/remove-from-list', { data: request });
    }
}

export const listService = ListService.getInstance();