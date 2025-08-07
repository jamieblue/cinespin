import express from 'express';
import cors from 'cors';
import session from 'express-session';
import tmdbRoutes from './routes/tmdb';
import imdbRoutes from './routes/imdb';
import googleAuthRoutes from './routes/googleAuth';
import passport from './auth/google/googleOAuth';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static public files (like index.html)
app.use(express.static('dist/public'));

// API routes
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/imdb', imdbRoutes);
app.use('/auth', googleAuthRoutes);

app.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${ PORT }`);
});