(function () {
  "use strict";

  const yen = new Intl.NumberFormat("ja-JP");
  const logoLabels = { leftChest: "左胸", sleeve: "袖", back: "背面", none: "なし" };

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

  function findAsset(assets, id) {
    return assets?.find((item) => item.id === id) || null;
  }

  function buttonColor(name) {
    if (name === "白蝶貝風") return "#f6f0df";
    if (name === "木目風") return "#8b5c36";
    return "#263134";
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(16).slice(2)}`;
  }

  function normalizeAngle(value) {
    return ((Number(value) || 0) % 360 + 360) % 360;
  }

  function fabricDefs(ids, palette, density, scale, asset) {
    const tile = Math.max(68, Number(density) * 1.9);
    const assetHref = asset?.type === "motif" ? asset.href : "";
    const image = assetHref
      ? `<image href="${esc(assetHref)}" x="${tile * .18}" y="${tile * .16}" width="${tile * .42}" height="${tile * .42}" preserveAspectRatio="xMidYMid meet" opacity=".28"></image>`
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
        <path d="M${tile * .1} ${tile * .68} C${tile * .28} ${tile * .42}, ${tile * .5} ${tile * .42}, ${tile * .72} ${tile * .68}" fill="none" stroke="${palette.accent}" stroke-width="4.2" opacity=".82"></path>
        <path d="M${tile * .18} ${tile * .62} C${tile * .23} ${tile * .5}, ${tile * .34} ${tile * .46}, ${tile * .46} ${tile * .5} C${tile * .36} ${tile * .58}, ${tile * .28} ${tile * .66}, ${tile * .22} ${tile * .78}" fill="${palette.dark}" opacity=".78"></path>
        <path d="M${tile * .64} ${tile * .18} C${tile * .82} ${tile * .2}, ${tile * .92} ${tile * .36}, ${tile * .86} ${tile * .52} C${tile * .72} ${tile * .48}, ${tile * .62} ${tile * .36}, ${tile * .64} ${tile * .18}Z" fill="${palette.accent}" opacity=".74"></path>
        <circle cx="${tile * .35}" cy="${tile * .27}" r="${Math.max(5, tile * .068)}" fill="${palette.sub}" opacity=".9"></circle>
        <circle cx="${tile * .44}" cy="${tile * .31}" r="${Math.max(4, tile * .052)}" fill="${palette.sub}" opacity=".82"></circle>
        <path d="M${tile * .76} ${tile * .72} q${tile * .12} -${tile * .16} ${tile * .24} 0" fill="none" stroke="${palette.dark}" stroke-width="2.4" opacity=".68"></path>
      </pattern>`;
  }

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
      return `
        <article class="proposal-card ${proposal.id === selectedId ? "selected" : ""}">
          <div class="proposal-visual">
            <div class="proposal-shirt">${shirtSvg(proposal, palettes, proposal, { assets, config })}</div>
            ${asset ? `<img src="${esc(assetUrl(config, asset))}" alt="${esc(asset.title)}">` : ""}
          </div>
          <div class="proposal-copy">
            <h3>${esc(proposal.title)}</h3>
            <p>${esc(proposal.direction)}</p>
            <div class="tags">${proposal.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
          </div>
          <button class="button secondary wide select-proposal" type="button" data-id="${esc(proposal.id)}">この案を編集する</button>
        </article>`;
    }).join("");
  }

  function renderAssets(target, assets, config, selectedAssetId) {
    target.innerHTML = assets.map((asset) => `
      <button class="asset-card ${asset.id === selectedAssetId ? "selected" : ""}" type="button" data-id="${esc(asset.id)}" data-type="${esc(asset.type)}">
        <img src="${esc(assetUrl(config, asset))}" alt="${esc(asset.title)}">
        <b>${asset.type === "motif" ? "柄素材" : "参考写真"}</b>
        <span>${esc(asset.title)}</span>
        <small>${asset.tags.map(esc).join(" / ")}</small>
      </button>
    `).join("");
  }

  function renderEditor(target, proposal, palettes, edit, assets, config) {
    const asset = findAsset(assets, edit.assetId);
    target.innerHTML = `
      <div class="editor-canvas">
        <div class="shirt-front">${shirtSvg(proposal, palettes, edit, { assets, config })}</div>
        <div class="reference-tile">
          ${asset ? `<img src="${esc(assetUrl(config, asset))}" alt="${esc(asset.title)}">` : ""}
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

  function renderModel(target, proposal, palettes, edit, model, sizeTable, assets, config) {
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
    const rotationLabel = `${Math.round(rotation)}°`;

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
          <text x="522" y="102">${rotationLabel}</text>
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
    target.innerHTML = `
      <div class="fit-score">
        <span>フィット判定</span>
        <strong>${fit.score}</strong>
      </div>
      <dl>
        <div><dt>推奨サイズ</dt><dd>${fit.recommendedSize}</dd></div>
        <div><dt>胸まわりのゆとり</dt><dd>${fit.chestEase > 0 ? "+" : ""}${fit.chestEase}cm</dd></div>
        <div><dt>肩幅の余裕</dt><dd>${fit.shoulderEase > 0 ? "+" : ""}${fit.shoulderEase}cm</dd></div>
        <div><dt>着丈差</dt><dd>${fit.lengthDiff > 0 ? "+" : ""}${fit.lengthDiff}cm</dd></div>
      </dl>
      <p class="${fit.message === "ややタイト" ? "warning" : ""}">${fit.message}です。迷う場合は推奨サイズを基準にしてください。</p>`;
  }

  function renderDesignNotes(target, proposal, edit, assets) {
    const asset = findAsset(assets, edit.assetId || proposal.assetId);
    const score = designScore(proposal, edit);
    target.innerHTML = `
      <strong>現在の設計メモ</strong>
      <ul>
        <li>案：${esc(proposal.title)}</li>
        <li>柄：${esc(proposal.pattern.name)} / 参考：${esc(asset?.title || "未選択")}</li>
        <li>密度 ${esc(edit.density)} / 拡大率 ${esc(edit.scale)}%</li>
        <li>衿：${esc(edit.collar)} / ロゴ：${esc(logoLabels[edit.logo] || edit.logo)}</li>
      </ul>`;
    target.innerHTML += `
      <div class="quality-grid">
        <div><span>沖縄らしさ</span><strong>${score.okinawa}</strong></div>
        <div><span>量産適性</span><strong>${score.production}</strong></div>
        <div><span>視認性</span><strong>${score.visibility}</strong></div>
      </div>`;
  }

  function renderSpec(target, proposal, brief, edit, fit, estimate) {
    target.innerHTML = `
      <div class="spec-row"><span>用途</span><strong>${esc(brief.scene)}</strong></div>
      <div class="spec-row"><span>選択案</span><strong>${esc(proposal.title)}</strong></div>
      <div class="spec-row"><span>柄・配色</span><strong>${esc(proposal.pattern.name)} / ${esc(edit.palette)}</strong></div>
      <div class="spec-row"><span>仕様</span><strong>${esc(edit.collar)}、${esc(edit.button)}、ロゴ ${esc(logoLabels[edit.logo] || edit.logo)}</strong></div>
      <div class="spec-row"><span>サイズ確認</span><strong>推奨 ${esc(fit.recommendedSize)} / 胸ゆとり ${fit.chestEase > 0 ? "+" : ""}${fit.chestEase}cm</strong></div>
      <div class="spec-row"><span>数量</span><strong>${estimate.quantity}枚</strong></div>
      <div class="spec-row"><span>概算</span><strong>単価 ${yen.format(estimate.unitPrice)}円 / 合計 ${yen.format(estimate.total)}円</strong></div>
      <p class="spec-note">概算にはサンプル作成費 ${yen.format(estimate.samplePrice)}円を含みます。正式見積りには生地、プリント方式、縫製仕様の確認が必要です。</p>`;
  }

  function renderModel3D(target, proposal, palettes, edit, model, sizeTable) {
    const fit = fitAnalysis(model, sizeTable);
    target.innerHTML = `
      <div class="three-tryon">
        <canvas id="tryonCanvas" class="tryon-canvas" aria-label="3D着用模型"></canvas>
        <div class="tryon-overlay top-left">
          <strong>3D試着ビュー</strong>
          <span>ドラッグで回転 / ホイールで拡大</span>
        </div>
        <div class="tryon-overlay top-right">
          <strong>${esc(fit.recommendedSize)}</strong>
          <span>推奨サイズ</span>
        </div>
        <div class="tryon-overlay bottom-left">
          <span>肩幅 ${fit.selected.shoulder}cm</span>
          <span>身幅 ${Math.round(fit.selected.chest / 2)}cm</span>
          <span>着丈 ${fit.selected.length}cm</span>
        </div>
      </div>`;
    return fit;
  }

  window.KariyushiRenderers = {
    renderHero,
    renderProposals,
    renderAssets,
    renderEditor,
    renderModel: renderModel3D,
    renderFitReport,
    renderDesignNotes,
    renderSpec,
    fitAnalysis
  };
})();
