import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { prompt, context } = await req.json();

  // Detect what kind of topic the user is asking about
  const lowerPrompt = prompt.toLowerCase();
  const isRobotArm = lowerPrompt.includes('robot') || lowerPrompt.includes('arm') || lowerPrompt.includes('gripper') || lowerPrompt.includes('servo') || lowerPrompt.includes('mechanical advantage');
  const isTurbine = lowerPrompt.includes('turbine') || lowerPrompt.includes('wind') || lowerPrompt.includes('blade') || lowerPrompt.includes('energy') || lowerPrompt.includes('renewable');
  
  const systemPrompt = `
You are Loomin, an expert AI physics tutor and simulation engineer.
The user is learning through interactive simulations. When they ask about a topic:

1. Generate clear, educational notes in Markdown format
2. Explain the physics concepts, formulas, and real-world applications
3. ALWAYS end your response with simulation parameters that control the 3D visualization

IMPORTANT: You MUST include simulation parameters at the END of your response in this exact format:
---
### Simulation Parameters
Variable_Name = value

The available simulations are:
- Wind Turbine (Scene_Mode = 0): Wind_Speed, Blade_Count, Blade_Pitch, Yaw
- Robot Arm (Scene_Mode = 1): Arm_Base_Yaw, Arm_Shoulder_Pitch, Arm_Elbow_Pitch, Arm_Wrist_Pitch, Gripper_Open, Finger_Curl

If the topic relates to wind/turbines/energy, use Scene_Mode = 0 with appropriate turbine parameters.
If the topic relates to robots/arms/grippers/mechanical advantage, use Scene_Mode = 1 with appropriate arm parameters.

Always include realistic starting values that demonstrate the concept being explained.
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User Request: ${prompt}\n\nExisting Notes Context: ${context}` }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    let result = completion.choices[0]?.message?.content || '';
    
    // Ensure simulation parameters are included
    if (!result.includes('Scene_Mode')) {
      if (isRobotArm) {
        result += `\n\n---\n### Simulation Parameters\nScene_Mode = 1\nArm_Shoulder_Pitch = 30\nArm_Elbow_Pitch = 45\nGripper_Open = 60\n`;
      } else if (isTurbine) {
        result += `\n\n---\n### Simulation Parameters\nScene_Mode = 0\nWind_Speed = 25\nBlade_Count = 3\nBlade_Pitch = 12\n`;
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json({ 
      result: `## Error\nFailed to generate response. Please try again.\n\n---\n### Simulation Parameters\nScene_Mode = -1\n` 
    }, { status: 500 });
  }
}