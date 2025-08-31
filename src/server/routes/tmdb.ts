import express from "express";
import * as tmdbService from "../services/tmdbService";
import { serverErrorResponse } from "../../shared/util/apiErrorHandler";

const router = express.Router();

router.post("/search", async (req, res) =>
{
    try
    {
        const result = await tmdbService.search(req.body);
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
        const result = await tmdbService.getRandomFilm(5, 500, true);

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

router.get("/random-good-film", async (req, res) =>
{
    try
    {
        const result = await tmdbService.getRandomFilm(7.5, 500, true);

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

router.get("/random-bad-film", async (req, res) =>
{
    try
    {
        const result = await tmdbService.getRandomFilm(5, 500, false);

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

export default router;
