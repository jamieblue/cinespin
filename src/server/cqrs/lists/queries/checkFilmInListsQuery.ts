import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";

const prisma = new PrismaClient();

interface CheckFilmInListsQueryRequest
{
    userId: number;
    tmdbIds: number[];
}

interface CheckFilmInListsQueryResponse
{
    liked: number[];
    disliked: number[];
}

export class CheckFilmInListsQueryHandler
    implements QueryHandler<CheckFilmInListsQueryRequest, CheckFilmInListsQueryResponse>
{
    async handle(
        request: CheckFilmInListsQueryRequest
    ): Promise<Result<CheckFilmInListsQueryResponse>>
    {
        if (!request.userId)
        {
            return {
                success: true,
                data: {
                    liked: [],
                    disliked: []
                }
            };
        }

        // Find the user's "Liked" and "Disliked" lists
        const [likedList, dislikedList] = await Promise.all([
            prisma.lists.findFirst({
                where: {
                    userId: request.userId,
                    name: "Liked"
                },
                include: {
                    films: {
                        include: {
                            film: {
                                select: {
                                    tmdbId: true
                                }
                            }
                        },
                        where: {
                            film: {
                                tmdbId: {
                                    in: request.tmdbIds
                                }
                            }
                        }
                    }
                }
            }),
            prisma.lists.findFirst({
                where: {
                    userId: request.userId,
                    name: "Disliked"
                },
                include: {
                    films: {
                        include: {
                            film: {
                                select: {
                                    tmdbId: true
                                }
                            }
                        },
                        where: {
                            film: {
                                tmdbId: {
                                    in: request.tmdbIds
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Extract TMDB IDs from the results
        const likedTmdbIds = likedList?.films
            .map(filmList => filmList.film.tmdbId)
            .filter((id): id is number => id !== null) ?? [];

        const dislikedTmdbIds = dislikedList?.films
            .map(filmList => filmList.film.tmdbId)
            .filter((id): id is number => id !== null) ?? [];

        return {
            success: true,
            data: {
                liked: likedTmdbIds,
                disliked: dislikedTmdbIds
            }
        };
    }
}