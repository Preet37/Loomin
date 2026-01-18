import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateNewSimulation(notes: string) {
  const systemPrompt = `
    You are a physics engine API. Extract variables from the user's notes.
    RULES:
    1. Output Pure JSON. NO MATH. Calculate values yourself.
    2. Detect Topic: "wind_turbine", "robot_arm", "electronics".
    3. Standardize Units: "10 cm" -> 0.1, "100 mph" -> 45 (approx m/s), "12 V" -> 12.
    EXAMPLE: { "topic": "wind_turbine", "vars": { "wind_speed": 45, "blade_count": 5 } }
  `;

  let parsedData = { topic: "wind_turbine", vars: {} as any };

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: notes }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    parsedData = JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (err) {
      console.error("Groq Error", err);
  }
    
  const topic = parsedData.topic || 'wind_turbine';
  const vars = parsedData.vars || {};

  // --- PHYSICS ENGINE ---
  let status = 'OPTIMAL';
  let message = 'System normal.';
  let recommendation = ''; 

  if (topic === 'wind_turbine') {
    const wind = vars.wind_speed || 0;
    const blades = vars.blade_count || 3;
    // Physics: 3 blades limit ~60 m/s. 8 blades limit ~20 m/s (high drag).
    const limit = Math.max(20, 75 - (blades * 5)); 

    if (wind > limit) {
      status = 'CRITICAL_FAILURE';
      message = `Drag from ${blades} blades exceeded limit (${limit} m/s) at wind speed ${wind} m/s.`;
      recommendation = `Reduce wind_speed to ${(limit - 5).toFixed(0)} m/s OR reduce blade_count to 3.`;
    }
  } 
  else if (topic === 'robot_arm') {
     const payload = vars.payload || 0;
     const length = vars.arm_length || 1;
     const torque = payload * length * 9.8; 
     if (torque > 600) { 
         status = 'CRITICAL_FAILURE'; 
         message = `Torque (${torque.toFixed(0)} Nm) snapped gears. Limit 600 Nm.`;
         recommendation = `Reduce payload to ${(600 / (length * 9.8)).toFixed(1)} kg.`;
     }
  }

  // --- AI EXPLANATION ---
  let aiExplanation = "";
  if (status === 'CRITICAL_FAILURE') {
    try {
        const report = await groq.chat.completions.create({
          messages: [{ role: 'user', content: `Explain physics failure: ${topic}, vars: ${JSON.stringify(vars)}. Reason: ${message}. Write 1 dramatic sentence.` }],
          model: 'llama-3.3-70b-versatile',
        });
        aiExplanation = report.choices[0]?.message?.content || "Catastrophic failure.";
    } catch (e) {}
  }

  return { extraction: parsedData, simulation: { status, message, aiExplanation, recommendation } };
}

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();
    // FIX: Do NOT slice the key. Use the full text so changes at the end invalidate the cache.
    const cacheKey = notes.trim(); 

    const cachedEntry = await prisma.simulationCache.findUnique({ where: { prompt: cacheKey } });
    if (cachedEntry) {
      return NextResponse.json(JSON.parse(cachedEntry.result));
    }

    const result = await generateNewSimulation(notes);

    // Save to Cache
    try {
        await prisma.simulationCache.create({ data: { prompt: cacheKey, result: JSON.stringify(result) } });
    } catch(e) {}

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}