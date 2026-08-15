import { describe, it, expect, beforeEach, vi } from "vitest";

// LocalStorageモックのセットアップ
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    })
  };
})();

global.localStorage = localStorageMock;

describe("KariyushiApiClient", () => {
  let client;
  let mockConfig;
  let mockSeed;

  beforeEach(async () => {
    localStorage.clear();
    
    global.window = global.window || {};
    
    // config と seed、api-client の読み込み
    await import("../../scripts/config.js");
    await import("../../scripts/mock-db.js");
    await import("../../scripts/api-client.js");

    mockConfig = global.window.KariyushiConfig;
    mockSeed = global.window.KariyushiSeed;

    client = new global.window.KariyushiApiClient(mockConfig, mockSeed);
  });

  it("should fetch catalog properly", async () => {
    const catalog = await client.getCatalog();
    expect(catalog.palettes).toBeDefined();
    expect(catalog.patterns).toBeDefined();
  });

  it("should create a design session and write to localStorage", async () => {
    const brief = {
      scene: "ホテル・店舗制服",
      mood: "上品",
      palette: "海風ブルー",
      motif: "AIに任せる",
      quantity: 50
    };
    const session = await client.createDesignSession(brief);
    expect(session.id).toContain("session_");
    expect(session.status).toBe("draft");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("should generate design proposals based on session details", async () => {
    const brief = {
      scene: "ホテル・店舗制服",
      mood: "上品",
      palette: "海風ブルー",
      motif: "AIに任せる",
      quantity: 50
    };
    const response = await client.generateDesigns("test_session_id", brief);
    expect(response.sessionId).toBe("test_session_id");
    expect(response.proposals.length).toBe(3); // A, B, C案
    expect(response.proposals[0].palette).toBe("海風ブルー");
  });

  it("should calculate correct estimate", async () => {
    const est50 = await client.createEstimate(50);
    expect(est50.unitPrice).toBe(8600);
    expect(est50.total).toBe(50 * 8600 + 18000); // 単価 * 数量 + サンプル費

    const est200 = await client.createEstimate(200);
    expect(est200.unitPrice).toBe(6900); // ボリュームディスカウント
    expect(est200.items.length).toBeGreaterThan(0);
    expect(est200.discount).toBeGreaterThan(0);
    expect(est200.isEstimate).toBe(true);
  });

  it("should validate, recalculate and save an inquiry", async () => {
    const inquiry = await client.saveInquiry({
      requestKey: "request-001",
      configuration: { quantity: 50, sleeveType: "short", fabricId: "standard" },
      estimatedPrice: 1,
      customer: {
        name: " 沖縄 太郎 ",
        email: "TARO@EXAMPLE.COM",
        note: "制服の見積もりをお願いします。"
      }
    });

    expect(inquiry.status).toBe("new");
    expect(inquiry.customer.name).toBe("沖縄 太郎");
    expect(inquiry.customer.email).toBe("taro@example.com");
    expect(inquiry.estimatedPrice).toBe(50 * 8600 + 18000);
    expect(inquiry.estimatedPrice).not.toBe(1);
  });

  it("should reject invalid inquiry input", async () => {
    await expect(client.saveInquiry({
      configuration: { quantity: 50 },
      customer: { name: "", email: "invalid", note: "" }
    })).rejects.toThrow("お名前を入力してください");
  });

  it("should return the existing inquiry for the same request key", async () => {
    const payload = {
      requestKey: "request-double-submit",
      configuration: { quantity: 10 },
      customer: {
        name: "沖縄 花子",
        email: "hanako@example.com",
        note: "同じ内容を二重保存しないでください。"
      }
    };

    const first = await client.saveInquiry(payload);
    const second = await client.saveInquiry(payload);
    const stored = JSON.parse(localStorage.getItem(mockConfig.storageKeys.inquiries));

    expect(second.id).toBe(first.id);
    expect(stored).toHaveLength(1);
  });
});
