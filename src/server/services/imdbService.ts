import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/imdb";
import { Film } from "../../shared/models/Film";

const IMDB_API = constants.IMDB_API_BASE_URL;

type ImdbFilm =
    {
        id: string;
        primaryTitle: string;
        rating: {
            aggregateRating: number;
            voteCount: number;
        };
        metacritic: {
            score: number;
            reviewCount: number;
            url: string;
        };

    }

export type ImdbBatchFilmRequest = {
    tmdbID: number;
    imdbID: string;
}

const imdbClient = axios.create({
    baseURL: IMDB_API,
    headers: {
        Accept: "application/json",
    },
});

export async function getFilmRatingById(id: string): Promise<{
    imdbRating: number;
    imdbVoteCount: string;
    metacritic_url?: string;
    metacriticRating: number;
    metacriticVoteCount: string;
}>
{
    try
    {
        const response = await imdbClient.get(`/titles/${ id }`);
        const film: ImdbFilm = response.data;

        if (!film)
        {
            return {
                imdbRating: 0,
                imdbVoteCount: "0",
                metacriticRating: 0,
                metacriticVoteCount: "0",
            };
        }

        return {
            imdbRating: film.rating.aggregateRating,
            imdbVoteCount: numberFormatter.formatNumber(film.rating.voteCount),
            metacritic_url: film.metacritic?.url,
            metacriticRating: film.metacritic?.score || 0,
            metacriticVoteCount: numberFormatter.formatNumber(
                film.metacritic?.reviewCount || 0
            ),
        };
    } catch (error)
    {
        return {
            imdbRating: 0,
            imdbVoteCount: "0",
            metacriticRating: 0,
            metacriticVoteCount: "0",
        };
    }
}

export async function getFilmRatingsByIds(request: ImdbBatchFilmRequest[]): Promise<Partial<Film>[]>
{
    try
    {
        const response = await imdbClient.get("/titles:batchGet", {
            params: {
                titleIds: request.map((film): string => film.imdbID),
            },
            paramsSerializer: { indexes: null }
        });

        const films: ImdbFilm[] = response.data?.titles;
        if (!films || !Array.isArray(films)) return [];

        return films.map((film): Partial<Film> => ({
            id: request.find((r) => r.imdbID === film.id)?.tmdbID || 0,
            imdb_id: film.id,
            title: film.primaryTitle,
            imdb_rating: film.rating?.aggregateRating ?? 0,
            imdb_vote_count: film.rating?.voteCount != null
                ? numberFormatter.formatNumber(film.rating.voteCount)
                : "0",
            metacritic_url: film.metacritic?.url,
            metacritic_rating: film.metacritic?.score ?? 0,
            metacritic_vote_count: film.metacritic?.reviewCount != null
                ? numberFormatter.formatNumber(film.metacritic.reviewCount)
                : "0",
        }));
    } catch (error)
    {
        console.error("Failed to fetch IMDb ratings", error);
        return [];
    }
}
