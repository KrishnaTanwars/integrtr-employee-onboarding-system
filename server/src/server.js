import 'dotenv/config';
import app from './app.js';
import { initDb } from './config/db.js';

const PORT = process.env.PORT || 5000;

initDb();

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});