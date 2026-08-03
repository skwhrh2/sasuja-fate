import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const { question, context } = await request.json();

    const prompt = `
[System Role]
You are a master storyteller and expert life consultant specializing in the three ancient Asian wisdom traditions. You are answering a specific 1:1 question from a client who has already received their full destiny report.

[Context]
Destiny Analysis Data: ${JSON.stringify(context)}

[Client Question]
"${question}"

[Request]
Provide a deep, empathetic, and insightful 1:1 expert response in the same narrative, mystical storytelling style as the main report. Keep it concise but profound.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return NextResponse.json({ success: true, answer: response.text });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
