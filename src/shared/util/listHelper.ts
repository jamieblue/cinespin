import { PrismaClient } from "@prisma/client";
import { ListPrivacyType } from "../../shared/models/lists/ListPrivacyType";
import { listService } from "../services/listService"

const prisma = new PrismaClient();

export async function generateUniqueSlug(userName: string, userId: number, listName: string): Promise<string>
{
    const cleanUserName = userName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    const cleanListName = listName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    return `${ cleanUserName }/${ userId }/${ cleanListName }`;
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