import { User as AppUser } from '../users/user';

declare global
{
    namespace Express
    {
        interface User extends AppUser { }
    }
}

export { };