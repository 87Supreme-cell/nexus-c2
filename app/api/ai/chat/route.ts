import { NextResponse } from 'next/server';
import http from 'http';

const TACTICAL_SYSTEM_PROMPT = `You are NEXUS-C2, an elite tactical AI copilot and system orchestrator designed for high-stakes software engineering, defense command operations, and Google Workspace coordination.
You are running within the local command center on macOS. You have deep knowledge of:
- Local runtimes: Ollama models, Docker containers, Python/Node services.
- Google ecosystem: Calendar, Tasks, Gmail, Drive, GCP.
- Antigravity CLI (agy): Autonomous engineering agent.
Respond crisply, accurately, with tactical precision, DoD discipline, and clean markdown. Keep answers concise, actionable, and structured.`;

async function callOllama(model: string, prompt: string, messages?: any[]): Promise<string> {
  const payload = JSON.stringify({
    model,
    prompt: `${TACTICAL_SYSTEM_PROMPT}\n\nUser: ${prompt}\n\nNEXUS-C2:`,
    stream: false,
  });

  return new Promise((resolve, reject) => {
    const req = http.request(
      'http://127.0.0.1:11434/api/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 60000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed.response || parsed.message?.content || 'No response from model.');
          } catch (e) {
            reject(new Error(`Ollama response parse error: ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama inference timed out'));
    });

    req.write(payload);
    req.end();
  });
}

export async function POST(req: Request) {
  try {
    const { message, model, provider, geminiApiKey } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Default to local Ollama
    if (!provider || provider === 'ollama') {
      const selectedModel = model || 'qwen2.5-coder:7b';
      try {
        const responseText = await callOllama(selectedModel, message);
        return NextResponse.json({
          provider: 'ollama',
          model: selectedModel,
          airgap: true,
          response: responseText,
        });
      } catch (ollamaErr: any) {
        return NextResponse.json({
          provider: 'ollama',
          error: `Ollama execution error: ${ollamaErr.message}. Ensure Ollama is running and model '${selectedModel}' is available.`,
        }, { status: 502 });
      }
    }

    // Optional Gemini Cloud Provider
    if (provider === 'gemini') {
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          error: 'Gemini API key is not configured. Switch to Local Ollama or configure GEMINI_API_KEY in .env.local.',
        }, { status: 400 });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${TACTICAL_SYSTEM_PROMPT}\n\nUser: ${message}` }],
            },
          ],
        }),
      });

      const geminiData = await geminiRes.json();
      const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

      return NextResponse.json({
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        airgap: false,
        response: reply,
      });
    }

    return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'AI processing failed', details: error?.message },
      { status: 500 }
    );
  }
}
