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
    
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable"
    });
    document = dom.window.document;
  });

  it("should render application header and branding", () => {
    const brandTitle = document.querySelector(".brand-title");
    expect(brandTitle).toBeTruthy();
    expect(brandTitle.textContent).toBe("Kariyushi Custom Studio");
  });

  it("should contain all design steps section in navigation", () => {
    const stepLinks = document.querySelectorAll(".step-nav .step-link");
    expect(stepLinks.length).toBe(6);
    expect(stepLinks[0].textContent).toContain("条件入力");
    expect(stepLinks[5].textContent).toContain("注文");
  });

  it("should render design brief form with scene selections", () => {
    const briefForm = document.getElementById("briefForm");
    expect(briefForm).toBeTruthy();

    const sceneGrid = document.querySelector('[data-name="scene"]');
    expect(sceneGrid).toBeTruthy();
    expect(sceneGrid.querySelectorAll(".choice").length).toBe(5);
  });

  it("should contain fabric 2D canvas element", () => {
    const canvas = document.getElementById("fabricCanvas");
    expect(canvas).toBeTruthy();
  });

  it("should render contact form with required fields", () => {
    const contactForm = document.getElementById("contactForm");
    expect(contactForm).toBeTruthy();
    expect(contactForm.querySelector('input[name="company"]')).toBeTruthy();
    expect(contactForm.querySelector('input[name="email"]')).toBeTruthy();
    expect(contactForm.querySelector('textarea[name="message"]')).toBeTruthy();
  });
});
