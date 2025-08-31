import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { Film } from "../../../../shared/models/films/Film";
import { FilmList } from "../../../../shared/models/lists/FilmList";
import { orderBy } from "lodash";

const prisma = new PrismaClient();

interface GetListsForUserQueryRequest
{
    userId: number;
}

interface GetListsForUserQueryResponse
{
    lists: FilmList[];
}

export class GetListsForUserQueryHandler
    implements QueryHandler<GetListsForUserQueryRequest, GetListsForUserQueryResponse>
{
    async handle(request: GetListsForUserQueryRequest): Promise<Result<GetListsForUserQueryResponse>>
    {
        const user = await prisma.users.findUnique({
            where: { id: request.userId },
        });

        if (!user)
        {
            return { success: false, error: "User not found." };
        }

        const lists = await prisma.lists.findMany({
            where: { userId: user.id },
            include: {
                films: {
                    take: 4,
                    orderBy: {
                        createdDate: 'desc'
                    },
                    include: {
                        film: true
                    }
                }
            }
        });

        const response: FilmList[] = orderBy(lists, ['createdDate'], ['asc']).map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
            privacyType: list.privacyType,
            slug: list.slug,
            userId: list.userId,
            createdDate: list.createdDate,
            updatedDate: list.updatedDate,
            films: list.films.map(filmList => ({
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
                metacritic_vote_count: filmList.film.metacriticVoteCount
            } as Film))
        }));

        return {
            success: true,
            data: { lists: response }
        };
    }
}