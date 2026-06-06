(function () {
  "use strict";

  const yen = new Intl.NumberFormat("ja-JP");
  const logoLabels = { leftChest: "左胸", sleeve: "袖", back: "背面", none: "なし" };
  const laneLabels = {
    uniform: "Atelier Uniform",
    resort: "Resort Showcase",
    heritage: "Heritage Signature"
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function assetUrl(config, asset) {
    return encodeURI(`${config.assetBaseUrl}${asset.file}`);
  }

  function imageAttrs(asset, config, options = {}) {
    const loading = options.eager ? "eager" : "lazy";
    const priority = options.eager ? "high" : "low";
    return `src="${esc(assetUrl(config, asset))}" alt="${esc(asset.title)}" loading="${loading}" decoding="async" fetchpriority="${priority}"`;
  }

  function findAsset(assets, id) {
    return assets?.find((item) => item.id === id) || null;
  }

  function buttonColor(name) {
    if (name === "白蝶貝風") return "#f6f0df";
    if (name === "木目風") return "#8b5c36";
    return "#263134";
  }

  function uid(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Math.random().toString(16).slice(2)}`;
  }

  function normalizeAngle(value) {
    return ((Number(value) || 0) % 360 + 360) % 360;
  }

  /* ── Rich Fabric Pattern Defs ── */
  function fabricDefs(ids, palette, density, scale, asset) {
    const tile = Math.max(68, Number(density) * 1.9);
    const assetHref = asset?.type === "motif" ? asset.href : "";
    const image = assetHref
      ? `<image href="${esc(assetHref)}" x="${tile * .12}" y="${tile * .1}" width="${tile * .5}" height="${tile * .5}" preserveAspectRatio="xMidYMid meet" opacity=".32"></image>`
      : "";
    return `
      <linearGradient id="${ids.shadow}" x1="0" x2="1">
        <stop offset="0" stop-color="#000" stop-opacity=".16"></stop>
        <stop offset=".18" stop-color="#fff" stop-opacity=".12"></stop>
        <stop offset=".55" stop-color="#fff" stop-opacity=".18"></stop>
        <stop offset="1" stop-color="#000" stop-opacity=".13"></stop>
      </linearGradient>
      <pattern id="${ids.fabric}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="scale(${scale})">
        <rect width="${tile}" height="${tile}" fill="${palette.base}"></rect>
        ${image}
        <!-- hibiscus-like flower -->
        <g opacity=".82">
          <ellipse cx="${tile*.38}" cy="${tile*.32}" rx="${tile*.1}" ry="${tile*.18}" fill="${palette.accent}" transform="rotate(-20 ${tile*.38} ${tile*.32})"></ellipse>
          <ellipse cx="${tile*.38}" cy="${tile*.32}" rx="${tile*.1}" ry="${tile*.18}" fill="${palette.accent}" transform="rotate(52 ${tile*.38} ${tile*.32})"></ellipse>
          <ellipse cx="${tile*.38}" cy="${tile*.32}" rx="${tile*.1}" ry="${tile*.18}" fill="${palette.accent}" transform="rotate(124 ${tile*.38} ${tile*.32})"></ellipse>
          <ellipse cx="${tile*.38}" cy="${tile*.32}" rx="${tile*.1}" ry="${tile*.18}" fill="${palette.accent}" transform="rotate(-92 ${tile*.38} ${tile*.32})"></ellipse>
          <ellipse cx="${tile*.38}" cy="${tile*.32}" rx="${tile*.1}" ry="${tile*.18}" fill="${palette.accent}" transform="rotate(196 ${tile*.38} ${tile*.32})"></ellipse>
          <circle cx="${tile*.38}" cy="${tile*.32}" r="${tile*.05}" fill="${palette.sub}" opacity=".95"></circle>
        </g>
        <!-- leaf shapes -->
        <path d="M${tile*.06} ${tile*.68} C${tile*.18} ${tile*.48}, ${tile*.34} ${tile*.44}, ${tile*.5} ${tile*.52} C${tile*.34} ${tile*.56}, ${tile*.2} ${tile*.62}, ${tile*.06} ${tile*.68}Z" fill="${palette.dark}" opacity=".65"></path>
        <path d="M${tile*.54} ${tile*.72} C${tile*.64} ${tile*.56}, ${tile*.78} ${tile*.52}, ${tile*.92} ${tile*.58} C${tile*.8} ${tile*.64}, ${tile*.66} ${tile*.7}, ${tile*.54} ${tile*.72}Z" fill="${palette.dark}" opacity=".55"></path>
        <!-- wave curves -->
        <path d="M${tile*.02} ${tile*.88} Q${tile*.25} ${tile*.76} ${tile*.5} ${tile*.88} Q${tile*.75} ${tile*1} ${tile*.98} ${tile*.88}" fill="none" stroke="${palette.accent}" stroke-width="2.8" opacity=".42"></path>
        <!-- small accents -->
        <circle cx="${tile*.72}" cy="${tile*.22}" r="${tile*.035}" fill="${palette.sub}" opacity=".85"></circle>
        <circle cx="${tile*.82}" cy="${tile*.38}" r="${tile*.025}" fill="${palette.sub}" opacity=".7"></circle>
      </pattern>`;
  }

  /* ── Shirt SVG Parts ── */
  function shirtParts(proposal, palettes, edit, options = {}) {
    const palette = palettes[edit.palette] || palettes[proposal.palette];
    const density = Number(edit.density || proposal.density || 46);
    const scale = Number(edit.scale || proposal.scale || 100) / 100;
    const asset = findAsset(options.assets, edit.assetId || proposal.assetId);
    const fabricAsset = asset && options.config ? { ...asset, href: assetUrl(options.config, asset) } : null;
    const ids = { fabric: uid("fabric"), shadow: uid("clothShade") };
    const logo = edit.logo || proposal.logo;
    const collar = edit.collar || proposal.collar;
    const button = buttonColor(edit.button || proposal.button);
    const back = Boolean(options.back);
    const logoMarkup = {
      leftChest: '<text x="168" y="145" text-anchor="middle" class="svg-logo">LOGO</text>',
      sleeve: '<text x="222" y="140" text-anchor="middle" class="svg-logo small">LOGO</text>',
      back: "",
      none: ""
    }[logo] || "";
    const collarMarkup = back
      ? '<path d="M105 57 Q140 78 175 57 L181 76 Q140 99 99 76 Z" class="shirt-collar back"></path>'
      : collar === "スタンドカラー"
        ? '<path d="M111 54 Q140 70 169 54 L174 82 Q140 101 106 82 Z" class="shirt-collar"></path>'
        : '<path d="M106 52 L140 96 L91 101 Z M174 52 L140 96 L189 101 Z" class="shirt-collar aloha"></path>';
    const frontDetails = back ? "" : `
      <path class="shirt-seam placket" d="M140 96 L140 299"></path>
      <path class="shirt-pocket" d="M162 139 L190 145 L188 183 L160 177 Z"></path>
      <circle cx="151" cy="123" r="4.4" fill="${button}"></circle>
      <circle cx="151" cy="161" r="4.4" fill="${button}"></circle>
      <circle cx="151" cy="199" r="4.4" fill="${button}"></circle>
      <circle cx="151" cy="237" r="4.4" fill="${button}"></circle>`;
    const backDetails = back ? `
      <path class="shirt-yoke" d="M92 94 Q140 118 188 94"></path>
      <path class="shirt-seam subtle" d="M140 96 L140 294"></path>` : "";

    return `
      <defs>${fabricDefs(ids, palette, density, scale, fabricAsset)}</defs>
      <path class="shirt-drop" d="M64 78 L109 49 L124 62 Q140 75 156 62 L171 49 L216 78 L266 146 L221 176 L206 152 L203 296 Q170 308 140 304 Q110 308 77 296 L74 152 L59 176 L14 146 Z"></path>
      <path class="shirt-panel sleeve-left" d="M64 78 L109 49 L99 112 L59 176 L14 146 Z" fill="url(#${ids.fabric})"></path>
      <path class="shirt-panel sleeve-right" d="M216 78 L171 49 L181 112 L221 176 L266 146 Z" fill="url(#${ids.fabric})"></path>
      <path class="shirt-panel body-left" d="M109 49 L140 96 L140 304 Q108 306 77 296 L74 152 L99 112 Z" fill="url(#${ids.fabric})"></path>
      <path class="shirt-panel body-right" d="M171 49 L140 96 L140 304 Q172 306 203 296 L206 152 L181 112 Z" fill="url(#${ids.fabric})"></path>
      <path class="cloth-shade" d="M64 78 L109 49 L124 62 Q140 75 156 62 L171 49 L216 78 L266 146 L221 176 L206 152 L203 296 Q170 308 140 304 Q110 308 77 296 L74 152 L59 176 L14 146 Z" fill="url(#${ids.shadow})"></path>
      ${collarMarkup}
      <path class="shirt-seam" d="M74 152 L99 112 M206 152 L181 112"></path>
      ${frontDetails}
      ${backDetails}
      <path class="shirt-hem" d="M79 294 Q110 305 140 301 Q170 305 201 294 M23 145 L58 166 M257 145 L222 166"></path>
      ${back ? logo === "none" ? "" : '<text x="140" y="136" text-anchor="middle" class="svg-logo">LOGO</text>' : logoMarkup}`;
  }

  function shirtSvg(proposal, palettes, edit, options = {}) {
    return `
      <svg class="shirt-svg" viewBox="0 0 280 320" role="img" aria-label="${esc(proposal.title)}">
        ${shirtParts(proposal, palettes, edit, options)}
      </svg>`;
  }

  /* ── Render Functions ── */
  function renderHero(targets, proposal, palettes, edit, fit, assets, config) {
    targets.preview.innerHTML = shirtSvg(proposal, palettes, edit, { assets, config });
    const palette = palettes[edit.palette];
    targets.swatches.innerHTML = [palette.base, palette.accent, palette.sub, palette.dark]
      .map((color) => `<span style="--swatch:${color}"></span>`)
      .join("");
    targets.size.textContent = fit.recommendedSize;
    targets.fit.textContent = fit.message;
  }

  function renderProposals(target, proposals, selectedId, palettes, config, assets) {
    target.innerHTML = proposals.map((proposal) => {
      const asset = findAsset(assets, proposal.assetId);
      const score = designScore(proposal, proposal);
      const isSelected = proposal.id === selectedId;
      return `
        <article class="proposal-card ${isSelected ? "selected" : ""}">
          <div class="proposal-visual">
            <div class="proposal-shirt">${shirtSvg(proposal, palettes, proposal, { assets, config })}</div>
            ${asset ? `<img ${imageAttrs(asset, config)} width="104" height="240">` : ""}
          </div>
          <div class="proposal-copy">
            <span class="proposal-badge">${esc(laneLabels[proposal.lane] || "Signature Concept")}</span>
            <h3>${esc(proposal.title)}</h3>
            <p>${esc(proposal.direction)}</p>
            <div class="tags">${proposal.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
            <div class="proposal-score" aria-label="提案スコア">
              <span><b>沖縄らしさ</b><i style="--score:${score.okinawa}%"></i><strong>${score.okinawa}</strong></span>
              <span><b>量産適性</b><i style="--score:${score.production}%"></i><strong>${score.production}</strong></span>
              <span><b>視認性</b><i style="--score:${score.visibility}%"></i><strong>${score.visibility}</strong></span>
            </div>
          </div>
          <button class="button ${isSelected ? "primary aurora" : "secondary ghost-lux"} wide select-proposal" type="button" data-id="${esc(proposal.id)}">${isSelected ? "選択中の案" : "この案を編集する"}</button>
        </article>`;
    }).join("");
  }

  function renderAssets(target, assets, config, selectedAssetId, options = {}) {
    const limit = Math.max(1, Number(options.limit) || assets.length);
    const selectedAsset = findAsset(assets, selectedAssetId);
    const visible = assets.slice(0, limit);
    if (selectedAsset && !visible.some((asset) => asset.id === selectedAsset.id)) visible.push(selectedAsset);
    const hiddenCount = Math.max(0, assets.length - limit);
    target.innerHTML = visible.map((asset) => `
      <button class="asset-card ${asset.id === selectedAssetId ? "selected" : ""}" type="button" data-id="${esc(asset.id)}" data-type="${esc(asset.type)}">
        <img ${imageAttrs(asset, config)} width="180" height="180">
        <b>${asset.type === "motif" ? "柄素材" : "参考写真"}</b>
        <span>${esc(asset.title)}</span>
        <small>${asset.tags.map(esc).join(" / ")}</small>
      </button>
    `).join("") + (hiddenCount > 0 ? `
      <button class="load-more-assets" type="button" data-next-limit="${limit + (options.pageSize || 24)}">
        <strong>さらに表示</strong>
        <span>残り ${hiddenCount} 点の素材を読み込む</span>
      </button>
    ` : "");
  }

  function renderEditor(target, proposal, palettes, edit, assets, config) {
    const asset = findAsset(assets, edit.assetId);
    target.innerHTML = `
      <div class="editor-canvas">
        <div class="shirt-front">${shirtSvg(proposal, palettes, edit, { assets, config })}</div>
        <div class="reference-tile">
          ${asset ? `<img ${imageAttrs(asset, config, { eager: true })} width="190" height="253">` : ""}
          <span>反映中の参考画像</span>
        </div>
      </div>`;
  }

  function fitAnalysis(model, sizeTable) {
    const sizes = Object.keys(sizeTable);
    const recommendedSize = sizes.find((size) => {
      const spec = sizeTable[size];
      return spec.chest - model.chest >= 12 && spec.shoulder - model.shoulder >= 1;
    }) || sizes[sizes.length - 1];
    const selected = sizeTable[model.size];
    const chestEase = selected.chest - model.chest;
    const shoulderEase = selected.shoulder - model.shoulder;
    const lengthTarget = Math.round(model.height * 0.43);
    const lengthDiff = selected.length - lengthTarget;
    const score = Math.max(0, Math.min(100, 72 + chestEase * 1.5 + shoulderEase * 4 - Math.abs(lengthDiff) * 2));
    let message = "標準的なゆとり";
    if (chestEase < 8 || shoulderEase < 0) message = "ややタイト";
    if (chestEase > 24) message = "かなりゆったり";
    return { selected, recommendedSize, chestEase, shoulderEase, lengthDiff, score: Math.round(score), message };
  }

  function designScore(proposal, edit) {
    const density = Number(edit.density || proposal.density || 46);
    const okinawa = Math.min(100, 58 + proposal.pattern.okinawa * 8);
    const production = Math.max(62, Math.min(98, 104 - Math.abs(density - 48) * 1.2));
    const visibility = Math.max(58, Math.min(98, 76 + proposal.pattern.bold * 5 - Math.abs(density - 44) * .5));
    return {
      okinawa: Math.round(okinawa),
      production: Math.round(production),
      visibility: Math.round(visibility)
    };
  }

  /* ── SVG Mannequin Model (restored & improved) ── */
  function renderModelSVG(target, proposal, palettes, edit, model, sizeTable, assets, config) {
    const fit = fitAnalysis(model, sizeTable);
    const rotation = normalizeAngle(model.rotation ?? { front: 0, side: 90, back: 180 }[model.view]);
    const radians = rotation * Math.PI / 180;
    const sideAmount = Math.abs(Math.sin(radians));
    const xScale = Math.max(.52, Math.abs(Math.cos(radians)) * .78 + .18);
    const back = rotation > 90 && rotation < 270;
    const torsoWidth = { slim: 118, normal: 138, strong: 164 }[model.body] + (model.chest - 92) * 1.05;
    const waistWidth = Math.max(86, model.waist * 1.08);
    const shirtScale = fit.selected.chest / 112;
    const shirtY = 142 - Math.max(-8, Math.min(10, (model.height - 170) * .25));
    const viewBox = "190 70 410 520";
    const bodyTransform = `translate(380 70) scale(${xScale} 1)`;
    const shirtTransform = `translate(${380 - 140 * shirtScale * xScale} ${shirtY}) scale(${shirtScale * xScale} ${shirtScale})`;
    const measureOpacity = Math.max(.22, 1 - sideAmount * .72);

    target.innerHTML = `
      <svg class="model-svg" viewBox="${viewBox}" role="img" aria-label="着用模型" data-rotation="${rotation}">
        <defs>
          <linearGradient id="skinGrad" x1="0" x2="1">
            <stop offset="0" stop-color="#b98059"></stop>
            <stop offset=".52" stop-color="#d2a074"></stop>
            <stop offset="1" stop-color="#b77d56"></stop>
          </linearGradient>
          <filter id="modelShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#173034" flood-opacity=".16"></feDropShadow>
          </filter>
        </defs>
        <ellipse cx="380" cy="594" rx="${120 * xScale + 38}" ry="17" class="turntable-shadow"></ellipse>
        <g class="rotation-hud">
          <text x="522" y="102">${Math.round(rotation)}°</text>
          <text x="522" y="124">ドラッグで回転</text>
        </g>
        <g class="measure-lines" opacity="${measureOpacity.toFixed(2)}">
          <line x1="${380 - fit.selected.shoulder * 2.45}" y1="170" x2="${380 + fit.selected.shoulder * 2.45}" y2="170" class="measure shoulder"></line>
          <text x="${380 + fit.selected.shoulder * 2.45 + 12}" y="174">肩幅 ${fit.selected.shoulder}cm</text>
          <line x1="${380 - fit.selected.chest * 1.08}" y1="286" x2="${380 + fit.selected.chest * 1.08}" y2="286" class="measure chest"></line>
          <text x="${380 + fit.selected.chest * 1.08 + 12}" y="290">身幅 ${Math.round(fit.selected.chest / 2)}cm</text>
          <line x1="214" y1="${shirtY + 18}" x2="214" y2="${shirtY + fit.selected.length * 3.25}" class="measure length"></line>
          <text x="224" y="${shirtY + 46}">着丈 ${fit.selected.length}cm</text>
        </g>
        <g filter="url(#modelShadow)" transform="${bodyTransform}">
          <ellipse cx="0" cy="42" rx="43" ry="52" fill="url(#skinGrad)"></ellipse>
          <path d="M${-torsoWidth / 2} 134 C${-torsoWidth / 2 - 22} 205, ${-waistWidth / 2 - 12} 305, ${-waistWidth / 2} 386 L${waistWidth / 2} 386 C${waistWidth / 2 + 12} 305, ${torsoWidth / 2 + 22} 205, ${torsoWidth / 2} 134 C${torsoWidth / 2 - 36} 102, ${-torsoWidth / 2 + 36} 102, ${-torsoWidth / 2} 134 Z" fill="url(#skinGrad)"></path>
          <path d="M${-torsoWidth / 2 - 8} 156 C${-torsoWidth / 2 - 72} 210, ${-torsoWidth / 2 - 66} 326, ${-torsoWidth / 2 - 28} 378" fill="none" stroke="url(#skinGrad)" stroke-width="42" stroke-linecap="round"></path>
          <path d="M${torsoWidth / 2 + 8} 156 C${torsoWidth / 2 + 72} 210, ${torsoWidth / 2 + 66} 326, ${torsoWidth / 2 + 28} 378" fill="none" stroke="url(#skinGrad)" stroke-width="42" stroke-linecap="round"></path>
          <path d="M-38 382 C-54 438, -58 526, -52 582" fill="none" stroke="url(#skinGrad)" stroke-width="44" stroke-linecap="round"></path>
          <path d="M38 382 C54 438, 58 526, 52 582" fill="none" stroke="url(#skinGrad)" stroke-width="44" stroke-linecap="round"></path>
        </g>
        <g class="model-shirt-svg" transform="${shirtTransform}">
          ${shirtParts(proposal, palettes, edit, { back, assets, config })}
        </g>
      </svg>`;
    return fit;
  }

  function renderFitReport(target, model, fit) {
    const easeClass = fit.chestEase < 8 ? "tight" : fit.chestEase > 24 ? "loose" : "good";
    target.innerHTML = `
      <div class="fit-score">
        <span>フィット判定</span>
        <strong>${fit.score}</strong>
      </div>
      <dl>
        <div><dt>推奨サイズ</dt><dd>${fit.recommendedSize}</dd></div>
        <div><dt>胸まわりのゆとり</dt><dd class="${easeClass}">${fit.chestEase > 0 ? "+" : ""}${fit.chestEase}cm</dd></div>
        <div><dt>肩幅の余裕</dt><dd>${fit.shoulderEase > 0 ? "+" : ""}${fit.shoulderEase}cm</dd></div>
        <div><dt>着丈差</dt><dd>${fit.lengthDiff > 0 ? "+" : ""}${fit.lengthDiff}cm</dd></div>
      </dl>
      <p class="${fit.message === "ややタイト" ? "warning" : ""}">${fit.message}です。迷う場合は推奨サイズを基準にしてください。</p>`;
  }

  function renderDesignNotes(target, proposal, edit, assets) {
    const asset = findAsset(assets, edit.assetId || proposal.assetId);
    const score = designScore(proposal, edit);
    const laneNarrative = {
      uniform: "遠目には整い、近づくほど沖縄らしさが伝わる“制服向けの静かな華やぎ”を狙う方向です。",
      resort: "写真映えと軽やかさを優先し、リゾートらしい解放感を前面に出す方向です。",
      heritage: "記念品や周年案件にも耐える、伝統要素を主役にしたシグネチャー方向です。"
    };
    target.innerHTML = `
      <strong>現在の設計メモ</strong>
      <p class="note-story">${esc(laneNarrative[proposal.lane] || "ブランド感と実用性を両立する方向で設計しています。")} 参考素材は <b>${esc(asset?.title || "未選択")}</b> を基点に反映中です。</p>
      <ul>
        <li>案：${esc(proposal.title)}</li>
        <li>柄：${esc(proposal.pattern.name)} / 参考：${esc(asset?.title || "未選択")}</li>
        <li>密度 ${esc(edit.density)} / 拡大率 ${esc(edit.scale)}%</li>
        <li>衿：${esc(edit.collar)} / ロゴ：${esc(logoLabels[edit.logo] || edit.logo)}</li>
      </ul>
      <div class="quality-grid">
        <div><span>沖縄らしさ</span><strong>${score.okinawa}</strong></div>
        <div><span>量産適性</span><strong>${score.production}</strong></div>
        <div><span>視認性</span><strong>${score.visibility}</strong></div>
      </div>`;
  }

  function renderSpec(target, proposal, brief, edit, fit, estimate) {
    const designId = `KD-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-001`;
    target.innerHTML = `
      <div class="spec-header">
        <div class="spec-id">
          <span class="spec-label">Design ID</span>
          <strong>${designId}</strong>
        </div>
        <div class="spec-id" style="text-align:right">
          <span class="spec-label">Date</span>
          <strong>${new Date().toLocaleDateString("ja-JP")}</strong>
        </div>
      </div>
      <div class="spec-hero">
        <span class="proposal-badge">Final Specification</span>
        <h3>${esc(proposal.title)}</h3>
        <p>用途 <b>${esc(brief.scene)}</b> に合わせて、<b>${esc(edit.palette)}</b> と <b>${esc(proposal.pattern.name)}</b> を軸に設計した最終候補です。</p>
      </div>
      <div class="spec-grid">
        <div class="spec-block">
          <span>デザイン条件</span>
          <strong>${esc(brief.mood)} / ${esc(brief.motif)}</strong>
          <small>編集時にさらに柄密度とロゴ配置を調整可能</small>
        </div>
        <div class="spec-block">
          <span>ディテール</span>
          <strong>${esc(edit.collar)} ・ ${esc(edit.button)}</strong>
          <small>ロゴ位置 ${esc(logoLabels[edit.logo] || edit.logo)}</small>
        </div>
        <div class="spec-block">
          <span>フィット確認</span>
          <strong>推奨 ${esc(fit.recommendedSize)}</strong>
          <small>胸ゆとり ${fit.chestEase > 0 ? "+" : ""}${fit.chestEase}cm / ${esc(fit.message)}</small>
        </div>
        <div class="spec-block">
          <span>概算</span>
          <strong>¥${yen.format(estimate.total)}</strong>
          <small>${estimate.quantity}枚・単価 ¥${yen.format(estimate.unitPrice)}</small>
        </div>
      </div>
      <div class="spec-row"><span>用途</span><strong>${esc(brief.scene)}</strong></div>
      <div class="spec-row"><span>選択案</span><strong>${esc(proposal.title)}</strong></div>
      <div class="spec-row"><span>柄・配色</span><strong>${esc(proposal.pattern.name)} / ${esc(edit.palette)}</strong></div>
      <div class="spec-row"><span>仕様</span><strong>${esc(edit.collar)}、${esc(edit.button)}、ロゴ ${esc(logoLabels[edit.logo] || edit.logo)}</strong></div>
      <div class="spec-row"><span>サイズ確認</span><strong>推奨 ${esc(fit.recommendedSize)} / 胸ゆとり ${fit.chestEase > 0 ? "+" : ""}${fit.chestEase}cm</strong></div>
      <div class="spec-row"><span>数量</span><strong>${estimate.quantity}枚</strong></div>
      <div class="spec-row spec-price"><span>概算</span><strong>単価 ¥${yen.format(estimate.unitPrice)} / 合計 ¥${yen.format(estimate.total)}</strong></div>
      <div class="production-flow">
        <span>AI提案</span><span>仕様調整</span><span>サンプル確認</span><span>本生産</span>
      </div>
      <p class="spec-note">概算にはサンプル作成費 ¥${yen.format(estimate.samplePrice)}を含みます。正式見積りには生地、プリント方式、縫製仕様の確認が必要です。</p>`;
  }

  /* ── Hybrid Model Renderer (3D priority, SVG fallback) ── */
  function renderModel(target, proposal, palettes, edit, model, sizeTable, assets, config) {
    const fit = fitAnalysis(model, sizeTable);
    if (typeof THREE !== "undefined" && window.KariyushiThreeViewer) {
      try {
        if (!target.querySelector("canvas.tryon-canvas")) {
          target.innerHTML = "";
        }
        const payload = { proposal, palettes, edit, model, fit, assets, config };
        window.KariyushiLatest3D = payload;
        window.dispatchEvent(new CustomEvent("kariyushi:render3d", { detail: payload }));
        return fit;
      } catch (err) {
        // 静かにフォールバック
      }
    }
    return renderModelSVG(target, proposal, palettes, edit, model, sizeTable, assets, config);
  }

  window.KariyushiRenderers = {
    renderHero,
    renderProposals,
    renderAssets,
    renderEditor,
    renderModel,
    renderFitReport,
    renderDesignNotes,
    renderSpec,
    fitAnalysis
  };
})();
