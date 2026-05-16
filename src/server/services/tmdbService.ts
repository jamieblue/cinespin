import * as dotenv from "dotenv";
import axios from "axios";
import { Film } from "../../shared/models/films/Film";
import * as imdbService from "./imdbService";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/tmdb";
import { GetGenresByIDsQueryHandler } from "../cqrs/genres/queries/getGenresByIDsQuery";
import { take, orderBy, chunk, find, first } from "lodash";
import Bottleneck from "bottleneck";
import { Result } from "../../shared/models/api/Result";
import { GetFilmResponse, GetFilmsRequest, GetFilmsResponse } from "../../shared/models/films/TmdbApiRequests";
import { getRequestCountry } from "../../shared/util/requestContext";
import { RandomFilmRatingThreshold } from "../../shared/models/films/RandomFilmRatingThreshold";
import { Credit } from "src/shared/models/films/Credit";

dotenv.config();
const TMDB_API = constants.TMDB_API_BASE_URL;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

export type TmdbFilm =
    {
        id: number;
        title: string;
        overview: string;
        poster_path: string;
        release_date: string;
        popularity: number;
        vote_count: number;
        vote_average: number;
        genre_ids: number[];
        imdb_id?: string;
        backdrop_path?: string;
        runtime?: number;
        job?: string;
    }

type TmdbCredits = {
    id: number;
    cast: {
        id: number;
        name: string;
        character: string;
        popularity: number;
    }[];
    crew: {
        id: number;
        name: string;
        job: string;
    }[];
};

const tmdbClient = axios.create({
    baseURL: TMDB_API,
    headers: {
        Authorization: `Bearer ${ TMDB_TOKEN }`,
        Accept: "application/json",
    },
});

const tmdbLimiter = new Bottleneck({
    minTime: 20,       // 1 request every 20ms (~50/sec)
    maxConcurrent: 20, // max 20 simultaneous connections
});

const get = tmdbLimiter.wrap(
    tmdbClient.get.bind(tmdbClient)
) as typeof tmdbClient.get;

export async function getRandomFilm(
    rating: number | null,
    voteCount: number | null,
    randomFilmRatingThreshold: number | null,
    hydration: boolean | null,
    getYoutubeKey: boolean | null
): Promise<Result<GetFilmResponse>>
{
    let voteAverageKey = "vote_average.gte";
    if (randomFilmRatingThreshold != null && randomFilmRatingThreshold === RandomFilmRatingThreshold.Lower)
    {
        voteAverageKey = "vote_average.lte";
    }

    const baseParams = {
        [voteAverageKey]: rating ?? 5,
        "vote_count.gte": voteCount ?? 500,
        sort_by: "vote_average.desc",
        include_adult: false,
        include_video: false,
        page: 1,
    };

    const firstPage = await get("/discover/movie", { params: baseParams });

    const totalPages = Math.min(firstPage.data.total_pages, 500); // API caps at 500
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const randomPageResult = await get("/discover/movie", {
        params: { ...baseParams, page: randomPage },
    });

    const films: TmdbFilm[] = randomPageResult.data.results;
    const randomFilm: TmdbFilm = films[Math.floor(Math.random() * films.length)];

    if (!randomFilm)
    {
        return {
            success: false,
            error: "Failed to find a random film"
        };
    }

    let film: Film = {
        tmdb_id: randomFilm.id,
        title: randomFilm.title,
        overview: randomFilm.overview,
        poster_path: randomFilm.poster_path,
        backdrop_path: randomFilm.backdrop_path,
        release_year: new Date(randomFilm.release_date).getFullYear(),
        tmdb_vote_count: numberFormatter.formatNumber(randomFilm.vote_count),
        tmdb_rating: randomFilm.vote_average,
        genres: [],
    }

    if (getYoutubeKey && !hydration)
    {
        const videosResult = await get(`/movie/${ film.tmdb_id }/videos`);
        film.youtube_key = find(videosResult.data.results, { site: "YouTube", type: "Trailer" })?.key;
    }

    if (hydration)
    {
        film = await hydrateFilmData(film);
    }

    return {
        success: true,
        data: {
            film
        }
    };
}


