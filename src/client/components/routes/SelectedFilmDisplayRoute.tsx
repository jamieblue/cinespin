/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks';
import { SelectedFilmDisplay } from '../films/SelectedFilmDisplay';
import { useSelectedFilm } from '../../contexts/SelectedFilmContext';
import { filmService } from '../../../shared/services/filmService';
import { Film } from '../../../shared/models/films/Film';

export function SelectedFilmDisplayRoute(props: { slug?: string; filmId?: string; })
{
    const [selectedFilm, setSelectedFilm] = useSelectedFilm();

    useEffect(() =>
    {
        const loadFromUrl = async () =>
        {
            const filmId = props.filmId;
            if (!filmId) return;

            if (selectedFilm && String(selectedFilm.tmdb_id ?? selectedFilm.id) === String(filmId)) return;

            try
            {
                const requestFilm = { tmdb_id: Number(filmId) } as Film;
                const result = await filmService.getFilmDetails(requestFilm);

                if (result.success && result.data?.film)
                {
                    setSelectedFilm(result.data.film);
                }
                else if (result.success === false)
                {
                    console.error('Failed to load film for route:', result.error);
                }
            }
            catch (err)
            {
                console.error('Failed to load film for route', err);
            }
        };

        loadFromUrl();
    }, [props.filmId]);

    return (
        <SelectedFilmDisplay showRecommendationsProp={true} />
    );
}