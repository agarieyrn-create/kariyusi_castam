import { describe, it, expect, beforeEach } from "vitest";

describe("KariyushiConfig", () => {
  beforeEach(async () => {
    // グローバルのモック設定
    global.window = global.window || {};
    await import("../../scripts/config.js");
  });

  it("should define global window.KariyushiConfig", () => {
    expect(global.window.KariyushiConfig).toBeDefined();
  });

  it("should have correct default configuration properties", () => {
    const config = global.window.KariyushiConfig;
    expect(config.mode).toBe("mock");
    expect(config.storageKeys.sessions).toBe("kariyushi-design-sessions");
    expect(config.upload.allowedLogoTypes).toContain("image/png");
    expect(config.defaultBrief.quantity).toBe(50);
    expect(config.storageKeys.configuration).toBe("kariyushi-configuration");
    expect(config.priceRules.quantityUnitPrices).toHaveLength(3);
  });
});
