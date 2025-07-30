import { PrismaClient, Prisma } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import * as DateTimeProvider from "../../../../shared/util/dateTimeProvider";

const prisma = new PrismaClient();

interface UpdateOrAddGenreCommandRequest
{
    genreID: number;
    genreName: string;
}

export class UpdateOrAddGenreCommandHandler
    implements CommandHandler<UpdateOrAddGenreCommandRequest, void>
{
    async handle(request: UpdateOrAddGenreCommandRequest): Promise<Result<void>>
    {
        try
        {
            await prisma.genres.upsert({
                where: { id: request.genreID },
                update: { name: request.genreName },
                create: { id: request.genreID, name: request.genreName, createdDate: DateTimeProvider.now() },
            })

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