import { PrismaClient, Prisma } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import { Genre } from "../../../../shared/models/films/Genre";

const prisma = new PrismaClient();

interface AddGenresCommandRequest
{
    genres: Genre[];
}

export class AddGenresCommandHandler
    implements CommandHandler<AddGenresCommandRequest, void>
{
    async handle(request: AddGenresCommandRequest): Promise<Result<void>>
    {
        try
        {
            await prisma.genres.createMany({
                data: request.genres.map((g) => ({
                    id: g.id,
                    name: g.name,
                    createdDate: g.createdDate,
                })),
                skipDuplicates: true,
            });

            return { success: true };
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