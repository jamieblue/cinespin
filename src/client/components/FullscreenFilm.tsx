/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useState } from "preact/hooks";
import { Film } from "../../shared/models/Film";
import { RandomFilmType } from "../../shared/models/RandomFilmType";
import axios from "axios";
import * as constants from "../../shared/constants/tmdb";

const TMDB_IMAGE_BASE_URL = constants.TMDB_IMAGE_BASE_URL;
const TMDB_IMAGE_SIZES = constants.TMDB_IMAGE_SIZES;

type Props = {
	film: Film;
	onClose: () => void;
};

async function getRandomGoodFilm(): Promise<Film> {
	const response = await axios.get(
		"http://localhost:3001/api/tmdb/random-good-film"
	);
	return response.data as Film;
}

async function getRandomBadFilm(): Promise<Film> {
	const response = await axios.get(
		"http://localhost:3001/api/tmdb/random-bad-film"
	);
	return response.data as Film;
}

export function FullscreenFilm({ film, onClose }: Props) {
	const [isClosing, setIsClosing] = useState(false);
	const [currentFilm, setCurrentFilm] = useState(film);
	const [queuedFilm, setQueuedFilm] = useState<Film | null>(null);

	// Preload the image to avoid flickering
	const preloadImage = (src: string): Promise<void> =>
		new Promise((resolve) => {
			const img = new Image();
			img.src = src;
			img.onload = () => resolve();
		});

	const handleRandomFilm = async (filmType: RandomFilmType) => {
		let next: Film;
		switch (filmType) {
			case RandomFilmType.Good:
				next = await getRandomGoodFilm();
				break;
			case RandomFilmType.Bad:
				next = await getRandomBadFilm();
				break;
			case RandomFilmType.Neutral:
			default:
				next = await getRandomGoodFilm(); // Default to good film
				break;
		}

		await preloadImage(
			`${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES["500"]}${next.poster_path}`
		);
		setQueuedFilm(next);
		setIsClosing(true); // trigger fade-out of current
	};

	const handleClose = () => {
		setIsClosing(true);
	};

	const onAnimationEnd = () => {
		if (isClosing) {
			if (queuedFilm) {
				setCurrentFilm(queuedFilm);
				setQueuedFilm(null);
				setIsClosing(false); // trigger fade-in
			} else {
				onClose();
			}
		}
	};

	return (
		<div
			class={`fullscreen-film ${isClosing ? "slide-out" : "slide-in"}`}
			onAnimationEnd={onAnimationEnd}
		>
			<div class="close-button" onClick={handleClose}>
				<i class="fa-solid fa-xmark"></i>
			</div>

			<img
				src={`${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES["500"]}${currentFilm.poster_path}`}
				alt={currentFilm.title}
			/>

			<div class="details">
				<h2 class="title">{currentFilm.title}</h2>
				<div class="release-year">
					{currentFilm.release_date.toString().substring(0, 4)}
				</div>
				<div class="overview">{currentFilm.overview}</div>

				<div id="ratings">
					<div id="imdb-rating">
						<div class="rating-row">
							<img
								src="/content/images/svg/imdb_logo.svg"
								alt="IMDb:"
							/>
							{currentFilm.imdb_rating !== 0
								? currentFilm.imdb_rating
								: "N/A"}
						</div>
						<div class="vote-count">
							({currentFilm.imdb_vote_count} votes)
						</div>
					</div>

					<div id="tmdb-rating">
						<div class="rating-row">
							<img
								src="/content/images/svg/tmdb_logo.svg"
								alt="TMDB:"
							/>
							{currentFilm.vote_average.toFixed(1)}
						</div>
						<div class="vote-count">
							({currentFilm.vote_count} votes)
						</div>
					</div>
				</div>

				<div class="buttons">
					<button
						onClick={() => handleRandomFilm(RandomFilmType.Good)}
					>
						<i class="fa-solid fa-thumbs-up"></i> Random Good Film
					</button>
					<button>
						<i class="fa-solid fa-rotate"></i> Random Film
					</button>
					<button
						onClick={() => handleRandomFilm(RandomFilmType.Bad)}
					>
						<i class="fa-solid fa-thumbs-down"></i> Random Bad Film
					</button>
				</div>
			</div>
		</div>
	);
}
