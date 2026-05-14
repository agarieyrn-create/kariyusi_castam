import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function mustExist(relativePath, label = relativePath) {
  if (!existsSync(join(root, relativePath))) errors.push(`${label} が見つかりません: ${relativePath}`);
}

const html = read("index.html");
const scriptFiles = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
const stylesheetFiles = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map((match) => match[1]);

for (const file of [...scriptFiles, ...stylesheetFiles]) {
  if (!/^https?:\/\//.test(file)) mustExist(file, "HTML参照ファイル");
}

const mockDb = read("scripts/mock-db.js");
const assetFiles = [...mockDb.matchAll(/asset\("[^"]+",\s*"([^"]+)"/g)].map((match) => match[1]);
for (const file of assetFiles) {
  mustExist(join("デザイン写真", file), "素材画像");
}

const renderers = read("scripts/renderers.js");
if (!renderers.includes('loading="${loading}"') || !renderers.includes("load-more-assets")) {
  errors.push("画像遅延ロードまたは追加読み込みの実装が見つかりません。");
}

const fabricEditor = read("scripts/fabric-editor.js");
if (!fabricEditor.includes("allowedLogoTypes") || !fabricEditor.includes("maxLogoBytes")) {
  errors.push("ロゴアップロードの形式・容量制限が見つかりません。");
}

if (!/id="logoUpload"[^>]+accept="image\/png,image\/jpeg,image\/webp"/.test(html)) {
  errors.push("ロゴアップロードinputのaccept属性が安全な画像形式に限定されていません。");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Smoke test passed: ${scriptFiles.length} scripts, ${assetFiles.length} assets checked.`);
