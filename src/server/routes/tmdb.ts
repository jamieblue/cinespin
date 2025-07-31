import express from "express";
import * as tmdbService from "../services/tmdbService";

const router = express.Router();

router.get("/random-film", async (req, res) =>
{
    try
    {
        const film = await tmdbService.getRandomFilm(5, 500, true);
        res.json(film);
    } catch (err)
    {
        res.status(500).json({ error: "Failed to fetch film" });
    }
});

router.get("/random-good-film", async (req, res) =>
{
    try
    {
        const film = await tmdbService.getRandomFilm(7.5, 500, true);
        res.json(film);
    } catch (err)
    {
        res.status(500).json({ error: "Failed to fetch film" });
    }
});

router.get("/random-bad-film", async (req, res) =>
{
    try
    {
        const film = await tmdbService.getRandomFilm(4.5, 500, false);
        res.json(film);
    } catch (err)
    {
        res.status(500).json({ error: "Failed to fetch film" });
    }
});

router.get("/popular", async (req, res) =>
{
    try
    {
        const films = await tmdbService.getPopularFilms();
        res.json(films);
    } catch (err)
    {
        res.status(500).json({ error: "Failed to fetch films" });
    }
});

router.get("/upcoming", async (req, res) =>
{
    try
    {
        const films = await tmdbService.getUpcomingFilms();
        res.json(films);
    } catch (err)
    {
        res.status(500).json({ error: "Failed to fetch films" });
    }
});

export default router;
