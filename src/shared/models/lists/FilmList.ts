import { ListPrivacyType } from "./ListPrivacyType";
import { Film } from "../films/Film";
import { User } from "../users/user";

export type FilmList = {
    id: number;
    userId: number;
    name: string;
    description: string;
    privacyType: ListPrivacyType;
    films: Film[];
    slug: string;
    user: User;
    createdDate: Date;
    updatedDate: Date;
};