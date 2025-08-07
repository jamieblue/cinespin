import { PrismaClient } from "@prisma/client";
import { QueryHandler } from "../../queryHandler";
import { Result } from "../../result";
import { User } from "../../../../shared/models/users/user";

const prisma = new PrismaClient();

interface GetGoogleUserByIDQueryRequest
{
    userId: number;
}

export class GetGoogleUserByIDQueryHandler
    implements QueryHandler<GetGoogleUserByIDQueryRequest, { user: User }>
{
    async handle(request: GetGoogleUserByIDQueryRequest): Promise<Result<{ user: User }>>
    {
        const user = await prisma.users.findUnique({
            where: { id: request.userId },
        });

        if (!user)
        {
            return { success: false, error: "User not found." };
        }

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    googleId: user.googleId,
                    email: user.email,
                    name: user.name,
                    createdDate: user.createdDate,
                    updatedDate: user.updatedDate,
                },
            },
        };
    }
}