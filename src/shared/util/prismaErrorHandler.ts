import { Prisma } from "@prisma/client";

/**
 * Map Prisma known error codes to human-readable messages.
 * Returns `null` if error is not recognized.
 */
export function PrismaErrorHandler(err: unknown): string | null
{
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

    switch (err.code)
    {
        case "P2002": // Unique constraint violation
            // Example: Duplicate email or unique field
            return "A record with the same unique value already exists.";

        case "P2003": // Foreign key constraint failed
            return "Referenced record does not exist.";

        case "P2025": // Record to update/delete not found
            return "Record not found.";

        case "P2016": // Query engine panic
            return "Database query engine panic. Please try again later.";

        case "P2011": // Null constraint violation
            return "A required value was null.";

        // Add any other codes you care about here
        // https://www.prisma.io/docs/reference/api-reference/error-reference

        default:
            return `Database error (code: ${ err.code })`;
    }
}