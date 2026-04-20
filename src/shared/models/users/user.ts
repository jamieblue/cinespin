import { FilmList } from "../lists/FilmList";

export type User = {
    id: number;
    googleId?: string;
    email: string;
    name: string;
    lists?: FilmList[];
};