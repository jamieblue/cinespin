import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import * as numberFormatter from "../../shared/util/numberFormatter";

const IMDB_API = process.env.IMDB_URL;

const tmdbClient = axios.create({
	baseURL: IMDB_API,
	headers: {
		Accept: "application/json",
	},
});

export async function getFilmRatingById(
	id: string
): Promise<{ rating: number; voteCount: string }> {
	try {
		const response = await tmdbClient.get(`/titles/${id}`);
		const film = response.data;

		if (!film) {
			return { rating: 0, voteCount: "0" };
		}

		return {
			rating: film.rating.aggregateRating,
			voteCount: numberFormatter.formatNumber(film.rating.voteCount),
		};
	} catch (error) {
		return { rating: 0, voteCount: "0" };
	}
}
