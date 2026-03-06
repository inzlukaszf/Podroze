import express from 'express';
import cors from 'cors';
import transitRoutes from './routes/transit.js';
import geocodeRoutes from './routes/geocode.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/transit', transitRoutes);
app.use('/api/geocode', geocodeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
