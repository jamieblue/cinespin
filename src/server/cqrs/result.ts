export type Result<T = void> =
    | (T extends void
        ? { success: true }
        : { success: true; data: Exclude<T, null | undefined> })
    | { success: false; error: string };
