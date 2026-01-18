import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { prompt, context } = await req.json();

  const systemPrompt = `
    You are Loomin, an expert AI tutor. 
    The user is taking notes. They will ask you to explain something or generate notes.
    Output clear, formatted Markdown notes that can be directly inserted into their document.
    Keep it concise and educational.
  `;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${context}\n\nUser Request: ${prompt}` }
    ],
    model: 'llama-3.3-70b-versatile',
  });

  return NextResponse.json({ result: completion.choices[0]?.message?.content });
}