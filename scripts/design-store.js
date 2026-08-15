export const SHARE_SCHEMA_VERSION = 2;
const STORAGE_KEY = 'kariyushi-saved-designs';
const MAX_SAVED_DESIGNS = 30;
const MAX_SHARE_PAYLOAD_BYTES = 120 * 1024;
const allowed = ['brief', 'edit', 'model', 'fabricJson'];
function uid() { return `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function normalize(value) { return value && typeof value === 'object' ? value : {}; }
export function validateSharePayload(payload) {
  if (payload && typeof payload === 'object' && (!payload.version || payload.version === 1) && !payload.schema) {
    const legacy = {};
    for (const key of ['palette','pattern','logo','collar','button','density','scale','assetId','fabricJson']) if (payload[key] !== undefined) legacy[key] = payload[key];
    return legacy;
  }
  if (!payload || typeof payload !== 'object' || payload.schema !== 'kariyushi-share' || payload.version !== SHARE_SCHEMA_VERSION) return null;
  const result = { schema: payload.schema, version: payload.version };
  for (const key of allowed) if (payload[key] !== undefined) result[key] = key === 'fabricJson' ? (typeof payload[key] === 'string' || typeof payload[key] === 'object' ? payload[key] : null) : normalize(payload[key]);
  return result;
}
export function saveDesign(data) {
  const designs = readAll(); const rest = { ...(data || {}) }; delete rest.id; delete rest.createdAt; const entry = { id: uid(), createdAt: new Date().toISOString(), ...rest }; designs.unshift(entry); designs.length = Math.min(designs.length, MAX_SAVED_DESIGNS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(designs)); } catch { designs.shift(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(designs)); } catch { throw new Error('ブラウザの保存容量を超えました。保存済みデザインを整理してから再度お試しください。'); } } return entry;
}
export function readAll() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(value) ? value : []; } catch { return []; } }
export function loadDesign(id) { return readAll().find((d) => d.id === id) || null; }
export function generateShareUrl(data) {
  const payload = JSON.stringify({ schema: 'kariyushi-share', version: SHARE_SCHEMA_VERSION, ...Object.fromEntries(allowed.filter((key) => data?.[key] !== undefined).map((key) => [key, data[key]])) });
  if (new Blob([payload]).size > MAX_SHARE_PAYLOAD_BYTES) throw new Error('デザインデータのサイズが大きすぎるため、共有URLを作成できません。（上限120KB）');
  const bytes = new TextEncoder().encode(payload); const binary = Array.from(bytes, (x) => String.fromCharCode(x)).join(''); const url = new URL(window.location.href.split('?')[0]); url.searchParams.set('design', btoa(binary)); return url.toString();
}
export function loadFromUrl(url) { try { const params = url ? new URL(url).searchParams : new URLSearchParams(window.location.search); const encoded = params.get('design'); if (!encoded) return null; const binary = atob(encoded); const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0)); return validateSharePayload(JSON.parse(new TextDecoder().decode(bytes))); } catch (error) { console.warn('共有デザインを読み込めませんでした', error); return null; } }
export async function copyShareUrl(data) { try { const url = generateShareUrl(data); if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); return true; } const input = document.createElement('input'); input.value = url; document.body.append(input); input.select(); const ok = document.execCommand('copy'); input.remove(); return ok; } catch { return false; } }

if (typeof window !== 'undefined') window.KariyushiDesignStore = { saveDesign, readAll, loadDesign, generateShareUrl, loadFromUrl, copyShareUrl, validateSharePayload };
