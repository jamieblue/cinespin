export function now(): Date
{
    // Create a Date object for now
    const now = new Date();

    // Convert to UK time by using toLocaleString with 'en-GB' and timezone 'Europe/London'
    const ukDateString = now.toLocaleString('en-GB', { timeZone: 'Europe/London' });

    // Parse back to a Date object in local timezone (note: this will create a Date in local time zone of the environment)
    return new Date(ukDateString);
}