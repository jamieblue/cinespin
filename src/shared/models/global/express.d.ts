import { User as AppUser } from '../users/user';

declare global
{
    namespace Express
    {
        interface User extends AppUser { }

        interface Request
        {
            clientIp?: string;
            country?: string;
        }

        interface Response
        {
            locals: {
                clientIp?: string;
                country?: string;
                [key: string]: any;
            };
        }
    }
}

export { };