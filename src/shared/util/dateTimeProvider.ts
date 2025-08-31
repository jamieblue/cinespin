export function now(): Date
{
    const now = new Date();
    const ukDateString = now.toLocaleString('en-US', { timeZone: 'Europe/London' });
    return new Date(ukDateString);
}