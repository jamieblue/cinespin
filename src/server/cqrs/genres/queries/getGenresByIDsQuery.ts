import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { Genre } from "../../../../shared/models/Genre";

const prisma = new PrismaClient();

interface GetGenresRequest
{
    genreIds: number[];
}

export class GetGenresByIDsQueryHandler
    implements QueryHandler<GetGenresRequest, { genres: Genre[] }>
{
    async handle(
        request: GetGenresRequest
    ): Promise<Result<{ genres: Genre[] }>>
    {
        const genres = await prisma.genres.findMany({
            where:
            {
                id: { in: request.genreIds },
            },
        });

        if (!genres.length)
        {
            return { success: false, error: "No genres found." };
        }

        return {
            success: true,
            data:
            {
                genres: genres.map((genre) => ({
                    id: genre.id,
                    name: genre.name,
                    createdDate: genre.createdDate,
                })),
            },
        };
    }
}
