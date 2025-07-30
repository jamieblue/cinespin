import express from 'express';
import cors from 'cors';
import tmdbRoutes from './routes/tmdb';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Static public files (like index.html)
app.use(express.static('dist/public'));

// API routes
app.use('/api/tmdb', tmdbRoutes);

app.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${ PORT }`);
});