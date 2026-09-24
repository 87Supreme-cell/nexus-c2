import { NextResponse } from 'next/server';
import http from 'http';
import { getValidAccessToken, getStoredGoogleAuth } from '@/lib/google-auth-service';

const TACTICAL_SYSTEM_PROMPT = `You are NEXUS-C2, an elite tactical AI copilot and system orchestrator designed for high-stakes software engineering, defense command operations, and Google Workspace coordination.
You are running within the local command center on macOS. You have deep knowledge of:
- Local runtimes: Ollama models, Apple MLX models, LM Studio, Docker containers, Python/Node services.
- Google ecosystem: Calendar, Tasks, Gmail, Drive, GCP.
- Antigravity CLI (agy): Autonomous engineering agent.
Respond crisply, accurately, with tactical precision, DoD discipline, and clean markdown. Keep answers concise, actionable, and structured.`;

async function callOllama(model: string, prompt: string): Promise<string> {
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
          } catch {
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
    const body = await req.json();
    const { message, model, provider, geminiApiKey, oauthAccessToken } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const isGeminiSelected = provider === 'gemini' || (model && model.toLowerCase().startsWith('gemini'));

    // ==========================================
    // 1. GOOGLE GEMINI CLOUD (OAUTH OR API KEY)
    // ==========================================
    if (isGeminiSelected) {
      const selectedGeminiModel = model && model.startsWith('gemini') ? model : 'gemini-1.5-flash';
      
      // Check for OAuth Access Token (passed or stored)
      const validOAuthToken = oauthAccessToken || (await getValidAccessToken());
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

      if (!validOAuthToken && !apiKey) {
        return NextResponse.json(
          {
            error:
              'Gemini requires Google OAuth authorization or an API Key. Click "Authenticate Google OAuth" in the AI Console or settings.',
            requiresOAuth: true,
          },
          { status: 401 }
        );
      }

      let geminiUrl: string;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (validOAuthToken) {
        // Authenticated via Google OAuth 2.0 Bearer token!
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedGeminiModel}:generateContent`;
        headers['Authorization'] = `Bearer ${validOAuthToken}`;
      } else {
        // Authenticated via API key fallback
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedGeminiModel}:generateContent?key=${apiKey}`;
      }

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers,
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
      
      if (!geminiRes.ok) {
        return NextResponse.json(
          {
            provider: 'gemini',
            error: geminiData.error?.message || 'Google Gemini API returned an error.',
            authType: validOAuthToken ? 'oauth' : 'api-key',
          },
          { status: geminiRes.status }
        );
      }

      const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

      return NextResponse.json({
        provider: 'gemini',
        model: selectedGeminiModel,
        airgap: false,
        authType: validOAuthToken ? 'Google OAuth 2.0' : 'API Key',
        response: reply,
      });
    }

    // ==========================================
    // 2. LOCAL AIRGAP INFERENCE (OLLAMA / MLX)
    // ==========================================
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
      return NextResponse.json(
        {
          provider: 'ollama',
          error: `Ollama execution error: ${ollamaErr.message}. Ensure Ollama is running and model '${selectedModel}' is available.`,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'AI processing failed', details: error?.message },
      { status: 500 }
    );
  }
}
