import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string | null => {
  return localStorage.getItem('gemini_api_key') || process.env.API_KEY || null;
};

export const sendMessageToGemini = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("API_KEY missing");
    return JSON.stringify({ 
      action: "chat", 
      payload: "Configuration Error: API Key is missing. Please go to Settings and enter your Gemini API Key." 
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: `You are the central AI controller for a productivity app called 2ndBrain. 
Current Context:
- Date: ${dateString}
- Time: ${timeString}

You must communicate ONLY via a JSON object with an "action" and "payload".
Do not include markdown formatting like \`\`\`json. Just return the raw JSON object.

Supported Actions:
1. "create_note": payload is a string (the note content).
2. "add_event": payload is an object { "date": "YYYY-MM-DD", "title": "Event Title" }. If the user says "tomorrow", calculate the date relative to ${dateString}.
3. "update_wallet": payload is an object { "amount": number, "type": "income" | "expense", "description": "string" }. Extract a short description from the prompt if possible (e.g. "Groceries", "Salary").
4. "chat": payload is a string (for general questions, conversational replies, or confirmations).

Example Responses:
{"action": "create_note", "payload": "Buy groceries"}
{"action": "add_event", "payload": {"date": "2025-10-25", "title": "Team Sync"}}
{"action": "update_wallet", "payload": {"amount": 50, "type": "expense", "description": "Coffee"}}
{"action": "chat", "payload": "I have updated your records."}`
      }
    });
    
    return response.text || JSON.stringify({ action: "chat", payload: "No response generated." });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message || JSON.stringify(error);

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        return JSON.stringify({ action: "chat", payload: "System Alert: AI API Quota Exceeded (429). Please wait a moment and try again, or check your billing plan." });
    }

    return JSON.stringify({ action: "chat", payload: "Error connecting to AI service. Please check your API Key in Settings." });
  }
};

export const generateReportSummary = async (reportData: any): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key missing. Please configure in Settings.";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a professional, concise executive summary for a daily progress report. 
      
      Data:
      ${JSON.stringify(reportData, null, 2)}

      Requirements:
      - Tone: Professional, confident, and polite.
      - Format: Plain text (no markdown bold/italic) suitable for a PDF text block.
      - Content: Summarize the key achievements based on completed tasks. Mention what is currently being worked on (pending tasks).
      - Length: 2-3 short paragraphs max.
      - Start directly with the summary (e.g., "Today's progress focused on..."). Do not include "Here is the summary" or placeholders.`
    });

    return response.text || "Could not generate summary.";
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    const errorMessage = error.message || JSON.stringify(error);

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        return "Error: AI API Quota Exceeded. Unable to generate summary.";
    }

    return "Error generating report summary. Please try again.";
  }
};