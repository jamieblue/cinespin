import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/imdb";
import { Film } from "../../shared/models/Film";
import { Genre } from "../../shared/models/Genre";
import Bottleneck from "bottleneck";

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

const imdbLimiter = new Bottleneck({
    minTime: 200, // 1 request every 200ms (~5/sec)
});

const limitedImdbGet = imdbLimiter.wrap(
    imdbClient.get.bind(imdbClient)
) as typeof imdbClient.get;

export async function search(query: string): Promise<Film[]>
{
    const response = await limitedImdbGet("/search/titles", {
        params: {
            query,
            limit: 14,
            types: "movie",
        },
    });

    console.log("IMDB Search Response:", response.data.titles);

    return response.data.titles.map((film: ImdbFilm): Film => ({
        imdb_id: film.id,
        title: film.primaryTitle,
        overview: film.plot,
        poster_path: film.primaryImage.url || "",
        release_date: film.startYear,
        vote_count: numberFormatter.formatNumber(film.rating.voteCount),
        vote_average: film.rating.aggregateRating,
        imdb_rating: film.rating.aggregateRating,
        imdb_vote_count: numberFormatter.formatNumber(film.rating.voteCount),
        metacritic_url: film.metacritic?.url,
        metacritic_rating: film.metacritic?.score || 0,
        metacritic_vote_count: numberFormatter.formatNumber(film.metacritic?.reviewCount || 0),
        genres: film.genres.map((genre) => ({ name: genre } as Genre)),
    }));
}

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
        const response = await limitedImdbGet(`/titles/${ id }`);
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
        const response = await limitedImdbGet("/titles:batchGet", {
            params: {
                titleIds: request.map((film): string => film.imdbID),
            },
            paramsSerializer: { indexes: null }
        });

        const films: ImdbFilm[] = response.data?.titles;
        if (!films || !Array.isArray(films)) return [];

        return films.map((film): Partial<Film> => ({
            tmdb_id: request.find((r) => r.imdbID === film.id)?.tmdbID || 0,
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
