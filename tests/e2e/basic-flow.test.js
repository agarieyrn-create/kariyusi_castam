import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

describe("E2E Basic flow (JSDOM)", () => {
  let dom;
  let document;

  beforeEach(() => {
    const htmlPath = path.resolve(__dirname, "../../index.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
  });

  it("should render application header and branding", () => {
    const brandTitle = document.querySelector(".brand [data-company-name]");
    expect(brandTitle).toBeTruthy();
    expect(brandTitle.textContent).toContain("かりゆし");
    expect(document.querySelector('.site-nav a[href="#tryon"]')).toBeTruthy();
  });

  it("should contain the design-to-quotation steps", () => {
    const steps = document.querySelectorAll(".configurator-steps li");
    expect(steps.length).toBe(4);
    expect(steps[0].textContent).toContain("仕様を選ぶ");
    expect(steps[3].textContent).toContain("見積もり相談");
  });

  it("should render the shared configuration controls", () => {
    const configurator = document.getElementById("configuratorForm");
    expect(configurator).toBeTruthy();
    expect(configurator.querySelector('[data-config-field="gender"]')).toBeTruthy();
    expect(configurator.querySelector('[data-config-field="patternId"]')).toBeTruthy();
    expect(configurator.querySelector('[data-config-field="quantity"]')).toBeTruthy();
    expect(configurator.querySelectorAll("[data-config-field]").length).toBeGreaterThanOrEqual(12);
  });

  it("should contain preview and safe fallback elements", () => {
    const canvas = document.getElementById("tryonCanvas");
    expect(canvas).toBeTruthy();
    expect(document.getElementById("tryonFallback")).toBeTruthy();
    expect(document.getElementById("capturePreview")).toBeTruthy();
    expect(document.getElementById("logoUpload").accept).toBe("image/png,image/jpeg,image/webp");
  });

  it("should render contact form with required fields", () => {
    const contactForm = document.getElementById("contactForm");
    expect(contactForm).toBeTruthy();
    expect(contactForm.querySelector('input[name="company"]')).toBeTruthy();
    expect(contactForm.querySelector('input[name="email"]')).toBeTruthy();
    expect(contactForm.querySelector('textarea[name="message"]')).toBeTruthy();
    expect(contactForm.querySelector('input[name="privacyConsent"][required]')).toBeTruthy();
    expect(document.getElementById("configurationPayload")).toBeTruthy();
  });
});
