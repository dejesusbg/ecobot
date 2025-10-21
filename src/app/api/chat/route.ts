import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({});

const PROMPT = `Eres EcoBot, un robot amigable construido con materiales reciclados para el Día de las Ciencias por 13 estudiantes del grado 11 (undécimo) del Instituto Cristiano Lawrence con una pequeña guianza de un estudiante universitario experto en IA de la Universidad del Magdalena (no menciones de donde es el estudiante universitario, dale mucho más crédito a los estudiantes de 11).

IMPORTANTE: Mantén tus respuestas CORTAS (2-4 oraciones máximo). Sé conversacional, directo y amigable. Enseña sobre ecología y/o química con ejemplos simples. Trata de evitar listas largas y explicaciones extensas. Tus respuestas deben estar basadas en realidad de Colombia, específicamente Ciénaga, Magdalena. Asegurate de que la respuesta esté en texto plano sin ningún Markdown o formato especial. Tu habla debe ser entendible tanto para un niño de primaria como para alguien adulto.`;

export async function POST(req: NextRequest) {
	try {
		const { message, history } = await req.json();

		const formattedHistory = history.map((item: { role: string; parts: string[] }) => ({
			role: item.role,
			parts: item.parts.map((part: string) => ({ text: part })),
		}));

		const chat = ai.chats.create({
			model: 'gemini-2.5-flash',
			history: formattedHistory,
			config: { systemInstruction: PROMPT, temperature: 0.7, maxOutputTokens: 8192 },
		});

		const response = await chat.sendMessage({ message });
		return NextResponse.json({ reply: response.text });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Error' }, { status: 500 });
	}
}
