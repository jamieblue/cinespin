import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { Genre } from 'src/shared/models/films/Genre';

const prisma = new PrismaClient();

interface GetAllGenresRequest
{
}

export class GetAllGenresQueryHandler
    implements QueryHandler<GetAllGenresRequest, { genres: Genre[] }>
{
    async handle(
        request: GetAllGenresRequest
    ): Promise<Result<{ genres: Genre[] }>>
    {
        const genres = await prisma.genres.findMany();

        if (!genres.length)
        {
            return { success: false, error: "No genres found." };
        }

        return {
            success: true,
            data:
            {
                genres: genres.map((genre: Genre) => ({
                    id: genre.id,
                    name: genre.name,
                    createdDate: genre.createdDate,
                })),
            },
        };
    }
}