export async function getPopularFilms(): Promise<Result<GetFilmsResponse>>
{
    const baseParams = {
        sort_by: "tmdb_rating.desc",
        include_adult: false,
        include_video: false,
        page: 1,
    };

    const firstPage = await get("/movie/popular", { params: baseParams });
    const allFilms: TmdbFilm[] = take(orderBy(firstPage.data.results, ["popularity"], ["desc"]), 20);

    const films = await Promise.all(allFilms.map(async (film: TmdbFilm): Promise<Film> =>
    {
        return {
            tmdb_id: film.id,
            title: film.title,
            overview: film.overview,
            poster_path: film.poster_path,
            release_year: new Date(film.release_date).getFullYear(),
            tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
            tmdb_rating: film.vote_average,
            imdb_id: await getImdbID(film.id as number),
            imdb_rating: 0,
            imdb_vote_count: "0",
            metacritic_rating: 0,
            metacritic_vote_count: "0",
            backdrop_path: film.backdrop_path,
            genres: [],
        };
    }));

    return { success: true, data: { films } };
}

export async function getUpcomingFilms(): Promise<Result<GetFilmsResponse>>
{
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const baseParams = {
        sort_by: "popularity.desc",
        include_adult: false,
        include_video: false,
        "primary_release_date.gte": today,
        page: 1,
    };

    const firstPage = await get("/discover/movie", {
        params: baseParams,
    });

    const allFilms: TmdbFilm[] = take(firstPage.data.results, 20);

    const films = await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<Film> =>
        {
            return {
                tmdb_id: film.id,
                title: film.title,
                overview: film.overview,
                poster_path: film.poster_path,
                release_year: new Date(film.release_date).getFullYear(),
                tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
                tmdb_rating: film.vote_average,
                imdb_id: await getImdbID(film.id as number),
                imdb_rating: 0,
                imdb_vote_count: "0",
                metacritic_rating: 0,
                metacritic_vote_count: "0",
                backdrop_path: film.backdrop_path,
                genres: [],
            };
        })
    );

    // Build final Film array
    return {
        success: true,
        data: { films }
    };
}

export async function getRecommendations(filmId: number): Promise<Result<GetFilmsResponse>>
{
    const firstPage = await get(`/movie/${ filmId }/recommendations`);
    const allFilms = take(orderBy(firstPage.data.results, ["vote_average"], ["desc"]), 20);

    const films = await Promise.all(allFilms.map(async (film: TmdbFilm): Promise<Film> =>
    {
        return {
            tmdb_id: film.id,
            title: film.title,
            overview: film.overview,
            poster_path: film.poster_path,
            release_year: new Date(film.release_date).getFullYear(),
            tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
            tmdb_rating: film.vote_average,
            imdb_id: await getImdbID(film.id as number),
            imdb_rating: 0,
            imdb_vote_count: "0",
            metacritic_rating: 0,
            metacritic_vote_count: "0",
            backdrop_path: film.backdrop_path,
            genres: [],
        };
    }));

    // Build final Film array
    return {
        success: true,
        data: { films }
    };
}

export async function getFilmsByDirector(directorIds: number[]): Promise<Result<GetFilmsResponse>>
{
    let allFilms: TmdbFilm[] = [];
    for (const directorId of directorIds)
    {
        const firstPage = await get(`/person/${ directorId }/movie_credits`);
        const directorFilms = firstPage.data.crew.filter((film: any) => film.job === "Director");

        const films = take(orderBy(directorFilms, ["vote_average", "vote_count", "release_date"], ["desc", "desc", "desc"]), directorIds.length === 1 ? 20 : 10);
        allFilms = allFilms.concat(films);
    }

    const films = await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<Film | null> =>
        {
            try
            {
                return {
                    tmdb_id: film.id,
                    title: film.title,
                    overview: film.overview,
                    poster_path: film.poster_path,
                    release_year: new Date(film.release_date).getFullYear(),
                    tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
                    tmdb_rating: film.vote_average,
                    imdb_id: await getImdbID(film.id as number), // This may 404
                    imdb_rating: 0,
                    imdb_vote_count: "0",
                    metacritic_rating: 0,
                    metacritic_vote_count: "0",
                    backdrop_path: film.backdrop_path,
                    genres: [],
                };
            } catch (err)
            {
                return null;
            }
        })
    );

    const filteredFilms = films.filter(Boolean) as Film[];

    return {
        success: true,
        data: { films: filteredFilms || [] }
    };
}

