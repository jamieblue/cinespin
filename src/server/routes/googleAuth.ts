import express from 'express';
import passport from '../auth/google/googleOAuth';

const router = express.Router();

// Initiate Google OAuth
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req, res) =>
    {
        // Successful authentication, redirect with success parameter
        res.redirect('/?auth=success');
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