import { Request, RequestHandler } from "express";
import { runWithContext } from "./requestContext";
const geoip = require("geoip-lite");

export const ipMiddleware: RequestHandler = (req, res, next) =>
{
    const clientIp = extractClientIp(req) || undefined;
    const country = getCountryFromIp(clientIp);

    (req as any).clientIp = clientIp;
    (req as any).country = country;
    res.locals.clientIp = clientIp;
    res.locals.country = country;

    // Run the rest of the request inside the AsyncLocalStorage context
    runWithContext({ clientIp, country }, () => next());
};

export function extractClientIp(req: Request): string | null
{
    // Prefer X-Forwarded-For (may contain a comma separated list)
    const forwarded = (req.headers["x-forwarded-for"] || req.headers["x-client-ip"] || "") as string;
    let ip = forwarded ? forwarded.split(",")[0].trim() : (req.ip || (req.connection as any)?.remoteAddress || "");
    if (!ip) return null;

    // Strip IPv4-mapped IPv6 prefix and zone ids, remove brackets
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
    ip = ip.split("%")[0];
    if (ip.startsWith("[") && ip.includes("]"))
    {
        ip = ip.slice(1, ip.indexOf("]"));
    }
    return ip;
}

export function getCountryFromIp(ip?: string): string | undefined
{
    if (!ip) return undefined;

    let cleaned = String(ip).trim();

    // X-Forwarded-For may contain a list
    if (cleaned.includes(",")) cleaned = cleaned.split(",")[0].trim();

    // Strip IPv4-mapped IPv6 prefix
    if (cleaned.startsWith("::ffff:")) cleaned = cleaned.replace("::ffff:", "");

    // Remove IPv6 zone id (e.g. %eth0) and surrounding brackets
    cleaned = cleaned.split("%")[0];
    if (cleaned.startsWith("[") && cleaned.includes("]"))
    {
        cleaned = cleaned.slice(1, cleaned.indexOf("]"));
    }

    const geo = geoip.lookup(cleaned);
    return geo?.country ? String(geo.country).toUpperCase() : undefined;
}