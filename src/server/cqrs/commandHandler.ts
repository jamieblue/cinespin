import { Result } from "./result";

export interface CommandHandler<TCommand, TResult = void>
{
    handle(command: TCommand): Promise<Result<TResult>>;
}
