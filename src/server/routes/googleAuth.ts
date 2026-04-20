import express from 'express';
import passport from '../auth/google/googleOAuth';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res, next) =>
{
    const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "/";
    // Pass redirect as state param to Google OAuth
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: encodeURIComponent(redirect)
    })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${ process.env.CLIENT_BASE_URL || 'http://localhost:3000' }/?error=auth_failed`
    }),
    (req, res) =>
    {
        const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
        // Google sends back the state param as req.query.state
        const redirectPath = req.query.state ? decodeURIComponent(req.query.state as string) : '/';
        res.redirect(clientUrl + redirectPath);
    }
);

// Logout
router.post('/logout', (req, res) =>
{
    req.logout((err) =>
    {
        if (err)
        {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', (req, res) =>
{
    if (req.isAuthenticated())
    {
        res.json({ user: req.user });
    } else
    {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

export default router;