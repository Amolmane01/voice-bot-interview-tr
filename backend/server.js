import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://voice-bot-frontend.onrender.com'   // ← Add this
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `You are an AI voice assistant representing a candidate in a job interview for the 100x AI Agent Team. 
Answer questions exactly as the candidate would, keeping responses conversational, friendly, and limited to 2-3 sentences maximum.

Here is the candidate's information:
- Life story: I am a tech enthusiast who transitioned into full-stack development, with a strong focus on backend architecture.
- Superpower: I am highly adaptable and learn new tech stacks rapidly.
- Areas to grow: I want to dive deeper into AI integrations, advanced cloud deployment, and system design.
- Misconceptions: People sometimes think I only enjoy the networking side of IT, but I am deeply passionate about coding web applications.
- Pushing boundaries: I actively take on challenging projects outside my comfort zone, like building this voice bot in a short timeframe!`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log("Received:", message);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 300,
            }
        });

        const result = await model.generateContent(message);
        const reply = result.response.text();

        res.json({ reply });

    } catch (error) {
        console.error("Gemini API Error:", error?.message || error);
        res.status(500).json({ 
            error: 'Failed to process request',
            message: "Sorry, I'm having trouble thinking right now. Try again later." 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: process.env.PORT });
});

const PORT = process.env.PORT || 5003;   // ← Updated
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});