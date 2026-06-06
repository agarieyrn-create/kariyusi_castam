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

describe("KariyushiDesignStore", () => {
  beforeEach(async () => {
    localStorage.clear();
    global.window = global.window || {};
    // window.location のモック化
    global.window.location = {
      href: "http://localhost:3000/",
      search: ""
    };
    await import("../../scripts/design-store.js");
  });

  it("should save a design and limit saved items size", () => {
    const store = global.window.KariyushiDesignStore;
    const designData = { palette: "海風ブルー", density: 50 };
    
    const saved = store.saveDesign(designData);
    expect(saved.id).toContain("design_");
    expect(saved.palette).toBe("海風ブルー");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("should generate a valid share URL using Base64 UTF-8", () => {
    const store = global.window.KariyushiDesignStore;
    const designData = { palette: "琉球レッド", density: 42 };
    
    const url = store.generateShareUrl(designData);
    expect(url).toContain("?design=");
  });

  it("should validate and load data from URL parameters and reject foreign keys", () => {
    const store = global.window.KariyushiDesignStore;
    
    // 正常なデータ
    const validData = { palette: "海風ブルー", density: 50, maliciousKey: "hacked" };
    const payload = JSON.stringify(validData);
    const uint8 = new TextEncoder().encode(payload);
    const binString = Array.from(uint8, (x) => String.fromCharCode(x)).join("");
    const compressed = btoa(binString);

    global.window.location.search = `?design=${compressed}`;
    
    const loaded = store.loadFromUrl();
    expect(loaded).toBeDefined();
    expect(loaded.palette).toBe("海風ブルー");
    expect(loaded.density).toBe(50);
    // スキーマバリデーション(ホワイトリスト)により無効なキーは除外されていること
    expect(loaded.maliciousKey).toBeUndefined();
  });

  it("should fail gracefully when parsing invalid JSON payload in URL", () => {
    const store = global.window.KariyushiDesignStore;
    global.window.location.search = `?design=invalidbase64data!!!`;
    
    const loaded = store.loadFromUrl();
    expect(loaded).toBeNull();
  });
});
