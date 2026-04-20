export function GenerateFilmSlug(title: string): string 
{
    const slug = (title || 'film').toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug;
}