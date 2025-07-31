export function getRatingColor(rating: number): string
{
    if (rating >= 61) return "green";
    if (rating >= 40) return "yellow";
    return "red";
}