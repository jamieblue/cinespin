import { RequestHandler } from "express";
import { extractClientIp, getCountryFromIp } from "../../shared/util/ipHelper";
import { runWithContext } from "../../shared/util/requestContext";

export const clientRegionMiddleware: RequestHandler = (req, res, next) =>
{
    const clientIp = extractClientIp(req) || undefined;
    let country = getCountryFromIp(clientIp);

    if (clientIp == "127.0.0.1")
    {
        country = "GB";
    }

    (req as any).clientIp = clientIp;
    (req as any).country = country;
    res.locals.clientIp = clientIp;
    res.locals.country = country;

    runWithContext({ clientIp, country }, () => next());
};