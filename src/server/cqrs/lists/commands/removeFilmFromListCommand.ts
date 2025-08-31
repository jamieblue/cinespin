import { PrismaClient, Prisma } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import { RemoveFilmFromListResponse } from "src/shared/models/lists/ListApiRequests";

const prisma = new PrismaClient();

interface RemoveFilmFromListCommandRequest
{
    listId: number;
    filmId: number;
}

export class RemoveFilmFromListCommandHandler
    implements CommandHandler<RemoveFilmFromListCommandRequest, RemoveFilmFromListResponse>
{
    async handle(request: RemoveFilmFromListCommandRequest): Promise<Result<RemoveFilmFromListResponse>>
    {
        try
        {
            const { listId, filmId } = request;

            // Check if the list exists
            const list = await prisma.lists.findUnique({
                where: { id: listId },
                include: { films: true },
            });

            if (!list)
            {
                return { success: false, error: "List not found" };
            }

            const filmIndex = list.films.findIndex(film => film.filmId === filmId);
            if (filmIndex === -1)
            {
                return { success: false, error: "Film not found in list" };
            }

            await prisma.filmLists.delete({
                where: {
                    listId_filmId: {
                        listId,
                        filmId,
                    },
                },
            });

            return { success: true, data: { message: "Film removed from list successfully" } };
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