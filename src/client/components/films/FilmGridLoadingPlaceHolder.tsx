/** @jsxRuntime automatic */
/** @jsxImportSource preact */

type Props = {
    title?: string;
    fontawesome?: string;
};

export function FilmGridLoadingPlaceholder({ title, fontawesome }: Props)
{
    return (
        <div className="film-list-container fade-in carousel-row">
            <div className="row-header">
                <h2>
                    {fontawesome && <i className={fontawesome}></i>}
                    {title ?
                        <span> {title}</span>
                        :
                        <div className="loading-placeholder-filler">
                        </div>
                    }
                </h2>
            </div>
            <div className="film-list">
                {Array.from({ length: 20 }).map((_, idx) => (
                    <div className="film-tile" key={idx}>
                        <div className="image-wrapper">
                            <div className="loading-placeholder-filler">
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
