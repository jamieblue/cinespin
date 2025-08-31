import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { FilmList } from "../../../../shared/models/lists/FilmList";
import { Film } from "../../../../shared/models/films/Film";
import { Genre } from "../../../../shared/models/films/Genre";
import { ListPrivacyType } from "../../../../shared/models/lists/ListPrivacyType";
import { orderBy } from "lodash";

const prisma = new PrismaClient();

interface GetListByIDQueryRequest
{
    userId?: number;
    listId: number;
}

interface GetListByIDQueryResponse
{
    list: FilmList;
}

export class GetListByIDQueryHandler
    implements QueryHandler<GetListByIDQueryRequest, GetListByIDQueryResponse>
{

    async handle(
        request: GetListByIDQueryRequest
    ): Promise<Result<GetListByIDQueryResponse>>
    {
        const list = await prisma.lists.findUnique({
            where: { id: request.listId },
            include: {
                films: {
                    include: {
                        film: {
                            include: {
                                genres: {
                                    include: {
                                        genre: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!list)
        {
            return { success: false, error: "List not found" };
        }

        if (!request.userId && list.privacyType === ListPrivacyType.Private)
        {
            return { success: false, error: "This list is private" };
        }

        return {
            success: true,
            data: {
                list: {
                    id: list.id,
                    name: list.name,
                    slug: list.slug,
                    description: list.description,
                    privacyType: list.privacyType,
                    userId: list.userId,
                    createdDate: list.createdDate,
                    updatedDate: list.updatedDate,
                    films: orderBy(list.films, ['film.createdDate'], ['desc']).map(filmList => ({
                        id: filmList.film.id,
                        tmdb_id: filmList.film.tmdbId || 0,
                        title: filmList.film.title,
                        overview: filmList.film.overview,
                        poster_path: filmList.film.posterPath,
                        release_year: filmList.film.releaseYear,
                        tmdb_vote_count: filmList.film.tmdbVoteCount,
                        tmdb_rating: Number(filmList.film.tmdbRating) || 0,
                        imdb_id: filmList.film.imdbId,
                        imdb_rating: Number(filmList.film.imdbRating) || 0,
                        imdb_vote_count: filmList.film.imdbVoteCount,
                        metacritic_rating: filmList.film.metacriticRating,
                        metacritic_vote_count: filmList.film.metacriticVoteCount,
                        genres: filmList.film.genres.map(genreFilm => ({
                            id: genreFilm.genre.id,
                            name: genreFilm.genre.name,
                        }) as Genre)
                    }) as Film),
                }
            },
        };
    }
}