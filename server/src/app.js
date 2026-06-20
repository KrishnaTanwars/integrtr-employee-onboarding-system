import express from 'express';
import cors from 'cors';
import onboardingRoutes from './routes/onboardingRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend Running');
});

app.use('/api', onboardingRoutes);

export default app;