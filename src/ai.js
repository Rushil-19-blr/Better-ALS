// ============================================================
// Gemini AI Integration Module
// ============================================================

const API_KEY = 'AIzaSyBkjgTU36WboP_aqh29ckl1AikRjLfrBUY';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

async function callGemini(prompt, maxTokens = 1024) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
    });
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return 'I could not generate a response right now. Please try again.';
  } catch (err) {
    console.error('Gemini API error:', err);
    return 'Connection error — please check your internet and try again.';
  }
}

export async function generateHint(questionText, level) {
  const prompts = {
    1: `You are a JEE tutor. A student got this question wrong. Give a very brief CONCEPT NUDGE — just name the relevant concept or formula they need, without solving anything. Max 2-3 sentences. Use LaTeX with \\( \\) delimiters for math.\n\nQuestion: ${questionText}`,
    2: `You are a JEE tutor. A student got this wrong even after knowing the concept. Give an APPLICATION GUIDE — show the general approach for this problem type without revealing the final answer. 3-5 sentences. Use LaTeX with \\( \\) delimiters for math.\n\nQuestion: ${questionText}`,
    3: `You are a JEE tutor. Walk through the COMPLETE SOLUTION step by step. Number each step. Use LaTeX with \\( \\) delimiters for math.\n\nQuestion: ${questionText}`,
  };
  return callGemini(prompts[level] || prompts[1]);
}

export async function explainConcept(questionText) {
  return callGemini(
    `You are a JEE tutor. Explain ONLY the underlying concept needed for this question — don't solve it, don't mention specific numbers. Just teach the theory and general approach. Use LaTeX with \\( \\) delimiters. Keep it concise.\n\nQuestion: ${questionText}`
  );
}

export async function chatWithAI(questionText, userMessage, history = []) {
  const ctx = history.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
  return callGemini(
    `You are a friendly JEE tutor in a question practice app. The student is working on:\n"${questionText}"\n\nRules:\n- Use **bold** for key terms\n- Use numbered steps for solutions\n- Use LaTeX \\( \\) for inline math, \\[ \\] for display math\n- Be concise and encouraging\n- If they ask "solve this", give approach hints first, not direct answers\n\n${ctx ? 'Conversation so far:\n' + ctx + '\n\n' : ''}Student: ${userMessage}`
  );
}

export async function generateSimilarQuestion(questionText) {
  return callGemini(
    `Generate a JEE-style question similar in concept but with DIFFERENT numerical values. DO NOT use markdown code blocks (\`\`\`). Return in this EXACT plain text format:\nQUESTION: [text with LaTeX \\( \\) notation]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\nCORRECT: [A/B/C/D]\n\nOriginal: ${questionText}`,
    512
  );
}

export async function answerDoubt(doubtText) {
  return callGemini(
    `You are a JEE tutor answering a general student doubt (not tied to a specific platform question). Explain clearly with examples. Use LaTeX \\( \\) for math. Be helpful and thorough but concise.\n\nStudent's doubt: ${doubtText}`
  );
}
