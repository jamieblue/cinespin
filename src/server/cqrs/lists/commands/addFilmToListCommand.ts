import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import * as dateTimeProvider from "../../../../shared/util/dateTimeProvider";
import { Film } from "../../../../shared/models/films/Film";
import { FilmList } from "../../../../shared/models/lists/FilmList";

const prisma = new PrismaClient();

interface AddFilmToListCommandRequest
{
    listId: number;
    film: Film;
}

interface AddFilmToListCommandResponse
{
    list: FilmList;
}

export class AddFilmToListCommandHandler
    implements CommandHandler<AddFilmToListCommandRequest, AddFilmToListCommandResponse>
{
    async handle(request: AddFilmToListCommandRequest): Promise<Result<AddFilmToListCommandResponse>>
    {
        try
        {
            let newFilm;
            const list = await prisma.lists.findUnique({
                where: { id: request.listId },
            });

            if (!list)
            {
                return { success: false, error: "List not found" };
            }

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

            const existingFilmList = await prisma.filmLists.findUnique({
                where: {
                    listId_filmId: {
                        listId: request.listId,
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
                    listId: request.listId,
                    filmId: newFilm.id,
                    createdDate: dateTimeProvider.now(),
                    updatedDate: dateTimeProvider.now(),
                }
            });

            // Refetch the updated list with all films
            const updatedList = await prisma.lists.findUnique({
                where: { id: request.listId },
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
                    list: {
                        id: updatedList.id,
                        userId: updatedList.userId,
                        name: updatedList.name,
                        slug: updatedList.slug,
                        privacyType: updatedList.privacyType,
                        description: updatedList.description,
                        createdDate: updatedList.createdDate,
                        updatedDate: updatedList.updatedDate,
                        films: updatedList.films.map(filmList => ({
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
                    }
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