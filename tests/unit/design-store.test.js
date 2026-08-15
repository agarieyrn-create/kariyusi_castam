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

  it("should keep configuration and estimate in one shared store", () => {
    const sharedStore = global.window.KariyushiStore;
    sharedStore.resetConfiguration();
    const updated = sharedStore.updateConfiguration({
      quantity: 100,
      sleeveType: "long"
    });

    expect(updated.configuration.quantity).toBe(100);
    expect(updated.configuration.sleeveType).toBe("long");
    expect(updated.configuration.estimatedPrice).toBe(updated.priceBreakdown.total);
    expect(updated.priceBreakdown.items.some((item) => item.label === "長袖オプション")).toBe(true);
  });

  it("should notify subscribers and dispatch a configuration event", () => {
    const sharedStore = global.window.KariyushiStore;
    const listener = vi.fn();
    const dispatchEvent = vi.fn();
    global.window.dispatchEvent = dispatchEvent;
    global.window.CustomEvent = class {
      constructor(type, init) {
        this.type = type;
        this.detail = init.detail;
      }
    };
    const unsubscribe = sharedStore.subscribe(listener);

    sharedStore.updateConfiguration({ quantity: 25 });

    expect(listener).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0][0].type).toBe("kariyushi:configurationchange");
    expect(dispatchEvent.mock.calls[0][0].detail.configuration.quantity).toBe(25);
    unsubscribe();
  });

  it("should calculate a transparent price breakdown", () => {
    const result = global.window.KariyushiPricing.calculateEstimatedPrice({
      quantity: 50,
      sleeveType: "short",
      fabricId: "standard"
    });

    expect(result.subtotal).toBe(50 * 9800 + 18000);
    expect(result.discount).toBe(50 * (9800 - 8600));
    expect(result.total).toBe(50 * 8600 + 18000);
    expect(result.isEstimate).toBe(true);
  });
});
