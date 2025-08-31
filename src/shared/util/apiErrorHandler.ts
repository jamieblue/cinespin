export function unauthorizedResponse()
{
    return {
        success: false,
        error: "User not authenticated"
    };
}

export function serverErrorResponse(message: string)
{
    return {
        success: false,
        error: message
    };
}