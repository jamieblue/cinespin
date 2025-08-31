import { PrismaClient } from "@prisma/client";
import { Result } from "../../result";
import { PrismaErrorHandler } from "../../../../shared/util/prismaErrorHandler";
import { User } from "src/shared/models/users/user";  // Use the path mapping instead
import * as dateTimeProvider from "../../../../shared/util/dateTimeProvider";
import { ListPrivacyType } from "../../../../shared/models/lists/ListPrivacyType";
import * as listHelper from "../../../../shared/util/listHelper";

const prisma = new PrismaClient();

interface AddOrUpdateGoogleUserCommandRequest
{
    googleId: string;
    email: string;
    name: string;
}

export class AddOrUpdateGoogleUserCommandHandler
{
    async handle(request: AddOrUpdateGoogleUserCommandRequest): Promise<Result<{ user: User }>>
    {
        try
        {
            if (request.email.trim().length === 0)
            {
                return {
                    success: false,
                    error: "Your email address must be verified.",
                };
            }

            const user = await prisma.users.upsert({
                where: { googleId: request.googleId },
                update: {
                    email: request.email,
                    name: request.name,
                    updatedDate: dateTimeProvider.now(),
                    lastLoginDate: dateTimeProvider.now(),
                },
                create: {
                    googleId: request.googleId,
                    email: request.email,
                    name: request.name,
                    createdDate: dateTimeProvider.now(),
                    updatedDate: dateTimeProvider.now(),
                    lastLoginDate: dateTimeProvider.now(),
                },
            });

            // Check if user already has a watchlist
            const existingWatchlist = await prisma.lists.findFirst({
                where: {
                    userId: user.id,
                    name: 'Watchlist'
                }
            });

            if (!existingWatchlist)
            {
                // Create watchlist only if it doesn't exist
                await prisma.lists.create({
                    data: {
                        userId: user.id,
                        name: 'Watchlist',
                        description: 'My watchlist',
                        slug: await listHelper.generateUniqueSlug(user.name, 'watchlist'),
                        privacyType: Number(ListPrivacyType.Private),
                        createdDate: dateTimeProvider.now(),
                        updatedDate: dateTimeProvider.now(),
                    }
                });
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