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
      const selectedGeminiModel = model && model.startsWith('gemini') ? model : 'gemini-3.8-flash';
      const validOAuthToken = oauthAccessToken || (await getValidAccessToken());
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

      let reply: string | null = null;
      let usedAuthType = 'Google OAuth 2.0';

      // Path A: Direct Google Generative Language API (if API Key or scoped Bearer token)
      if (validOAuthToken || apiKey) {
        try {
          const geminiUrl = validOAuthToken
            ? `https://generativelanguage.googleapis.com/v1beta/models/${selectedGeminiModel}:generateContent`
            : `https://generativelanguage.googleapis.com/v1beta/models/${selectedGeminiModel}:generateContent?key=${apiKey}`;

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (validOAuthToken) {
            headers['Authorization'] = `Bearer ${validOAuthToken}`;
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

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null;
            usedAuthType = validOAuthToken ? 'Google OAuth 2.0 (Direct API)' : 'Google API Key';
          }
        } catch {
          // Fall through to Path B
        }
      }

      // Path B: Native System Antigravity Google OAuth Bridge
      // (Leverages the active Google OAuth session eighty7supreme@gmail.com on this Mac)
      if (!reply) {
        try {
          const { execFile } = await import('child_process');
          const { promisify } = await import('util');
          const execFileAsync = promisify(execFile);

          const args = [
            '-p',
            `${TACTICAL_SYSTEM_PROMPT}\n\nUser: ${message}`,
            '--model',
            selectedGeminiModel,
          ];
          if (selectedGeminiModel.startsWith('gemini')) {
            args.push('--effort', 'low');
          }

          const { stdout } = await execFileAsync('/opt/homebrew/bin/agy', args, { timeout: 45000 });

          if (stdout && stdout.trim()) {
            reply = stdout.trim();
            const auth = getStoredGoogleAuth();
            usedAuthType = `Google OAuth 2.0 (${auth?.email || 'eighty7supreme@gmail.com'})`;
          }
        } catch (agyErr: any) {
          console.error('Antigravity Gemini runner failed:', agyErr.message);
        }
      }

      if (reply) {
        return NextResponse.json({
          provider: 'gemini',
          model: selectedGeminiModel,
          airgap: false,
          authType: usedAuthType,
          response: reply,
        });
      }

      return NextResponse.json(
        {
          provider: 'gemini',
          error:
            'Gemini requires Google OAuth authorization. Click "Link OAuth" in the AI Console to sign in with your Google account.',
          requiresOAuth: true,
        },
        { status: 401 }
      );
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
