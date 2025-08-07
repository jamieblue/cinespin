import { PrismaClient, Prisma } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import * as DateTimeProvider from "../../../../shared/util/dateTimeProvider";
import { Genre } from 'src/shared/models/films/Genre';

const prisma = new PrismaClient();

interface UpdateGenresTableCommandRequest
{
    genres: Genre[];
}

export class UpdateGenresTableCommandHandler
    implements CommandHandler<UpdateGenresTableCommandRequest, void>
{
    async handle(request: UpdateGenresTableCommandRequest): Promise<Result<void>>
    {
        try
        {
            const genreIds = request.genres.map((g) => g.id);

            await prisma.genres.deleteMany({
                where: {
                    id: {
                        notIn: genreIds,
                    },
                },
            });

            await Promise.all(
                request.genres.map((genre) =>
                    prisma.genres.upsert({
                        where: { id: genre.id },
                        update: { name: genre.name },
                        create: {
                            id: genre.id,
                            name: genre.name,
                            createdDate: DateTimeProvider.now(),
                        },
                    })
                )
            );

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