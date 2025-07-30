import { Result } from "./result";

export interface QueryHandler<TRequest, TResponse>
{
    handle(request: TRequest): Promise<Result<TResponse>>;
}
