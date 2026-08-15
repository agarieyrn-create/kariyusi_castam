// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

describe("KariyushiTryOn integration", () => {
  it("configuration sync, CSS fallback, and preview capture keep working without 3D", async () => {
    document.body.innerHTML = `
      <section id="tryon">
        <div id="tryonCanvasWrap"><canvas id="tryonCanvas"></canvas></div>
        <span id="tryonSummaryPattern"></span>
        <span id="tryonSummaryModel"></span>
        <span id="tryonSummarySize"></span>
        <button data-tryon-model="male"></button>
        <button data-tryon-model="female"></button>
        <button data-tryon-pattern="stripe"></button>
        <button data-tryon-pattern="botanical"></button>
        <button data-tryon-view="front"></button>
        <button data-tryon-spin></button>
        <select id="tryonSize"><option>S</option><option>M</option><option>L</option><option>LL</option></select>
        <input id="tryonScale" value="100">
      </section>`;

    globalThis.requestAnimationFrame = vi.fn(() => 1);
    globalThis.cancelAnimationFrame = vi.fn();
    window.KariyushiStore = { setPreviewImageUrl: vi.fn() };
    await import("../../scripts/tryon-studio.js");

    window.dispatchEvent(new CustomEvent("kariyushi:configurationchange", {
      detail: {
        configuration: {
          gender: "womens",
          baseColor: "#0f766e",
          patternId: "hibiscus-botanical",
          size: "XL",
          logo: {
            imageUrl: "data:image/png;base64,AA==",
            position: "rightChest",
            scale: 1.2,
            rotation: 8,
          },
        },
      },
    }));

    const state = window.KariyushiTryOn.getState();
    const shirt = document.getElementById("cssTryonShirt");
    expect(state.model).toBe("female");
    expect(state.pattern).toBe("botanical");
    expect(state.size).toBe("LL");
    expect(shirt.style.backgroundColor).toBe("rgb(15, 118, 110)");
    expect(shirt.querySelector(".shirt-logo img")?.src).toMatch(/^data:image\/png/);

    window.dispatchEvent(new CustomEvent("kariyushi:viewererror", {
      detail: { error: new Error("context lost") },
    }));
    expect(document.getElementById("tryonCanvasWrap").dataset.previewMode).toBe("css-fallback");
    expect(document.querySelector(".tryon-fallback-status").hidden).toBe(false);

    const directCapture = await window.KariyushiTryOn.capturePreview();
    expect(directCapture.source).toBe("css-fallback");
    expect(directCapture.dataUrl).toMatch(/^data:image\/svg\+xml/);
    expect(window.KariyushiStore.setPreviewImageUrl).toHaveBeenCalledWith(directCapture.dataUrl);

    const response = new Promise((resolve) => {
      window.addEventListener("kariyushi:previewcapture", (event) => resolve(event.detail), { once: true });
    });
    window.dispatchEvent(new CustomEvent("kariyushi:previewcapturerequest", {
      detail: { requestId: "preview-1" },
    }));
    await expect(response).resolves.toMatchObject({
      requestId: "preview-1",
      source: "css-fallback",
    });
  });
});
