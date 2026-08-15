import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const apiKey = process.env.GEMINI_API_KEY;

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

/**
 * Gemini is intentionally called only here. GEMINI_API_KEY is a server secret;
 * it is never serialized into HTML, client JavaScript, or share URLs.
 */
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, provider: apiKey ? 'configured' : 'mock' });
  if (req.method !== 'POST' || req.url !== '/api/design-suggestions') return json(res, 404, { error: 'not_found' });
  if (!apiKey) return json(res, 503, { error: 'ai_provider_not_configured', message: 'サーバー側の提案サービスが未設定です。' });
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    const input = JSON.parse(raw);
    const prompt = `かりゆしウェアのデザイン提案を3案、日本語で作成してください。用途=${String(input.scene || '').slice(0, 80)}、雰囲気=${String(input.mood || '').slice(0, 40)}、柄=${String(input.motif || '').slice(0, 40)}。`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!response.ok) return json(res, 502, { error: 'ai_provider_error' });
    const result = await response.json();
    return json(res, 200, { text: result.candidates?.[0]?.content?.parts?.[0]?.text || '' });
  } catch { return json(res, 400, { error: 'invalid_request' }); }
});

server.listen(port, '127.0.0.1', () => console.log(`Kariyushi server listening on ${port}`));
