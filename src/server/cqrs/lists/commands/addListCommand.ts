import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import * as dateTimeProvider from "../../../../shared/util/dateTimeProvider";
import { ListPrivacyType } from "../../../../shared/models/lists/ListPrivacyType";
import { Film } from "../../../../shared/models/films/Film";
import * as listHelper from "../../../../shared/util/listHelper";

const prisma = new PrismaClient();

interface AddListCommandRequest
{
    name: string;
    privacy: ListPrivacyType;
    film?: Film;
    userId: number;
    description: string;
}

interface AddListCommandResponse
{
    listId: number;
}

export class AddListCommandHandler
    implements CommandHandler<AddListCommandRequest, AddListCommandResponse>
{
    async handle(request: AddListCommandRequest): Promise<Result<AddListCommandResponse>>
    {
        try
        {
            const list = await prisma.lists.findFirst({
                where: {
                    name: request.name,
                    userId: request.userId
                }
            });

            if (list)
            {
                return { success: false, error: "A list with this name already exists" };
            }

            const user = await prisma.users.findUnique({
                where: { id: request.userId }
            });

            if (!user)
            {
                return { success: false, error: "User not found" };
            }

            const newList = await prisma.lists.create({
                data: {
                    name: request.name,
                    userId: request.userId,
                    description: request.description,
                    slug: await listHelper.generateUniqueSlug(user.name, request.name),
                    privacyType: Number(request.privacy),
                    createdDate: dateTimeProvider.now(),
                    updatedDate: dateTimeProvider.now(),
                }
            });

            if (request.film?.id)
            {
                await prisma.filmLists.create({
                    data: {
                        listId: newList.id,
                        filmId: request.film.id,
                        createdDate: dateTimeProvider.now(),
                        updatedDate: dateTimeProvider.now(),
                    }
                });
            }
            else if (request.film)
            {
                await prisma.films.create({
                    data: {
                        title: request.film.title,
                        posterPath: request.film.poster_path,
                        tmdbId: request.film.tmdb_id,
                        imdbId: request.film.imdb_id,
                        tmdbVoteCount: request.film.tmdb_vote_count,
                        imdbVoteCount: request.film.imdb_vote_count,
                        metacriticVoteCount: request.film.metacritic_vote_count,
                        metacriticRating: request.film.metacritic_rating,
                        overview: request.film.overview,
                        releaseYear: request.film.release_year,
                        createdDate: dateTimeProvider.now(),
                        updatedDate: dateTimeProvider.now(),
                    }
                });
            }

            return { success: true, data: { listId: newList.id } };
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