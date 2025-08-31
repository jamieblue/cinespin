import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import tmdbRoutes from './routes/tmdb';
import googleAuthRoutes from './routes/googleAuth';
import lists from './routes/lists';
import passport from './auth/google/googleOAuth';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // configurable for prod
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API routes
app.use('/api/tmdb', tmdbRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/lists', lists);

// 👇 Catch-all: send index.html for SPA routes
app.get(/.*/, (req, res) =>
{
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${ PORT }`);
});