export async function getBestFilms(): Promise<Result<GetFilmsResponse>>
{
    let allFilms: TmdbFilm[] = [];

    const baseParams = {
        "vote_average.gte": 7.7,
        "vote_count.gte": 5000,
        sort_by: "vote_average.desc",
        include_adult: false,
        include_video: false,
        page: 1,
    };

    const firstPage = await get("/discover/movie", { params: baseParams });

    allFilms = take(orderBy(firstPage.data.results, ["vote_average", "vote_count"], ["desc", "desc"]), 100);

    const films = await Promise.all(
        allFilms.map(async (film: TmdbFilm): Promise<Film | null> =>
        {
            try
            {
                const videosResult = await get(`/movie/${ film.id }/videos`);
                const youtubeKey = find(videosResult.data.results, { site: "YouTube", type: "Trailer" })?.key;

                return {
                    tmdb_id: film.id,
                    title: film.title,
                    overview: film.overview,
                    poster_path: film.poster_path,
                    release_year: new Date(film.release_date).getFullYear(),
                    tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
                    tmdb_rating: film.vote_average,
                    imdb_id: await getImdbID(film.id as number), // This may 404
                    imdb_rating: 0,
                    imdb_vote_count: "0",
                    metacritic_rating: 0,
                    metacritic_vote_count: "0",
                    backdrop_path: film.backdrop_path,
                    youtube_key: youtubeKey,
                    genres: [],
                };
            } catch (err)
            {
                return null;
            }
        })
    );

    const filteredFilms = films.filter(Boolean) as Film[];

    return {
        success: true,
        data: { films: filteredFilms || [] }
    };
}

export async function search(request: GetFilmsRequest): Promise<Result<GetFilmsResponse>>
{
    const baseParams = { include_adult: false, page: 1, query: request.query };
    const firstPage = await get("/search/movie", { params: baseParams });

    const allFilms = take(firstPage.data.results, 20) as TmdbFilm[];

    const films = await Promise.all(
        allFilms
            .filter((film: TmdbFilm) => !!film.poster_path)
            .map(async (film: TmdbFilm): Promise<Film> =>
            {
                return {
                    tmdb_id: film.id,
                    title: film.title,
                    overview: film.overview,
                    poster_path: film.poster_path,
                    release_year: new Date(film.release_date).getFullYear(),
                    tmdb_vote_count: numberFormatter.formatNumber(film.vote_count),
                    tmdb_rating: film.vote_average,
                    popularity: film.popularity,
                    imdb_id: await getImdbID(film.id as number),
                    imdb_rating: 0,
                    imdb_vote_count: "0",
                    metacritic_rating: 0,
                    metacritic_vote_count: "0",
                    backdrop_path: film.backdrop_path,
                    genres: [],
                };
            })
    );

    const sorted = orderBy(films, ['popularity', 'tmdb_rating'], ['desc', 'desc']);

    if (sorted.length > 0)
    {
        const first = sorted[0];
        const genreIds = find(allFilms, f => f.id === first?.tmdb_id)?.genre_ids || [];

        const [hydrated, genresResult] = await Promise.all([
            hydrateFilmData(first),
            new GetGenresByIDsQueryHandler().handle({ genreIds })
        ]);

        if (genresResult.success)
        {
            hydrated.genres = genresResult.data.genres;
        }

        // Replace or mutate
        sorted[0] = hydrated;
    }

    return { success: true, data: { films: sorted } };
}

export async function getImdbRatingsBatchedByTmdbIds(tmdbIds: number[]): Promise<Partial<Film>[]>
{
    const stubs: TmdbFilm[] = tmdbIds.map(id => ({ id } as TmdbFilm));
    const ratings = await imdbService.getFilmRatingsByIds(stubs);

    return Promise.all(
        ratings.map(async r =>
        {
            const videosResult = await get(`/movie/${ r.tmdb_id }/videos`);
            const youtubeKey = find(videosResult.data.results, { site: "YouTube", type: "Trailer" })?.key;

            return {
                tmdb_id: r.tmdb_id,
                imdb_id: r.imdb_id,
                imdb_rating: r.imdb_rating,
                imdb_vote_count: r.imdb_vote_count,
                metacritic_url: r.metacritic_url,
                metacritic_rating: r.metacritic_rating,
                metacritic_vote_count: r.metacritic_vote_count,
                youtube_key: youtubeKey
            } as Partial<Film>;
        })
    );
}

export async function getImdbID(id: number): Promise<string>
{
    const response = await get(`/movie/${ id }`);

    return response.data.imdb_id;
}

export async function getFilmDetails(film: Film): Promise<Result<GetFilmResponse>>
{
    const hydrated = await hydrateFilmData({ ...film });
    return { success: true, data: { film: hydrated } };
}

