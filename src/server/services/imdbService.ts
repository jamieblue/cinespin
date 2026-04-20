import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/imdb";
import { Film } from "../../shared/models/films/Film";
import Bottleneck from "bottleneck";
import { TmdbFilm, getImdbID } from "./tmdbService";
import { chunk } from "lodash";

const IMDB_API = constants.IMDB_API_BASE_URL;

type ImdbFilm =
    {
        id: string;
        primaryTitle: string;
        primaryImage: {
            url: string;
        };
        startYear: number;
        plot: string;
        genres: string[]
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

const imdbNormalLimiter = new Bottleneck({
    minTime: 250, // 1 request every 250ms (~4/sec)
});

const imdbBatchLimiter = new Bottleneck({
    minTime: 4000, // 1 request every 4000ms (~0.25/sec)
});

const limitedImdbGet = imdbNormalLimiter.wrap(
    imdbClient.get.bind(imdbClient)
) as typeof imdbClient.get;

const limitedImdbBatchGet = imdbBatchLimiter.wrap(
    imdbClient.get.bind(imdbClient)
) as typeof imdbClient.get;

export async function getFilmRatingById(id: string): Promise<{
    imdbID: string;
    imdbRating: number;
    imdbVoteCount: string;
    metacritic_url?: string;
    metacriticRating: number;
    metacriticVoteCount: string;
}>
{
    try
    {
        const response = await limitedImdbGet(`/titles/${ id }`);
        const film: ImdbFilm = response.data;

        if (!film)
        {
            return {
                imdbID: "",
                imdbRating: 0,
                imdbVoteCount: "0",
                metacriticRating: 0,
                metacriticVoteCount: "0",
            };
        }

        return {
            imdbID: id,
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
            imdbID: "",
            imdbRating: 0,
            imdbVoteCount: "0",
            metacriticRating: 0,
            metacriticVoteCount: "0",
        };
    }
}

export async function getFilmRatingsByIds(films: TmdbFilm[]): Promise<Partial<Film>[]>
{
    try
    {
        // Map to IMDb batch request format
        const imdbRequests: ImdbBatchFilmRequest[] = await Promise.all(
            films.map(async (film: TmdbFilm): Promise<ImdbBatchFilmRequest> => ({
                tmdbID: film.id,
                imdbID: await getImdbID(film.id),
            }))
        );

        // Chunk IMDb requests into batches of 5
        const imdbChunks = chunk(imdbRequests.filter((film) => !!film.imdbID), 5);

        const allRatingsChunked = await Promise.all(
            imdbChunks.map(async (chunk) =>
            {
                const response = await limitedImdbBatchGet("/titles:batchGet", {
                    params: {
                        titleIds: chunk.map((c) => c.imdbID),
                    },
                    paramsSerializer: { indexes: null }
                });

                const imdbFilms: ImdbFilm[] = response.data?.titles;
                if (!films || !Array.isArray(films)) return [];

                return imdbFilms.map((film): Partial<Film> => ({
                    tmdb_id: chunk.find((r) => r.imdbID === film.id)?.tmdbID || 0,
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
            }))

        return allRatingsChunked.flat();
    } catch (error)
    {
        console.error("Failed to fetch IMDb ratings", error);
        return [];
    }
}
