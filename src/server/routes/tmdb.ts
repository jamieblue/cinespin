import express from "express";
import * as tmdbService from "../services/tmdbService";

const router = express.Router();

router.get("/random-good-film", async (req, res) => {
	try {
		const movie = await tmdbService.getRandomGoodFilm();
		res.json(movie);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch movie" });
	}
});

router.get("/random-bad-film", async (req, res) => {
	try {
		const movie = await tmdbService.getRandomBadFilm();
		res.json(movie);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch movie" });
	}
});

export default router;
