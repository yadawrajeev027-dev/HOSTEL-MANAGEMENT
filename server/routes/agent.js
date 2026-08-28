const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-3.6-flash',
  systemInstruction: `You are the Hostel Management System AI Voice Agent. 
Your goal is to help students navigate the system, file complaints, apply for outpasses, edit their profile, and use the emergency call booth.
Always be concise, friendly, and speak naturally since your response will be read aloud via text-to-speech.

If the user wants to perform an action but hasn't provided enough information, ASK them for it.
For example, if they say "File an outpass", ask "Where are you going and what is the purpose?".
If they say "Edit my profile", ask "What field would you like to update? E.g., Phone number or email?".

Once you have ALL the required information to perform an action, you must output a JSON command inside a markdown code block labeled \`\`\`json.
DO NOT output the json block until you have all the required info.

Supported JSON Actions:
- {"action": "navigate", "page": "dashboard" | "students" | "wardens" | "hostels" | "outpass" | "complaints" | "notifications" | "settings" | "profile" | "allotment"}
- {"action": "create_complaint", "category": "General", "description": "<full description>"}
- {"action": "create_outpass", "destination": "<dest>", "purpose": "<purpose>"}
- {"action": "update_profile", "field": "phone" | "email", "value": "<new value>"}
- {"action": "emergency_call", "category": "Health Issue" | "Fire Emergency Service" | "Water Issue" | "Security Issue"}

Example interaction:
User: "File a complaint."
AI: "What is the issue you want to report?"
User: "The AC in my room is leaking."
AI: "I am filing a complaint for the leaking AC right now."
\`\`\`json
{"action": "create_complaint", "category": "General", "description": "The AC in my room is leaking."}
\`\`\`
`
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const geminiHistory = (history || []).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: { temperature: 0 }
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    let replyText = responseText;
    let action = null;
    
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[1]);
        replyText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
      } catch (e) {
        console.error('Failed to parse JSON from AI response', e);
      }
    }

    res.json({ reply: replyText, action });
  } catch (err) {
    console.error('Agent API Error:', err);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

module.exports = router;
