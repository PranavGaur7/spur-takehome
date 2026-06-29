import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so our frontend application can talk to it seamlessly
app.use(cors({
    origin: '*', // For development flexibility
}));

app.use(express.json());

// Wire up the routes
app.use('/api', chatRouter);

app.listen(PORT, () => {
    console.log(`🚀 Spur Backend running smoothly at http://localhost:${PORT}`);
});