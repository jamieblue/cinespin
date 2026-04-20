import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import * as dateTimeProvider from "../../../../shared/util/dateTimeProvider";
import { Film } from "../../../../shared/models/films/Film";
import { FilmList } from "../../../../shared/models/lists/FilmList";

const prisma = new PrismaClient();

type AddFilmToListCommandRequest = 
    | { listId: number; film: Film }
    | { listName: string; film: Film; userId: number };

interface AddFilmToListCommandResponse
{
    list: FilmList;
}

export class AddFilmToListCommandHandler
    implements CommandHandler<AddFilmToListCommandRequest, AddFilmToListCommandResponse>
{
    private mapToFilmList(list: any): FilmList
    {
        return {
            id: list.id,
            userId: list.userId,
            name: list.name,
            slug: list.slug,
            privacyType: list.privacyType,
            description: list.description,
            createdDate: list.createdDate,
            updatedDate: list.updatedDate,
            films: list.films.map((filmList: any) => ({
                id: filmList.film.id,
                tmdb_id: filmList.film.tmdbId || undefined,
                title: filmList.film.title,
                overview: filmList.film.overview || '',
                poster_path: filmList.film.posterPath || '',
                release_year: filmList.film.releaseYear,
                tmdb_vote_count: filmList.film.tmdbVoteCount || '',
                tmdb_rating: Number(filmList.film.tmdbRating) || 0,
                imdb_id: filmList.film.imdbId || undefined,
                imdb_rating: Number(filmList.film.imdbRating) || undefined,
                imdb_vote_count: filmList.film.imdbVoteCount || undefined,
                metacritic_rating: filmList.film.metacriticRating || undefined,
                metacritic_vote_count: filmList.film.metacriticVoteCount || undefined,
                genres: []
            } as Film))
        };
    }

    async handle(request: AddFilmToListCommandRequest): Promise<Result<AddFilmToListCommandResponse>>
    {
        try
        {
            let newFilm;
            let list;
            
            // Handle both listId and listName cases
            if ('listId' in request)
            {
                list = await prisma.lists.findUnique({
                    where: { id: request.listId },
                });
            }
            else
            {
                list = await prisma.lists.findFirst({
                    where: { 
                        name: request.listName,
                        userId: request.userId
                    },
                });
            }

            if (!list)
            {
                return { success: false, error: "List not found" };
            }
            
            const listId = list.id;

            newFilm = await prisma.films.upsert({
                where: { tmdbId: request.film.tmdb_id },
                update: {
                    title: request.film.title,
                    posterPath: request.film.poster_path,
                    tmdbId: request.film.tmdb_id,
                    imdbId: request.film.imdb_id,
                    tmdbRating: request.film.tmdb_rating,
                    tmdbVoteCount: request.film.tmdb_vote_count,
                    imdbRating: request.film.imdb_rating,
                    imdbVoteCount: request.film.imdb_vote_count,
                    metacriticVoteCount: request.film.metacritic_vote_count,
                    metacriticRating: request.film.metacritic_rating,
                    overview: request.film.overview,
                    releaseYear: request.film.release_year,
                    updatedDate: dateTimeProvider.now(),
                },
                create: {
                    title: request.film.title,
                    posterPath: request.film.poster_path,
                    tmdbId: request.film.tmdb_id,
                    imdbId: request.film.imdb_id,
                    tmdbRating: request.film.tmdb_rating,
                    tmdbVoteCount: request.film.tmdb_vote_count,
                    imdbRating: request.film.imdb_rating,
                    imdbVoteCount: request.film.imdb_vote_count,
                    metacriticVoteCount: request.film.metacritic_vote_count,
                    metacriticRating: request.film.metacritic_rating,
                    overview: request.film.overview,
                    releaseYear: request.film.release_year,
                    createdDate: dateTimeProvider.now(),
                    updatedDate: dateTimeProvider.now(),
                },
            });

            if (!newFilm)
            {
                return { success: false, error: "Failed to add film to list" };
            }

            // Handle special logic for "Liked" and "Disliked" lists
            const isLikedOrDisliked = list.name === "Liked" || list.name === "Disliked";
            
            if (isLikedOrDisliked)
            {
                const oppositeListName = list.name === "Liked" ? "Disliked" : "Liked";
                const userId = 'userId' in request ? request.userId : list.userId;
                
                // Find the opposite list
                const oppositeList = await prisma.lists.findFirst({
                    where: {
                        name: oppositeListName,
                        userId: userId
                    }
                });

                // Check if film exists in current list
                const existingInCurrentList = await prisma.filmLists.findUnique({
                    where: {
                        listId_filmId: {
                            listId: listId,
                            filmId: newFilm.id,
                        }
                    }
                });

                // If film already exists in current list, remove it (toggle off)
                if (existingInCurrentList)
                {
                    await prisma.filmLists.delete({
                        where: {
                            listId_filmId: {
                                listId: listId,
                                filmId: newFilm.id,
                            }
                        }
                    });

                    // Refetch the updated list
                    const updatedList = await prisma.lists.findUnique({
                        where: { id: listId },
                        include: {
                            films: {
                                include: {
                                    film: true
                                }
                            }
                        }
                    });

                    if (!updatedList)
                    {
                        return { success: false, error: "Failed to retrieve updated list" };
                    }

                    return {
                        success: true,
                        data: {
                            list: this.mapToFilmList(updatedList)
                        }
                    };
                }

                // If film exists in opposite list, remove it from there
                if (oppositeList)
                {
                    const existingInOppositeList = await prisma.filmLists.findUnique({
                        where: {
                            listId_filmId: {
                                listId: oppositeList.id,
                                filmId: newFilm.id,
                            }
                        }
                    });

                    if (existingInOppositeList)
                    {
                        await prisma.filmLists.delete({
                            where: {
                                listId_filmId: {
                                    listId: oppositeList.id,
                                    filmId: newFilm.id,
                                }
                            }
                        });
                    }
                }

                // Add to current list
                await prisma.filmLists.create({
                    data: {
                        listId: listId,
                        filmId: newFilm.id,
                        createdDate: dateTimeProvider.now(),
                        updatedDate: dateTimeProvider.now(),
                    }
                });
            }
            else
            {
                // Normal list logic - check if already exists
                const existingFilmList = await prisma.filmLists.findUnique({
                    where: {
                        listId_filmId: {
                            listId: listId,
                            filmId: newFilm.id,
                        }
                    }
                });

                if (existingFilmList)
                {
                    return { success: false, error: "This film has already been added to the list" };
                }

                await prisma.filmLists.create({
                    data: {
                        listId: listId,
                        filmId: newFilm.id,
                        createdDate: dateTimeProvider.now(),
                        updatedDate: dateTimeProvider.now(),
                    }
                });
            }

            // Refetch the updated list with all films
            const updatedList = await prisma.lists.findUnique({
                where: { id: listId },
                include: {
                    films: {
                        include: {
                            film: true
                        }
                    }
                }
            });

            if (!updatedList)
            {
                return { success: false, error: "Failed to retrieve updated list" };
            }

            // Map to FilmList format
            return {
                success: true,
                data: {
                    list: this.mapToFilmList(updatedList)
                }
            };
        } catch (err)
        {
            const message = PrismaErrorHandler(err);
            return {
                success: false,
                error: message ?? "An unexpected database error occurred.",
            };
        }
    }
}