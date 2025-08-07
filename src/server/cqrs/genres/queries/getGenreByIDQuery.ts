import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { Genre } from "../../../../shared/models/films/Genre";

const prisma = new PrismaClient();

interface GetGenreByIDQueryRequest
{
    genreId: number;
}

export class GetGenreByIDQueryHandler
    implements QueryHandler<GetGenreByIDQueryRequest, { genre: Genre }>
{
    async handle(
        request: GetGenreByIDQueryRequest
    ): Promise<Result<{ genre: Genre }>>
    {
        const genre = await prisma.genres.findFirst({
            where: {
                id: request.genreId,
            },
        });

        if (!genre)
        {
            return { success: false, error: "Genre not found." };
        }

        return {
            success: true,
            data:
            {
                genre: {
                    id: genre.id,
                    name: genre.name,
                    createdDate: genre.createdDate,
                },
            },
        };
    }
}