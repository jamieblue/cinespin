import express from "express";
import * as tmdbService from "../services/tmdbService";
import { serverErrorResponse } from "../../shared/util/apiErrorHandler";

const router = express.Router();

router.post("/search", async (req, res) =>
{
    try
    {
        const result = await tmdbService.search(req.body);
        console.log(result);
        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.get("/random-film", async (req, res) =>
{
    try
    {
        const rating = parseFloat(req.query.rating as string);
        const count = parseInt(req.query.count as string);
        const randomFilmRatingThreshold = parseInt(req.query.randomFilmRatingThreshold as string);
        const hydration = req.query.hydration === 'true';
        const getYoutubeKey = req.query.getYoutubeKey === 'true';
        const result = await tmdbService.getRandomFilm(rating, count, randomFilmRatingThreshold, hydration, getYoutubeKey);

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch film"));
    }
});

router.post("/film", async (req, res) =>
{
    try
    {
        const film = req.body;
        const result = await tmdbService.getFilmDetails(film);

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch film"));
    }
});

router.get("/popular", async (req, res) =>
{
    try
    {
        const result = await tmdbService.getPopularFilms();

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);;
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.get("/upcoming", async (req, res) =>
{
    try
    {
        const result = await tmdbService.getUpcomingFilms();

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.get("/:id/recommendations", async (req, res) =>
{
    try
    {
        const filmId = parseInt(req.params.id);
        const result = await tmdbService.getRecommendations(filmId);

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.post("/films-by-director", async (req, res) =>
{
    try
    {
        const directorIds: number[] = Array.isArray(req.body?.directorIds) ? req.body.directorIds : [];
        const result = await tmdbService.getFilmsByDirector(directorIds);

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.post("/best-films", async (req, res) =>
{
    try
    {
        const result = await tmdbService.getBestFilms();

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to fetch films"));
    }
});

router.post("/ratings/batch", async (req, res) =>
{
    try
    {
        const tmdbIds: number[] = Array.isArray(req.body?.tmdbIds) ? req.body.tmdbIds : [];
        if (!tmdbIds.length) return res.status(400).json({ success: false, error: "tmdbIds required" });

        // Optionally enforce max 5 here if your imdbService requires it
        // const chunks = []; // split into 5s and run sequentially if desired

        const ratings = await tmdbService.getImdbRatingsBatchedByTmdbIds(tmdbIds);
        res.json({ success: true, data: { ratings } });
    }
    catch (err)
    {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to load IMDb ratings" });
    }
});

export default router;
