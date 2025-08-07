import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AddOrUpdateGoogleUserCommandHandler } from '../../cqrs/users/commands/addOrUpdateGoogleUserCommand';
import { GetGoogleUserByIDQueryHandler } from '../../cqrs/users/queries/getGoogleUserByIDQuery';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) =>
        {
            try
            {
                const result = await new AddOrUpdateGoogleUserCommandHandler().handle({
                    googleId: profile.id,
                    email: profile.emails?.find(e => e.verified)?.value || '',
                    name: profile.displayName,
                });

                if (result.success)
                {
                    return done(null, result.data.user);
                } else
                {
                    return done(new Error(result.error));
                }
            } catch (error)
            {
                return done(error);
            }
        }
    )
);

passport.serializeUser((user: Express.User, done) =>
{
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) =>
{
    try
    {
        const result = await new GetGoogleUserByIDQueryHandler().handle({ userId: id });

        if (result.success)
        {
            done(null, result.data.user);
        } else
        {
            done(new Error(result.error));
        }
    } catch (error)
    {
        done(error);
    }
});

export default passport;