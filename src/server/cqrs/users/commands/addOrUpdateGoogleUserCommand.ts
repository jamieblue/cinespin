import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { CommandHandler } from "../../commandHandler";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import { User } from "src/shared/models/users/user";  // Use the path mapping instead
import * as dateTimeProvider from "../../../../shared/util/dateTimeProvider";

const prisma = new PrismaClient();

interface AddOrUpdateGoogleUserCommandRequest
{
    googleId: string;
    email: string;
    name: string;
}

export class AddOrUpdateGoogleUserCommandHandler
    implements CommandHandler<AddOrUpdateGoogleUserCommandRequest, { user: User }>
{
    async handle(request: AddOrUpdateGoogleUserCommandRequest): Promise<Result<{ user: User }>>
    {
        try
        {
            const user = await prisma.users.upsert({
                where: { googleId: request.googleId },
                update: {
                    email: request.email,
                    name: request.name,
                    updatedDate: dateTimeProvider.now(),
                },
                create: {
                    googleId: request.googleId,
                    email: request.email,
                    name: request.name,
                    createdDate: dateTimeProvider.now(),
                    updatedDate: dateTimeProvider.now(),
                },
            });

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