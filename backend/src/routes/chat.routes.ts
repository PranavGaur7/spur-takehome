import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { generateReply } from '../services/llm.service';

const router = Router();
const prisma = new PrismaClient();

// Strict Zod input validation to ensure the server never crashes on bad payloads
const chatSchema = z.object({
    message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
    sessionId: z.string().nullish(),
});

router.post('/chat/message', async (req: any, res: any) => {
    try {
        // 1. Validate incoming data
        const parsed = chatSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0].message });
        }

        const { message, sessionId } = parsed.data;

        // 2. Find or create the conversation session
        let conversationId = sessionId;
        if (!conversationId) {
            const newConv = await prisma.conversation.create({ data: {} });
            conversationId = newConv.id;
        } else {
            // Check if conversation actually exists
            const existingConv = await prisma.conversation.findUnique({ where: { id: conversationId } });
            if (!existingConv) {
                const newConv = await prisma.conversation.create({ data: {} });
                conversationId = newConv.id;
            }
        }

        // 3. Fetch the conversation history FIRST (Limit to last 10)
        const rawHistory = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { timestamp: 'asc' },
            take: 10
        });

        // Format the history perfectly for Gemini
        const formattedHistory = rawHistory.map(m => ({
            role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text
        }));

        // 4. Save the NEW User Message to Database
        await prisma.message.create({
            data: { conversationId, sender: 'user', text: message }
        });

        // 5. Generate AI Reply using our Gemini Service
        const aiReplyText = await generateReply(formattedHistory, message);

        // 6. Save AI Response to Database
        await prisma.message.create({
            data: { conversationId, sender: 'ai', text: aiReplyText }
        });

        // 7. Return payload to frontend
        return res.json({ reply: aiReplyText, sessionId: conversationId });

    } catch (error) {
        console.error("Chat API Endpoint Error:", error);
        return res.status(500).json({ error: "Something went wrong internally." });
    }
});

export default router;