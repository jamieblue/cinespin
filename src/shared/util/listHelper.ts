import { PrismaClient } from "@prisma/client";
import { ListPrivacyType } from "../../shared/models/lists/ListPrivacyType";
import { listService } from "../services/listService"

const prisma = new PrismaClient();

export async function generateUniqueSlug(userName: string, listName: string): Promise<string>
{
    const baseSlug = createSlug(userName, listName);

    const existingListResult = await listService.doesSlugExist(baseSlug);

    if (existingListResult.success)
    {
        if (!existingListResult.data)
        {
            return baseSlug;
        }
    }

    let counter = 1;
    let uniqueSlug = `${ baseSlug }-${ counter }`;

    while (await slugExists(uniqueSlug))
    {
        counter++;
        uniqueSlug = `${ baseSlug }-${ counter }`;
    }

    return uniqueSlug;
}

function createSlug(userName: string, listName: string): string
{
    const cleanUserName = userName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    const cleanListName = listName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    return `${ cleanUserName }/${ cleanListName }`;
}

async function slugExists(slug: string): Promise<boolean>
{
    const existingListResult = await listService.doesSlugExist(slug);

    if (existingListResult.success)
    {
        return existingListResult.data;
    }

    return false;
}

export function getPrivacyInfo(privacy: ListPrivacyType)
{
    switch (privacy)
    {
        case ListPrivacyType.Public:
            return {
                label: "Public",
                icon: "fa-solid fa-globe"
            };
        case ListPrivacyType.Private:
            return {
                label: "Private",
                icon: "fa-solid fa-lock"
            };
        case ListPrivacyType.Unlisted:
            return {
                label: "Unlisted",
                icon: "fa-solid fa-eye-slash"
            };
        default:
            return {
                label: "Private",
                icon: "fa-solid fa-lock"
            };
    }
}