import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { ListPrivacyType } from "../../../../shared/models/lists/ListPrivacyType";

const prisma = new PrismaClient();

interface GetListBySlugQueryRequest
{
    slug: string;
}

export class GetListBySlugQueryHandler
{
    async handle(request: GetListBySlugQueryRequest): Promise<Result<any>>
    {
        const list = await prisma.lists.findUnique({
            where: { slug: request.slug },
            include: { films: true, user: true }
        });

        if (!list)
        {
            return { success: false, error: "List not found" };
        }

        if (list.privacyType == ListPrivacyType.Private)
        {
            return { success: false, error: "List is private" };
        }

        return { success: true, data: { list } };
    }
}