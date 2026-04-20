export function capitalizeWords(str: string): string
{
    return str.replace(/\b\w/g, char => char.toUpperCase());
}