import { validateBrief, validateQuantity } from './validation.js';

function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function uid(prefix) { return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`; }

function scorePattern(pattern, brief, lane) {
  let score = 0;
  if (brief.motif !== 'AIに任せる' && pattern.motifs.includes(brief.motif)) score += 6;
  score += brief.mood === '上品' ? pattern.formal : brief.mood === '伝統的' ? pattern.okinawa : brief.mood === '大胆' ? pattern.bold : Math.floor((pattern.formal + pattern.okinawa + pattern.bold) / 3);
  score += lane.id === 'uniform' ? pattern.formal : lane.id === 'heritage' ? pattern.okinawa : lane.id === 'resort' ? pattern.bold : 0;
  if (brief.scene === '仕事') score += pattern.formal + 2;
  return score;
}
function pickPattern(patterns, brief, lane, index) { return [...patterns].sort((a, b) => scorePattern(b, brief, lane) - scorePattern(a, brief, lane))[index % patterns.length]; }

export class KariyushiApiClient {
  constructor(config, seed) { this.config = config; this.seed = seed; }
  async getCatalog() { return { palettes: this.seed.palettes, patterns: this.seed.patterns, assets: this.seed.assets, sizeTable: this.seed.sizeTable }; }
  async createDesignSession(input) {
    const brief = validateBrief(input, this.config.defaultBrief);
    const session = { id: uid('session'), createdAt: new Date().toISOString(), brief, status: 'draft' };
    const sessions = readJson(this.config.storageKeys.sessions, []); sessions.unshift(session); sessions.length = Math.min(sessions.length, this.config.storageLimits?.sessions || 20);
    if (!writeJson(this.config.storageKeys.sessions, sessions)) throw new Error('作業状態を保存できません。ブラウザの保存領域を確認してください。');
    writeJson(this.config.storageKeys.selectedSession, session); return session;
  }
  async generateDesigns(sessionId, input) {
    if (!sessionId) throw new Error('セッションが見つかりません。もう一度提案を開始してください。');
    const brief = validateBrief(input, this.config.defaultBrief);
    const proposals = this.seed.conceptLanes.map((lane, index) => {
      const pattern = pickPattern(this.seed.patterns, brief, lane, index);
      const reference = this.seed.assets.find((item) => item.tags.some((tag) => pattern.motifs.includes(tag))) || this.seed.assets[index];
      return { id: `proposal_${index + 1}`, sessionId, lane: lane.id, title: lane.title, direction: lane.direction, pattern, palette: brief.palette, logo: lane.logo, collar: lane.collar, button: index === 1 ? '白蝶貝風' : '黒蝶貝風', density: lane.density, scale: lane.scale, assetId: reference.id, tags: [brief.scene, brief.mood, pattern.name, brief.palette] };
    });
    return { sessionId, proposals, generatedAt: new Date().toISOString() };
  }
  async createEstimate(quantity) { const qty = validateQuantity(quantity); const unitPrice = qty >= 200 ? 6900 : qty >= 100 ? 7600 : qty >= 50 ? 8600 : 9800; return { quantity: qty, unitPrice, samplePrice: 18000, total: qty * unitPrice + 18000 }; }
  async saveInquiry(payload) {
    const inquiry = { id: uid('inquiry'), createdAt: new Date().toISOString(), status: 'saved', ...payload, quantity: validateQuantity(payload?.quantity ?? 50) };
    const inquiries = readJson(this.config.storageKeys.inquiries, []); inquiries.unshift(inquiry); inquiries.length = Math.min(inquiries.length, this.config.storageLimits?.inquiries || 50);
    if (!writeJson(this.config.storageKeys.inquiries, inquiries)) throw new Error('問い合わせ内容の保存容量が不足しています。古い保存データを削除してから再度お試しください。'); return inquiry;
  }
}

window.KariyushiApiClient = KariyushiApiClient;
