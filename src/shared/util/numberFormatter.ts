export function formatNumber(value: number): string
{
    if (value >= 1_000_000)
    {
        return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (value >= 10_000)
    {
        return Math.floor(value / 1_000) + "K";
    } else if (value >= 1_000)
    {
        return value.toLocaleString();
    }

    return value.toString();
}

export function parseFormattedNumber(value?: string): number
{
    if (!value) return 0;
    const normalized = value.replace(/,/g, "").trim().toUpperCase();
    if (normalized.endsWith("M"))
    {
        return parseFloat(normalized) * 1_000_000;
    }
    if (normalized.endsWith("K"))
    {
        return parseFloat(normalized) * 1_000;
    }
    return parseFloat(normalized) || 0;
}
