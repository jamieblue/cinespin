import { AsyncLocalStorage } from "async_hooks";

type ReqContext = { clientIp?: string; country?: string };

const als = new AsyncLocalStorage<ReqContext>();

export function runWithContext(ctx: ReqContext, fn: (...args: any[]) => any)
{
    return als.run(ctx, fn);
}

export function getRequestContext(): ReqContext | undefined
{
    return als.getStore();
}

export function getRequestCountry(): string | undefined
{
    return als.getStore()?.country;
}

export function getRequestClientIp(): string | undefined
{
    return als.getStore()?.clientIp;
}