async function hydrateFilmData(film: Film): Promise<Film>
{
    const extraFilmDetails = await get(`/movie/${ film.tmdb_id }`);
    const filmCreditsResult = await get(`/movie/${ film.tmdb_id }/credits`);
    const filmCredits: TmdbCredits = filmCreditsResult.data;
    const watchProvidersResult = await get(`/movie/${ film.tmdb_id }/watch/providers`);
    const videosResult = await get(`/movie/${ film.tmdb_id }/videos`);

    const youtubeKey = find(videosResult.data.results, { site: "YouTube", type: "Trailer" })?.key;

    const directors: Credit[] = filmCredits.crew
        .filter((member: any) => member.job === "Director")
        .map((director: any) => ({
            id: director.id,
            name: director.name,
            job: director.job,
            credit_id: director.credit_id
        }));

    const topCast: Credit[] = filmCredits.cast.slice(0, 5).map((member: any) => ({
        id: member.id,
        name: member.name,
        job: member.job,
        credit_id: member.credit_id
    }));

    const resultsByCountry = watchProvidersResult.data?.results || {};
    const requestCountry = getRequestCountry()?.toUpperCase();
    let countryEntry;
    if (requestCountry && Object.prototype.hasOwnProperty.call(resultsByCountry, requestCountry))
    {
        countryEntry = resultsByCountry[requestCountry];
    } else
    {
        countryEntry = undefined;
    }

    const flatrate = countryEntry?.flatrate ?? [];
    const filteredFlatrate = flatrate.filter((p: any) =>
    {
        const name = (p?.provider_name || "").toString().toLowerCase();
        return !name.includes("with ads");
    });

    const categories = [
        { id: "netflix", match: (name: string) => name.includes("netflix") },
        { id: "amazon", match: (name: string) => name.includes("amazon") },
        { id: "disney", match: (name: string) => name.includes("disney") || name.includes("disney+") || name.includes("disney plus") },
        { id: "apple", match: (name: string) => name.includes("apple") || name.includes("apple tv") || name.includes("apple tv+") },
    ];

    const selectedProviders: any[] = [];
    const usedProviderIds = new Set<number>();
    const matchedCategories = new Set<string>();

    for (const cat of categories)
    {
        const candidates = filteredFlatrate
            .filter((p: any) =>
            {
                const name = (p?.provider_name || "").toString().toLowerCase();
                return cat.match(name);
            })
            .sort((a: any, b: any) => (a.display_priority ?? 999) - (b.display_priority ?? 999));

        const found = candidates[0];
        if (found)
        {
            matchedCategories.add(cat.id);
            usedProviderIds.add(found.provider_id);
            selectedProviders.push({
                provider_id: found.provider_id,
                provider_name: found.provider_name,
                display_priority: found.display_priority,
                logo_path: found.logo_path,
            });
        }
    }

    const otherProviders = filteredFlatrate
        .filter((p: any) =>
        {
            if (usedProviderIds.has(p.provider_id)) return false;

            const name = (p?.provider_name || "").toString().toLowerCase();
            for (const cat of categories)
            {
                if (matchedCategories.has(cat.id) && cat.match(name))
                {
                    return false;
                }
            }

            return true;
        })
        .sort((a: any, b: any) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
        .map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            display_priority: p.display_priority,
            logo_path: p.logo_path,
        }));

    const normalizedProviders = [...selectedProviders, ...otherProviders];
    const watchProviders = normalizedProviders.length ? normalizedProviders : [];

    const imdbInfo = await imdbService.getFilmRatingById(film.imdb_id ?? await getImdbID(film.tmdb_id as number));

    return {
        ...extraFilmDetails.data,
        ...film,
        runtime: extraFilmDetails.data.runtime,
        tagline: extraFilmDetails.data.tagline,
        cast: topCast,
        directors: directors,
        watch_providers: watchProviders,
        imdb_id: imdbInfo.imdbID,
        tmdb_id: film.tmdb_id,
        tmdb_vote_count: numberFormatter.formatNumber(extraFilmDetails.data.vote_count),
        tmdb_rating: extraFilmDetails.data.vote_average,
        release_year: new Date(extraFilmDetails.data.release_date).getFullYear(),
        imdb_rating: imdbInfo.imdbRating,
        imdb_vote_count: imdbInfo.imdbVoteCount,
        metacritic_url: imdbInfo.metacritic_url,
        metacritic_rating: imdbInfo.metacriticRating,
        metacritic_vote_count: imdbInfo.metacriticVoteCount,
        youtube_key: youtubeKey,
    };
}