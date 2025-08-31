import { ListPrivacyType } from "./ListPrivacyType";
import { Film } from "../films/Film";

export type FilmList = {
    id: number;
    userId: number;
    name: string;
    description: string;
    privacyType: ListPrivacyType;
    films: Film[];
    slug: string;
    createdDate: Date;
    updatedDate: Date;
};