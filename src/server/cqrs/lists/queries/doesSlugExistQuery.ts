import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";

const prisma = new PrismaClient();

interface DoesSlugExistQueryRequest
{
    slug: string;
}

export class DoesSlugExistQueryHandler
    implements QueryHandler<DoesSlugExistQueryRequest, boolean>
{
    async handle(request: DoesSlugExistQueryRequest): Promise<Result<boolean>>
    {
        const list = await prisma.lists.findUnique({
            where: { slug: request.slug }
        });

        return { success: true, data: !!list };
    }
}