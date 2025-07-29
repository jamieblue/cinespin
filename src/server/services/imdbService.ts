import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import * as numberFormatter from "../../shared/util/numberFormatter";
import * as constants from "../../shared/constants/imdb";

const IMDB_API = constants.IMDB_URL;

const imdbClient = axios.create({
	baseURL: IMDB_API,
	headers: {
		Accept: "application/json",
	},
});

export async function getFilmRatingById(id: string): Promise<{
	imdbRating: number;
	imdbVoteCount: string;
	metacriticRating: number;
	metacriticVoteCount: string;
}> {
	try {
		const response = await imdbClient.get(`/titles/${id}`);
		const film = response.data;

		if (!film) {
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
			metacriticRating: film.metacritic?.score || 0,
			metacriticVoteCount: numberFormatter.formatNumber(
				film.metacritic?.reviewCount || 0
			),
		};
	} catch (error) {
		return {
			imdbRating: 0,
			imdbVoteCount: "0",
			metacriticRating: 0,
			metacriticVoteCount: "0",
		};
	}
}
