import express from "express";
import * as tmdbService from "../services/tmdbService";

const router = express.Router();

router.get("/random-film", async (req, res) => {
	try {
		const movie = await tmdbService.getRandomFilm(5, 500, true);
		res.json(movie);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch movie" });
	}
});

router.get("/random-good-film", async (req, res) => {
	try {
		const movie = await tmdbService.getRandomFilm(7.5, 500, true);
		res.json(movie);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch movie" });
	}
});

router.get("/random-bad-film", async (req, res) => {
	try {
		const movie = await tmdbService.getRandomFilm(4.5, 500, false);
		res.json(movie);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch movie" });
	}
});

export default router;
