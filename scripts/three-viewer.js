(function () {
  "use strict";
  if (typeof THREE === "undefined") { console.warn("[3D] THREE not loaded"); return; }
  console.log("[3D] Three.js v" + THREE.REVISION);

  /* ═══════════════════════════════════════════════════
   * 定数定義 — マジックナンバーの排除
   * ═══════════════════════════════════════════════════ */

  // テクスチャ生成
  const TEXTURE_RESOLUTION = 1024;
  const DEFAULT_PATTERN_DENSITY = 46;
  const DEFAULT_PATTERN_SCALE = 100;
  const TEXTURE_REPEAT_X = 2;
  const TEXTURE_REPEAT_Y = 3;
  const TEXTURE_ANISOTROPY = 8;
  const FABRIC_WEAVE_ALPHA = 0.06;
  const FABRIC_WEAVE_INTERVAL = 6;

  // カメラ設定
  const CAMERA_FOV = 34;
  const CAMERA_NEAR = 0.1;
  const CAMERA_FAR = 100;
  const CAMERA_DEFAULT_Y = 2.2;
  const CAMERA_LOOK_AT_Y = 1.8;

  // ズーム制御
  const DEFAULT_ZOOM = 5.8;
  const ZOOM_MIN = 3.5;
  const ZOOM_MAX = 9;
  const ZOOM_SENSITIVITY = 0.005;

  // ドラッグ回転感度
  const DRAG_ROTATION_SENSITIVITY = 0.012;

  // カメラ補間係数
  const CAMERA_ZOOM_LERP = 0.08;
  const ROTATION_LERP = 0.12;

  // ライティング
  const HEMISPHERE_LIGHT_INTENSITY = 1.5;
  const KEY_LIGHT_INTENSITY = 2.2;
  const FILL_LIGHT_INTENSITY = 0.9;
  const RIM_LIGHT_INTENSITY = 0.5;
  const SHADOW_MAP_SIZE = 1024;

  // トーンマッピング
  const TONE_MAPPING_EXPOSURE = 1.1;

  // 床・ステージ
  const FLOOR_RADIUS = 2.2;
  const FLOOR_SEGMENTS = 80;
  const FLOOR_RING_RADIUS = 2.15;
  const FLOOR_RING_TUBE = 0.015;

  // シャツの布のオフセット
  const CLOTH_OFFSET = 0.06;

  // ボタン数
  const BUTTON_COUNT = 5;
  const BUTTON_SPACING = 0.22;
  const BUTTON_START_Y = 2.32;

  // シャツの着丈位置（Y座標）
  const SHIRT_BODY_Y = 1.42;

  // 体型スケール倍率
  const BODY_SCALE_MAP = { slim: 0.88, normal: 1, strong: 1.14 };

  // ビューアングル（ラジアン）
  const VIEW_ANGLE_MAP = { front: 0, side: Math.PI / 2, back: Math.PI };
  const IDLE_SWAY_AMPLITUDE = 0.14;
  const IDLE_SWAY_SPEED = 0.00055;
  const LOOKAT_LERP = 0.1;
  const ENVIRONMENT_PRESETS = {
    atelier: {
      background: "#e8efe9",
      hemisphere: ["#fffef7", "#c4d8cf", 1.6],
      key: ["#fff5dc", 2.3, [3.5, 6.2, 4.5]],
      fill: ["#d5f2ee", 1.0, [-4.4, 3.2, 2.8]],
      rim: ["#ffd79b", 0.62, [0.5, 2.2, -5.2]],
      floor: "#dbe6e0",
      ring: "#ffc857",
      exposure: 1.12
    },
    resort: {
      background: "#dff1f4",
      hemisphere: ["#fcffff", "#a8dbe0", 1.75],
      key: ["#fff8ea", 2.5, [4.2, 5.8, 4.8]],
      fill: ["#8fdbe3", 1.12, [-4.2, 3.5, 3.1]],
      rim: ["#ffe4ba", 0.72, [0.2, 1.8, -5.4]],
      floor: "#d2eaec",
      ring: "#0f766e",
      exposure: 1.18
    },
    night: {
      background: "#0f1924",
      hemisphere: ["#d7e2ff", "#132536", 0.9],
      key: ["#dfe8ff", 1.7, [3.2, 4.8, 4.6]],
      fill: ["#315f82", 0.55, [-4.2, 2.5, 2.2]],
      rim: ["#f3c36f", 0.9, [0.2, 2.4, -5.7]],
      floor: "#162533",
      ring: "#ffc857",
      exposure: 0.92
    }
  };
  const FOCUS_PRESETS = {
    full: { zoom: DEFAULT_ZOOM, lookAt: [0, CAMERA_LOOK_AT_Y, 0], angleOffset: 0 },
    collar: { zoom: 4.35, lookAt: [0, 2.48, 0.18], angleOffset: 0.04 },
    logo: { zoom: 4.55, lookAt: [0.18, 2.18, 0.26], angleOffset: 0.08 },
    sleeve: { zoom: 4.75, lookAt: [-0.46, 2.16, 0.1], angleOffset: -0.36 }
  };

  // リサイズ最小サイズ
  const MIN_CANVAS_WIDTH = 320;
  const MIN_CANVAS_HEIGHT = 420;

  /* ═══════════════════════════════════════════════════
   * ビューアステート（旧: V）
   * ═══════════════════════════════════════════════════ */

  const viewerState = {
    renderer: null,
    scene: null,
    camera: null,
    rootGroup: null,
    mannequinGroup: null,
    shirtGroup: null,
    canvas: null,
    currentAngle: 0,
    targetAngle: 0,
    baseAngle: 0,
    focusAngleOffset: 0,
    zoom: DEFAULT_ZOOM,
    dragState: null,
    lastPayload: null,
    animationFrameId: 0,
    isBodyVisible: true,
    isAnimating: false,
    environment: "atelier",
    focus: "full",
    currentLookAt: new THREE.Vector3(0, CAMERA_LOOK_AT_Y, 0),
    targetLookAt: new THREE.Vector3(0, CAMERA_LOOK_AT_Y, 0),
    hemiLight: null,
    keyLight: null,
    fillLight: null,
    rimLight: null,
    floorMesh: null,
    floorRing: null,
    contextLost: false,
  };

  /* ═══════════════════════════════════════════════════
   * WebGL 対応チェック
   * ═══════════════════════════════════════════════════ */

  /**
   * WebGL の利用可能性を検証する。
   * 非対応ブラウザにはフォールバックメッセージを表示する。
   * @param {HTMLElement} container - プレビューコンテナ要素
   * @returns {boolean} WebGL が利用可能なら true
   */
  function checkWebGLSupport(container) {
    try {
      const testCanvas = document.createElement("canvas");
      const hasWebGL = !!(
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl")
      );
      if (!hasWebGL) {
        showWebGLFallback(container);
        return false;
      }
      return true;
    } catch (error) {
      console.warn("[3D] WebGL detection failed:", error);
      showWebGLFallback(container);
      return false;
    }
  }

  /**
   * WebGL 非対応時のフォールバックメッセージを表示する。
   * @param {HTMLElement} container - メッセージを挿入するコンテナ
   */
  function showWebGLFallback(container, error) {
    if (!container) return;
    const payload = viewerState.lastPayload || {};
    const palette = payload.palettes?.[payload.edit?.palette] || payload.palettes?.[payload.proposal?.palette];
    const baseColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(palette?.base || ""))
      ? palette.base
      : "#16727d";
    container.dataset.previewMode = "2d";
    container.innerHTML = `
      <div role="status" aria-live="polite" style="display:grid;place-items:center;height:100%;min-height:420px;padding:1rem;text-align:center;color:#46565b;font-family:sans-serif;background:#edf3ef;">
        <div>
          <svg viewBox="0 0 280 330" role="img" aria-label="2Dかりゆしウェアプレビュー" style="display:block;width:min(240px,72vw);margin:0 auto 1rem;">
            <ellipse cx="140" cy="304" rx="92" ry="14" fill="#173034" opacity=".12"></ellipse>
            <path d="M67 70L110 43l30 34 30-34 43 27 52 66-45 35-19-25v137q-61 20-122 0V146l-19 25-45-35Z" fill="${baseColor}"></path>
            <path d="M110 43l30 34 30-34 10 30-40 31-40-31Z" fill="#fff" opacity=".88"></path>
            <path d="M91 138q49-65 98 0t-98 0M91 205q49-65 98 0t-98 0" fill="none" stroke="#fff" stroke-width="9" opacity=".38"></path>
          </svg>
          <p style="font-size:1rem;font-weight:700;margin:.25rem 0;">3Dプレビューを読み込めませんでした</p>
          <p style="font-size:.85rem;line-height:1.6;margin:0;">2D画像に切り替えました。デザイン内容の選択と見積もり依頼は、そのまま続けられます。</p>
        </div>
      </div>`;
    window.dispatchEvent(new CustomEvent("kariyushi:viewererror", {
      detail: {
        source: "three",
        fallback: "2d",
        error: error instanceof Error ? error : new Error("WebGL is unavailable"),
      },
    }));
  }

  /* ═══════════════════════════════════════════════════
   * テクスチャ生成
   * ═══════════════════════════════════════════════════ */

  /**
   * かりゆしウェアの柄テクスチャを Canvas から生成する。
   * @param {Object} palette - カラーパレット（base, accent, sub, dark）
   * @param {Object} editOptions - 編集オプション（density, scale 等）
   * @param {Object} proposalProps - プロポーザルのデフォルト設定
   * @returns {THREE.CanvasTexture} 生成されたテクスチャ
   */
  function createPatternTexture(palette, editOptions, proposalProps) {
    const density = Number(editOptions.density || proposalProps.density || DEFAULT_PATTERN_DENSITY);
    const scalePercent = Number(editOptions.scale || proposalProps.scale || DEFAULT_PATTERN_SCALE) / 100;
    const tileSize = Math.max(90, density * 2.8 / scalePercent);

    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = TEXTURE_RESOLUTION;
    textureCanvas.height = TEXTURE_RESOLUTION;
    const ctx = textureCanvas.getContext("2d");

    // ベースカラーで塗りつぶし
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, TEXTURE_RESOLUTION, TEXTURE_RESOLUTION);

    // パターン描画（タイル配置・レンガ状オフセット）
    for (let row = -tileSize; row < TEXTURE_RESOLUTION + tileSize; row += tileSize) {
      for (let col = -tileSize; col < TEXTURE_RESOLUTION + tileSize; col += tileSize) {
        const rowOffset = (Math.floor(row / tileSize) % 2) * tileSize * 0.5;
        drawPattern(ctx, col + rowOffset, row, tileSize, palette);
      }
    }

    // 布地の織り目テクスチャ（格子線）
    ctx.globalAlpha = FABRIC_WEAVE_ALPHA;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < TEXTURE_RESOLUTION; i += FABRIC_WEAVE_INTERVAL) {
      ctx.fillRect(i, 0, 1, TEXTURE_RESOLUTION);
      ctx.fillRect(0, i, TEXTURE_RESOLUTION, 1);
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(TEXTURE_REPEAT_X, TEXTURE_REPEAT_Y);
    texture.anisotropy = TEXTURE_ANISOTROPY;
    return texture;
  }

  /**
   * 単一タイル内にハイビスカスや葉のパターンを描画する。
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} originX - タイル左上X
   * @param {number} originY - タイル左上Y
   * @param {number} tile - タイルサイズ
   * @param {Object} palette - カラーパレット
   */
  function drawPattern(ctx, originX, originY, tile, palette) {
    ctx.save();
    ctx.translate(originX, originY);

    // ── 大きなハイビスカス ──
    const flowerCenterX = tile * 0.4;
    const flowerCenterY = tile * 0.35;
    const petalRadius = tile * 0.22;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(flowerCenterX, flowerCenterY);
      ctx.rotate(i * Math.PI * 2 / 5);
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.ellipse(0, -petalRadius * 0.6, petalRadius * 0.3, petalRadius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 花の中心
    ctx.fillStyle = palette.sub;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(flowerCenterX, flowerCenterY, tile * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // おしべ（stamen）ライン
    ctx.strokeStyle = palette.sub;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const stamenLength = tile * 0.1;
      ctx.beginPath();
      ctx.moveTo(flowerCenterX, flowerCenterY);
      ctx.lineTo(
        flowerCenterX + Math.cos(angle) * stamenLength,
        flowerCenterY + Math.sin(angle) * stamenLength
      );
      ctx.stroke();
    }

    // ── 大きな葉 ──
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = palette.dark;
    ctx.beginPath();
    ctx.moveTo(tile * 0.02, tile * 0.78);
    ctx.bezierCurveTo(tile * 0.15, tile * 0.5, tile * 0.4, tile * 0.42, tile * 0.65, tile * 0.55);
    ctx.bezierCurveTo(tile * 0.4, tile * 0.62, tile * 0.18, tile * 0.72, tile * 0.02, tile * 0.78);
    ctx.fill();

    // 葉脈（主脈）
    ctx.strokeStyle = palette.base;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tile * 0.05, tile * 0.76);
    ctx.bezierCurveTo(tile * 0.2, tile * 0.58, tile * 0.4, tile * 0.5, tile * 0.6, tile * 0.56);
    ctx.stroke();

    // 葉脈（側脈）
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const veinX = tile * (0.1 + i * 0.1);
      const veinY = tile * (0.72 - i * 0.04);
      ctx.beginPath();
      ctx.moveTo(veinX, veinY);
      ctx.lineTo(veinX + tile * 0.08, veinY - tile * 0.08);
      ctx.stroke();
    }

    // ── 第2の葉（右下） ──
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = palette.dark;
    ctx.beginPath();
    ctx.moveTo(tile * 0.55, tile * 0.82);
    ctx.bezierCurveTo(tile * 0.65, tile * 0.65, tile * 0.82, tile * 0.6, tile * 0.96, tile * 0.68);
    ctx.bezierCurveTo(tile * 0.84, tile * 0.72, tile * 0.68, tile * 0.78, tile * 0.55, tile * 0.82);
    ctx.fill();

    // ── 波模様 ──
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, tile * 0.94);
    ctx.quadraticCurveTo(tile * 0.25, tile * 0.82, tile * 0.5, tile * 0.94);
    ctx.quadraticCurveTo(tile * 0.75, tile * 1.06, tile, tile * 0.94);
    ctx.stroke();

    // ── 小花 ──
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.6;
    const smallFlowers = [
      [tile * 0.78, tile * 0.18, tile * 0.04],
      [tile * 0.88, tile * 0.35, tile * 0.03],
      [tile * 0.15, tile * 0.92, tile * 0.035],
    ];
    smallFlowers.forEach(([flowerX, flowerY, flowerR]) => {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(flowerX, flowerY);
        ctx.rotate(i * Math.PI * 2 / 5);
        ctx.beginPath();
        ctx.ellipse(0, -flowerR * 2.5, flowerR, flowerR * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, flowerR * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = palette.sub;
      ctx.fill();
      ctx.fillStyle = palette.accent;
    });

    ctx.restore();
  }

  function applyEnvironment(name = "atelier") {
    const preset = ENVIRONMENT_PRESETS[name] || ENVIRONMENT_PRESETS.atelier;
    viewerState.environment = name;
    if (!viewerState.scene) return;
    viewerState.scene.background = new THREE.Color(preset.background);
    if (viewerState.hemiLight) {
      viewerState.hemiLight.color = new THREE.Color(preset.hemisphere[0]);
      viewerState.hemiLight.groundColor = new THREE.Color(preset.hemisphere[1]);
      viewerState.hemiLight.intensity = preset.hemisphere[2];
    }
    if (viewerState.keyLight) {
      viewerState.keyLight.color = new THREE.Color(preset.key[0]);
      viewerState.keyLight.intensity = preset.key[1];
      viewerState.keyLight.position.set(...preset.key[2]);
    }
    if (viewerState.fillLight) {
      viewerState.fillLight.color = new THREE.Color(preset.fill[0]);
      viewerState.fillLight.intensity = preset.fill[1];
      viewerState.fillLight.position.set(...preset.fill[2]);
    }
    if (viewerState.rimLight) {
      viewerState.rimLight.color = new THREE.Color(preset.rim[0]);
      viewerState.rimLight.intensity = preset.rim[1];
      viewerState.rimLight.position.set(...preset.rim[2]);
    }
    if (viewerState.floorMesh?.material) viewerState.floorMesh.material.color = new THREE.Color(preset.floor);
    if (viewerState.floorRing?.material) viewerState.floorRing.material.color = new THREE.Color(preset.ring);
    if (viewerState.renderer) viewerState.renderer.toneMappingExposure = preset.exposure;
  }

  function setBaseAngle(angle) {
    viewerState.baseAngle = angle;
    viewerState.targetAngle = angle;
  }

  function applyFocus(name = "full") {
    const preset = FOCUS_PRESETS[name] || FOCUS_PRESETS.full;
    viewerState.focus = name;
    viewerState.zoom = preset.zoom;
    viewerState.focusAngleOffset = preset.angleOffset || 0;
    viewerState.targetLookAt.set(...preset.lookAt);
  }

  /* ═══════════════════════════════════════════════════
   * シーン初期化
   * ═══════════════════════════════════════════════════ */

  /**
   * Three.js シーンを初期化する。同一 canvas なら再初期化しない。
   * @param {HTMLCanvasElement} canvas - 描画先の canvas 要素
   */
  function initScene(canvas) {
    if (viewerState.canvas === canvas && viewerState.renderer) return;
    if (viewerState.renderer) {
      cancelAnimationFrame(viewerState.animationFrameId);
      viewerState.renderer.dispose();
    }

    viewerState.canvas = canvas;
    viewerState.scene = new THREE.Scene();
    viewerState.scene.background = new THREE.Color("#e4efe8");
    viewerState.currentLookAt.set(0, CAMERA_LOOK_AT_Y, 0);
    viewerState.targetLookAt.set(0, CAMERA_LOOK_AT_Y, 0);

    viewerState.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, CAMERA_FAR);
    viewerState.camera.position.set(0, CAMERA_DEFAULT_Y, viewerState.zoom);

    viewerState.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    viewerState.contextLost = false;

    if (!canvas.dataset.kariyushiContextEvents) {
      canvas.dataset.kariyushiContextEvents = "bound";
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        viewerState.contextLost = true;
        stopAnimationLoop();
        showWebGLFallback(canvas.parentElement, new Error("WebGL context was lost"));
      });
    }

    // devicePixelRatio を最大 2 に制限する理由:
    // 高DPIディスプレイ（3x, 4x）ではレンダリング解像度が非常に高くなり、
    // GPUメモリとフレームレートに大きな負荷がかかる。
    // 2x はほとんどのディスプレイで十分な品質を提供し、
    // パフォーマンスと品質のバランスが最適となる。
    viewerState.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

    if (THREE.SRGBColorSpace) viewerState.renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewerState.renderer.shadowMap.enabled = true;
    viewerState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping) viewerState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    viewerState.renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

    // ── ライティング設定 ──
    viewerState.hemiLight = new THREE.HemisphereLight("#fff", "#bdd4c8", HEMISPHERE_LIGHT_INTENSITY);
    viewerState.scene.add(viewerState.hemiLight);

    viewerState.keyLight = new THREE.DirectionalLight("#fffef5", KEY_LIGHT_INTENSITY);
    viewerState.keyLight.position.set(3, 6, 4);
    viewerState.keyLight.castShadow = true;
    viewerState.keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    viewerState.scene.add(viewerState.keyLight);

    viewerState.fillLight = new THREE.DirectionalLight("#d4f0ed", FILL_LIGHT_INTENSITY);
    viewerState.fillLight.position.set(-4, 3, 2);
    viewerState.scene.add(viewerState.fillLight);

    viewerState.rimLight = new THREE.DirectionalLight("#ffecd2", RIM_LIGHT_INTENSITY);
    viewerState.rimLight.position.set(0, 2, -5);
    viewerState.scene.add(viewerState.rimLight);

    // ── フロア（展示台） ──
    viewerState.floorMesh = new THREE.Mesh(
      new THREE.CircleGeometry(FLOOR_RADIUS, FLOOR_SEGMENTS),
      new THREE.MeshStandardMaterial({ color: "#d5e2dc", roughness: 0.9 })
    );
    viewerState.floorMesh.rotation.x = -Math.PI / 2;
    viewerState.floorMesh.position.y = -0.02;
    viewerState.floorMesh.receiveShadow = true;
    viewerState.scene.add(viewerState.floorMesh);

    viewerState.floorRing = new THREE.Mesh(
      new THREE.TorusGeometry(FLOOR_RING_RADIUS, FLOOR_RING_TUBE, 8, 120),
      new THREE.MeshStandardMaterial({ color: "#16727d", roughness: 0.5 })
    );
    viewerState.floorRing.rotation.x = -Math.PI / 2;
    viewerState.floorRing.position.y = -0.01;
    viewerState.scene.add(viewerState.floorRing);

    applyEnvironment(viewerState.environment);

    viewerState.rootGroup = new THREE.Group();
    viewerState.scene.add(viewerState.rootGroup);

    bindControls(canvas);
    startAnimationLoop();
  }

  /* ═══════════════════════════════════════════════════
   * ユーザー操作バインディング
   * ═══════════════════════════════════════════════════ */

  /**
   * マウス / タッチ操作を canvas にバインドする。
   * @param {HTMLCanvasElement} canvas - 操作対象の canvas
   */
  function bindControls(canvas) {
    canvas.addEventListener("pointerdown", (event) => {
      viewerState.dragState = { startX: event.clientX, startAngle: viewerState.baseAngle };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("pointermove", (event) => {
      if (viewerState.dragState) {
        viewerState.baseAngle =
          viewerState.dragState.startAngle +
          (event.clientX - viewerState.dragState.startX) * DRAG_ROTATION_SENSITIVITY;
        viewerState.targetAngle = viewerState.baseAngle + viewerState.focusAngleOffset;
      }
    });

    const handlePointerUp = (event) => {
      viewerState.dragState = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    // wheel イベント:
    // preventDefault() でページスクロールを抑制するため passive: false が必要。
    // canvas 上でのホイール操作はズーム制御に専用利用されるため、
    // ページ全体のスクロール抑制の副作用は限定的。
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      viewerState.zoom = THREE.MathUtils.clamp(
        viewerState.zoom + event.deltaY * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX
      );
    }, { passive: false });
  }

  /* ═══════════════════════════════════════════════════
   * マネキン（人体モデル）
   * ═══════════════════════════════════════════════════ */

  /**
   * 体型に応じたマネキンのプロファイル（寸法パラメータ）を返す。
   * @param {Object} modelSettings - mannequin（性別）を含むモデル設定
   * @param {number} bodyScale - 体型スケール倍率
   * @returns {Object} 各部位のサイズ・色のプロファイル
   */
  function createBodyProfile(modelSettings, bodyScale) {
    const isFemale = modelSettings?.mannequin === "female";
    return {
      skinColor: isFemale ? "#d8c9b8" : "#c89570",
      pantsColor: isFemale ? "#c3b79e" : "#b9a887",
      shoesColor: isFemale ? "#d8d2c8" : "#f4f2ea",
      headScale: isFemale ? [0.78, 1.08, 0.78] : [0.88, 1.06, 0.84],
      neckY: isFemale ? 2.7 : 2.72,
      shoulderX: (isFemale ? 0.48 : 0.58) * bodyScale,
      elbowX: (isFemale ? 0.88 : 1.02) * bodyScale,
      wristX: (isFemale ? 1.24 : 1.42) * bodyScale,
      shoulderY: isFemale ? 2.4 : 2.38,
      elbowY: isFemale ? 2.22 : 2.16,
      wristY: isFemale ? 2.05 : 1.92,
      upperArmRadius: isFemale ? 0.048 : 0.062,
      forearmRadius: isFemale ? 0.043 : 0.055,
      legOffsetX: isFemale ? 0.12 : 0.16,
      upperLegRadius: isFemale ? 0.082 : 0.1,
      lowerLegRadius: isFemale ? 0.064 : 0.075,
      hipWidth: isFemale ? 0.46 : 0.38,
      footScale: isFemale ? [0.18, 0.055, 0.34] : [0.22, 0.07, 0.4],
      platformSize: isFemale ? [1.0, 0.08, 0.62] : [1.16, 0.1, 0.72],
    };
  }

  /**
   * 2点間をカプセル形状でつなぐメッシュを生成する。
   * @param {THREE.Vector3} startPoint - 開始点
   * @param {THREE.Vector3} endPoint - 終了点
   * @param {number} radius - カプセルの半径
   * @param {THREE.Material} material - 使用するマテリアル
   * @returns {THREE.Mesh} カプセルメッシュ
   */
  function createCapsuleBetween(startPoint, endPoint, radius, material) {
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const distance = direction.length();
    const capsuleGeometry = new THREE.CapsuleGeometry(radius, Math.max(0.01, distance - radius * 2), 8, 18);
    const mesh = new THREE.Mesh(capsuleGeometry, material);
    mesh.position.copy(startPoint).add(endPoint).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * 2点間をシリンダー形状（開口）でつなぐメッシュを生成する。
   * 袖などの筒状パーツに使用される。
   * @param {THREE.Vector3} startPoint - 開始点
   * @param {THREE.Vector3} endPoint - 終了点
   * @param {number} radiusTop - 上端の半径
   * @param {number} radiusBottom - 下端の半径
   * @param {THREE.Material} material - マテリアル
   * @param {number} [segments=32] - 円周方向の分割数
   * @returns {THREE.Mesh} シリンダーメッシュ
   */
  function createCylinderBetween(startPoint, endPoint, radiusTop, radiusBottom, material, segments = 32) {
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const distance = direction.length();
    const cylinderGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, distance, segments, 1, true);
    const mesh = new THREE.Mesh(cylinderGeometry, material);
    mesh.position.copy(startPoint).add(endPoint).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * マネキンの全身モデルを構築して THREE.Group として返す。
   * @param {Object} modelSettings - mannequin, body 等を含む設定
   * @param {number} bodyScale - 体型スケール倍率
   * @returns {THREE.Group} マネキンのグループ
   */
  function createMannequinBody(modelSettings, bodyScale) {
    const profile = createBodyProfile(modelSettings, bodyScale);
    const mannequinGroup = new THREE.Group();

    const skinMaterial = new THREE.MeshStandardMaterial({ color: profile.skinColor, roughness: 0.62, metalness: 0.01 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: profile.pantsColor, roughness: 0.74, metalness: 0.01 });
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: profile.shoesColor, roughness: 0.55, metalness: 0.02 });
    const platformMaterial = new THREE.MeshStandardMaterial({ color: "#1b1b1b", roughness: 0.5, metalness: 0.08 });
    const seamMaterial = new THREE.MeshStandardMaterial({ color: "#756957", roughness: 0.7 });

    // ── 頭部 ──
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), skinMaterial);
    headMesh.position.y = 2.92;
    headMesh.scale.set(...profile.headScale);
    headMesh.castShadow = true;
    mannequinGroup.add(headMesh);

    // ── 首 ──
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 16), skinMaterial);
    neckMesh.position.y = profile.neckY;
    neckMesh.castShadow = true;
    mannequinGroup.add(neckMesh);

    // ── 腕（左右対称） ──
    // 参考マネキン写真と同じポーズで腕を配置
    [-1, 1].forEach((side) => {
      const shoulderPos = new THREE.Vector3(side * profile.shoulderX, profile.shoulderY, 0.03);
      const elbowPos = new THREE.Vector3(side * profile.elbowX, profile.elbowY, 0.04);
      const wristPos = new THREE.Vector3(side * profile.wristX, profile.wristY, 0.06);

      mannequinGroup.add(createCapsuleBetween(shoulderPos, elbowPos, profile.upperArmRadius, skinMaterial));
      mannequinGroup.add(createCapsuleBetween(elbowPos, wristPos, profile.forearmRadius, skinMaterial));

      // 手のひら
      const palmMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 12), skinMaterial);
      palmMesh.position.copy(wristPos).add(new THREE.Vector3(side * 0.07, -0.015, 0.015));
      palmMesh.scale.set(1.25, 0.62, 0.32);
      palmMesh.rotation.z = side * -0.18;
      palmMesh.castShadow = true;
      mannequinGroup.add(palmMesh);

      // 親指
      const thumbMesh = createCapsuleBetween(
        wristPos.clone().add(new THREE.Vector3(side * 0.045, 0.005, 0.005)),
        wristPos.clone().add(new THREE.Vector3(side * 0.13, 0.045, 0.035)),
        0.012,
        skinMaterial
      );
      mannequinGroup.add(thumbMesh);

      // 4本の指
      for (let fingerIndex = 0; fingerIndex < 4; fingerIndex++) {
        const fingerZ = -0.035 + fingerIndex * 0.023;
        mannequinGroup.add(createCapsuleBetween(
          wristPos.clone().add(new THREE.Vector3(side * 0.09, -0.035, fingerZ)),
          wristPos.clone().add(new THREE.Vector3(side * (0.18 + fingerIndex * 0.01), -0.045, fingerZ + 0.003)),
          0.01,
          skinMaterial
        ));
      }
    });

    // ── 脚部（参考写真のズボン・靴・展示台） ──
    [-profile.legOffsetX, profile.legOffsetX].forEach((legX) => {
      const thighTop = new THREE.Vector3(legX, 1.28, 0);
      const kneePos = new THREE.Vector3(legX * 1.04, 0.76, 0.01);
      const anklePos = new THREE.Vector3(legX * 1.04, 0.2, 0.025);

      mannequinGroup.add(createCapsuleBetween(thighTop, kneePos, profile.upperLegRadius, pantsMaterial));
      mannequinGroup.add(createCapsuleBetween(kneePos, anklePos, profile.lowerLegRadius, pantsMaterial));

      // ズボンの折り目
      const creaseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.8, 0.006), seamMaterial);
      creaseMesh.position.set(legX * 1.04, 0.75, 0.085);
      creaseMesh.castShadow = false;
      mannequinGroup.add(creaseMesh);

      // 靴
      const footMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 12), shoeMaterial);
      footMesh.position.set(legX * 1.06, 0.06, 0.16);
      footMesh.scale.set(...profile.footScale);
      footMesh.castShadow = true;
      mannequinGroup.add(footMesh);
    });

    // ── 腰 ──
    const hipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), skinMaterial);
    hipMesh.position.y = 1.22;
    hipMesh.scale.set(profile.hipWidth, 0.18, 0.42);
    hipMesh.castShadow = true;
    mannequinGroup.add(hipMesh);

    // ── ベルト ──
    const beltMesh = new THREE.Mesh(
      new THREE.TorusGeometry(profile.hipWidth * 0.22, 0.012, 8, 64),
      seamMaterial
    );
    beltMesh.position.y = 1.38;
    beltMesh.scale.z = 0.42;
    beltMesh.rotation.x = Math.PI / 2;
    mannequinGroup.add(beltMesh);

    // ── 展示台 ──
    const platformMesh = new THREE.Mesh(
      new THREE.BoxGeometry(...profile.platformSize),
      platformMaterial
    );
    platformMesh.position.y = -0.055;
    platformMesh.receiveShadow = true;
    platformMesh.castShadow = true;
    mannequinGroup.add(platformMesh);

    return mannequinGroup;
  }

  /* ═══════════════════════════════════════════════════
   * シャツ（かりゆしウェア）
   * ═══════════════════════════════════════════════════ */

  /**
   * かりゆしウェアのシャツモデルを構築する。
   * @param {Object} palette - カラーパレット
   * @param {Object} editOptions - 編集オプション
   * @param {Object} proposalProps - プロポーザルのデフォルト値
   * @param {number} shirtScale - サイズスケール（fit基準）
   * @param {Object} modelSettings - mannequin設定
   * @returns {THREE.Group} シャツのグループ
   */
  function createShirtModel(palette, editOptions, proposalProps, shirtScale, modelSettings) {
    const shirtGroup = new THREE.Group();
    const isFemale = modelSettings?.mannequin === "female";
    const shoulderScale = isFemale ? 0.9 : 1;
    const chestScale = isFemale ? 0.88 : 1;

    const fabricTexture = createPatternTexture(palette, editOptions, proposalProps);
    const fabricMaterial = new THREE.MeshStandardMaterial({
      map: fabricTexture,
      roughness: 0.76,
      metalness: 0.01,
      side: THREE.DoubleSide,
    });
    const seamMaterial = new THREE.MeshStandardMaterial({ color: "#1d2e31", roughness: 0.7 });

    // ── 胴体 ──
    // LatheGeometry でマネキン上に布厚分オフセットしたシルエットを作成
    const torsoProfile = [
      new THREE.Vector2((0.40 * shirtScale + CLOTH_OFFSET) * (isFemale ? 0.88 : 1), 0),       // 裾
      new THREE.Vector2((0.39 * shirtScale + CLOTH_OFFSET) * (isFemale ? 0.84 : 1), 0.12),
      new THREE.Vector2((0.38 * shirtScale + CLOTH_OFFSET) * (isFemale ? 0.78 : 1), 0.28),     // 下部ウエスト
      new THREE.Vector2((0.40 * shirtScale + CLOTH_OFFSET) * (isFemale ? 0.82 : 1), 0.48),
      new THREE.Vector2((0.46 * shirtScale + CLOTH_OFFSET) * chestScale, 0.68),                 // 胴体中央
      new THREE.Vector2((0.50 * shirtScale + CLOTH_OFFSET) * chestScale, 0.85),                 // 胸部
      new THREE.Vector2((0.48 * shirtScale + CLOTH_OFFSET) * shoulderScale, 0.98),
      new THREE.Vector2((0.42 * shirtScale + CLOTH_OFFSET) * shoulderScale, 1.08),              // 肩周辺
      new THREE.Vector2(0.28 * shirtScale + CLOTH_OFFSET, 1.18),                                // 首開き
    ];
    const torsoGeometry = new THREE.LatheGeometry(torsoProfile, 64);
    const torsoMesh = new THREE.Mesh(torsoGeometry, fabricMaterial);
    torsoMesh.position.y = SHIRT_BODY_Y;
    torsoMesh.scale.z = 0.56;
    torsoMesh.castShadow = true;
    shirtGroup.add(torsoMesh);

    // ── 前立て（プラケット） ──
    const placketMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 1.16, 0.008),
      seamMaterial
    );
    placketMesh.position.set(0, 1.98, 0.28 * shirtScale);
    shirtGroup.add(placketMesh);

    // ── ボタン ──
    const buttonColorMap = {
      "白蝶貝風": "#f2edd8",
      "木目風": "#8b5c36",
    };
    const buttonColor = buttonColorMap[editOptions.button] || "#222e30";
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: buttonColor, roughness: 0.35, metalness: 0.2 });
    for (let i = 0; i < BUTTON_COUNT; i++) {
      const buttonMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.006, 16),
        buttonMaterial
      );
      buttonMesh.position.set(0, BUTTON_START_Y - i * BUTTON_SPACING, 0.29 * shirtScale);
      buttonMesh.rotation.x = Math.PI / 2;
      shirtGroup.add(buttonMesh);
    }

    // ── 裾の縫い目 ──
    const hemSeamMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.40 * shirtScale + CLOTH_OFFSET, 0.008, 8, 80),
      seamMaterial
    );
    hemSeamMesh.position.y = SHIRT_BODY_Y;
    hemSeamMesh.scale.z = 0.57;
    hemSeamMesh.rotation.x = Math.PI / 2;
    shirtGroup.add(hemSeamMesh);

    // ── 袖（左右） ──
    [-1, 1].forEach((side) => {
      const sleeveStart = new THREE.Vector3(side * 0.4 * shirtScale * shoulderScale, 2.38, 0.035);
      const sleeveEnd = new THREE.Vector3(side * 0.72 * shirtScale * shoulderScale, 2.18, 0.055);
      const sleeveMesh = createCylinderBetween(sleeveStart, sleeveEnd, 0.105, 0.17, fabricMaterial, 32);
      shirtGroup.add(sleeveMesh);

      // 袖口の縫い目
      const sleeveHemMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.17, 0.006, 8, 40),
        seamMaterial
      );
      sleeveHemMesh.position.copy(sleeveEnd);
      sleeveHemMesh.quaternion.copy(sleeveMesh.quaternion);
      sleeveHemMesh.rotation.z += side * Math.PI / 2;
      shirtGroup.add(sleeveHemMesh);
    });

    // ── 襟 ──
    const collarMaterial = new THREE.MeshStandardMaterial({
      color: "#fbfaf0",
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const collarType = editOptions.collar || proposalProps.collar || "開襟";
    if (collarType === "ボタンダウン" || collarType === "スタンドカラー") {
      const collarBandMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24 * shirtScale, 0.26 * shirtScale, 0.1, 32, 1, true),
        collarMaterial
      );
      collarBandMesh.position.y = 2.52;
      collarBandMesh.scale.z = 0.5;
      shirtGroup.add(collarBandMesh);
    } else {
      // 開襟（オープンカラー）のフラップ
      for (let side = -1; side <= 1; side += 2) {
        const flapMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.28), collarMaterial);
        flapMesh.position.set(side * 0.14, 2.48, 0.24 * shirtScale);
        flapMesh.rotation.set(-0.3, side * 0.25, side * -0.18);
        shirtGroup.add(flapMesh);
      }
    }

    // ── ポケット ──
    const pocketMaterial = new THREE.MeshStandardMaterial({
      color: "#fff",
      transparent: true,
      opacity: 0.15,
    });
    const pocketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.006), pocketMaterial);
    pocketMesh.position.set(0.22 * shirtScale, 2.08, 0.28 * shirtScale);
    shirtGroup.add(pocketMesh);

    // ── ロゴ ──
    const logoPosition = editOptions.logo || proposalProps.logo;
    if (logoPosition !== "none") {
      shirtGroup.add(createLogoMesh(logoPosition, shirtScale));
    }

    return shirtGroup;
  }

  /**
   * ロゴプレーンメッシュを生成する。
   * @param {string} position - ロゴの配置位置（"back", "sleeve", その他=胸）
   * @param {number} shirtScale - シャツスケール
   * @returns {THREE.Mesh} ロゴメッシュ
   */
  function createLogoMesh(position, shirtScale) {
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = 256;
    logoCanvas.height = 128;
    const ctx = logoCanvas.getContext("2d");
    ctx.fillStyle = "rgba(20,32,34,.7)";
    ctx.fillRect(4, 4, 248, 120);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LOGO", 128, 66);

    const logoTexture = new THREE.CanvasTexture(logoCanvas);
    if (THREE.SRGBColorSpace) logoTexture.colorSpace = THREE.SRGBColorSpace;

    const logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), logoMaterial);

    if (position === "back") {
      logoMesh.position.set(0, 2.1, -0.28 * shirtScale);
      logoMesh.rotation.y = Math.PI;
    } else if (position === "sleeve") {
      logoMesh.position.set(-0.62 * shirtScale, 2.14, 0.08);
      logoMesh.rotation.y = Math.PI / 2;
    } else {
      logoMesh.position.set(0.22 * shirtScale, 2.18, 0.29 * shirtScale);
    }

    return logoMesh;
  }

  /* ═══════════════════════════════════════════════════
   * フィッティングガイド線
   * ═══════════════════════════════════════════════════ */

  /**
   * フィッティングガイド（計測線・チェストリング）を作成する。
   * @param {Object} fitData - chestEase 等のフィッティングデータ
   * @returns {THREE.Group} ガイドのグループ
   */
  function createFitGuides(fitData) {
    const guideGroup = new THREE.Group();

    // チェストゆとり量に応じた色分け
    const easeColor = fitData.chestEase < 8
      ? "#d75c4f"    // きつい（赤）
      : fitData.chestEase > 24
        ? "#d7a33f"  // ゆるい（黄）
        : "#16727d"; // 適正（グリーン）

    const chestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.008, 8, 80),
      new THREE.MeshBasicMaterial({ color: easeColor, transparent: true, opacity: 0.6 })
    );
    chestRing.position.y = 2.0;
    chestRing.scale.z = 0.52;
    chestRing.rotation.x = Math.PI / 2;
    guideGroup.add(chestRing);

    // 計測ガイドライン
    const guideLine = new THREE.LineBasicMaterial({
      color: "#16727d",
      transparent: true,
      opacity: 0.5,
    });
    const guideLinePairs = [
      [new THREE.Vector3(-0.58, 2.44, 0.36), new THREE.Vector3(0.58, 2.44, 0.36)],   // 肩幅
      [new THREE.Vector3(-0.66, 2.0, 0.36), new THREE.Vector3(0.66, 2.0, 0.36)],      // 胸囲
      [new THREE.Vector3(-0.72, 2.44, 0.34), new THREE.Vector3(-0.72, 1.4, 0.34)],    // 着丈
    ];
    guideLinePairs.forEach(([pointA, pointB]) => {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([pointA, pointB]);
      guideGroup.add(new THREE.Line(lineGeometry, guideLine));
    });

    return guideGroup;
  }

  /* ═══════════════════════════════════════════════════
   * メモリ管理・クリーンアップ
   * ═══════════════════════════════════════════════════ */

  /**
   * THREE.Object3D ツリーを再帰走査して、ジオメトリ・マテリアル・テクスチャを解放する。
   * @param {THREE.Object3D} object - 解放対象のオブジェクト
   */
  function disposeObject3D(object) {
    object.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          // マテリアルのすべてのプロパティからテクスチャを検索して解放
          Object.values(material).forEach((value) => {
            if (value && value.isTexture) {
              value.dispose();
            }
          });
          material.dispose();
        });
      }
    });
  }

  /**
   * rootGroup の子オブジェクトをすべて除去し、リソースを解放する。
   */
  function clearRootGroup() {
    if (!viewerState.rootGroup) return;
    while (viewerState.rootGroup.children.length) {
      const child = viewerState.rootGroup.children.pop();
      disposeObject3D(child);
    }
  }

  /**
   * ビューア全体のリソースを完全に解放する。
   * コンポーネントのアンマウント時やページ離脱時に呼び出す。
   */
  function cleanup() {
    // アニメーションループ停止
    if (viewerState.animationFrameId) {
      cancelAnimationFrame(viewerState.animationFrameId);
      viewerState.animationFrameId = 0;
    }
    viewerState.isAnimating = false;

    // シーン内オブジェクトの解放
    clearRootGroup();

    // シーン全体の解放（ライト・フロア等）
    if (viewerState.scene) {
      viewerState.scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((mat) => {
            Object.values(mat).forEach((val) => {
              if (val && val.isTexture) val.dispose();
            });
            mat.dispose();
          });
        }
      });
    }

    // レンダラーの解放
    if (viewerState.renderer) {
      viewerState.renderer.dispose();
      viewerState.renderer = null;
    }

    viewerState.scene = null;
    viewerState.camera = null;
    viewerState.rootGroup = null;
    viewerState.mannequinGroup = null;
    viewerState.shirtGroup = null;
    viewerState.canvas = null;
    viewerState.contextLost = false;

    console.log("[3D] cleanup complete");
  }

  /* ═══════════════════════════════════════════════════
   * アニメーションループ（タブ可視性制御付き）
   * ═══════════════════════════════════════════════════ */

  /**
   * アニメーションループを開始する。
   * document.hidden チェックにより、タブ非表示時はレンダリングをスキップする。
   */
  function startAnimationLoop() {
    if (viewerState.isAnimating) return;
    viewerState.isAnimating = true;
    animateFrame();
  }

  /**
   * アニメーションループを停止する。
   */
  function stopAnimationLoop() {
    viewerState.isAnimating = false;
    if (viewerState.animationFrameId) {
      cancelAnimationFrame(viewerState.animationFrameId);
      viewerState.animationFrameId = 0;
    }
  }

  /**
   * 毎フレームの描画処理。タブ非表示時はスキップ。
   */
  function animateFrame() {
    if (!viewerState.isAnimating) return;
    viewerState.animationFrameId = requestAnimationFrame(animateFrame);

    // タブが非表示の場合はレンダリングをスキップ（GPU負荷軽減）
    if (document.hidden) return;

    if (!viewerState.renderer) return;

    // ズームと注視点のスムーズ補間
    viewerState.camera.position.z +=
      (viewerState.zoom - viewerState.camera.position.z) * CAMERA_ZOOM_LERP;
    viewerState.currentLookAt.lerp(viewerState.targetLookAt, LOOKAT_LERP);
    viewerState.camera.lookAt(viewerState.currentLookAt);

    // 回転のスムーズ補間 + 待機時のゆらぎ演出
    if (viewerState.rootGroup) {
      const idleOffset = !viewerState.dragState && viewerState.focus === "full"
        ? Math.sin(Date.now() * IDLE_SWAY_SPEED) * IDLE_SWAY_AMPLITUDE
        : 0;
      viewerState.targetAngle = viewerState.baseAngle + viewerState.focusAngleOffset + idleOffset;
      viewerState.currentAngle +=
        (viewerState.targetAngle - viewerState.currentAngle) * ROTATION_LERP;
      viewerState.rootGroup.rotation.y = viewerState.currentAngle;
    }

    viewerState.renderer.render(viewerState.scene, viewerState.camera);
  }

  // タブの可視性変更時にアニメーションループを制御
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimationLoop();
    } else if (viewerState.renderer) {
      startAnimationLoop();
    }
  });

  /* ═══════════════════════════════════════════════════
   * リビルド（3Dモデル再構築）
   * ═══════════════════════════════════════════════════ */

  /**
   * ペイロードに基づいて3Dプレビューを再構築する。
   * @param {Object} payload - proposal, palettes, edit, model, fit を含むデータ
   */
  function rebuild(payload) {
    console.log("[3D] rebuild()");
    const container = document.getElementById("modelPreview");
    try {
      viewerState.lastPayload = payload;

      if (!container) {
        console.warn("[3D] #modelPreview missing");
        return false;
      }

      // WebGL 対応チェック
      if (!checkWebGLSupport(container)) return false;

      // canvas の取得または作成
      let canvas = container.querySelector("canvas.tryon-canvas");
      if (!canvas) {
        container.classList.add("three-tryon");
        canvas = document.createElement("canvas");
        canvas.className = "tryon-canvas";
        canvas.style.cssText =
          "width:100%;height:100%;display:block;cursor:grab;touch-action:none;border-radius:12px;";
        container.innerHTML = "";
        container.appendChild(canvas);
      }

      initScene(canvas);

      // 既存のモデルをクリア（ジオメトリ・マテリアル・テクスチャを解放）
      clearRootGroup();

      const { proposal, palettes, edit, model, fit } = payload;
      const selectedPalette = palettes[edit.palette] || palettes[proposal.palette];
      const bodyScale = BODY_SCALE_MAP[model.body] || 1;
      const shirtScale =
        (fit && fit.selected && fit.selected.chest ? fit.selected.chest : 110) / 110;

      // マネキン構築
      viewerState.mannequinGroup = createMannequinBody(model, bodyScale);
      viewerState.mannequinGroup.visible = viewerState.isBodyVisible;
      viewerState.rootGroup.add(viewerState.mannequinGroup);

      // シャツ構築
      viewerState.shirtGroup = createShirtModel(selectedPalette, edit, proposal, shirtScale, model);
      viewerState.rootGroup.add(viewerState.shirtGroup);

      // フィッティングガイド
      if (fit) {
        viewerState.rootGroup.add(createFitGuides(fit));
      }

      applyEnvironment(model.environment || viewerState.environment || "atelier");
      applyFocus(model.focus || viewerState.focus || "full");

      // ビューアングル設定
      const baseAngle = VIEW_ANGLE_MAP[model.view] !== undefined
        ? VIEW_ANGLE_MAP[model.view]
        : THREE.MathUtils.degToRad(((Number(model.rotation) || 0) % 360 + 360) % 360);
      setBaseAngle(baseAngle);
      viewerState.currentAngle = viewerState.baseAngle + viewerState.focusAngleOffset;

      resizeCanvas();
      container.dataset.previewMode = "3d";
      console.log("[3D] rebuild complete");
      return true;
    } catch (error) {
      console.error("[3D] error:", error);
      showWebGLFallback(container, error);
      return false;
    }
  }

  /**
   * 現在の3D表示を見積もり添付用の画像として返す。
   * @param {string} [mimeType="image/png"] - image/png または image/jpeg
   * @returns {string} Data URL
   */
  function capturePreview(mimeType = "image/png") {
    if (!viewerState.renderer || !viewerState.canvas || viewerState.contextLost) {
      throw new Error("3D preview is not ready");
    }
    const type = mimeType === "image/jpeg" ? mimeType : "image/png";
    viewerState.renderer.render(viewerState.scene, viewerState.camera);
    return viewerState.canvas.toDataURL(type, type === "image/jpeg" ? 0.92 : undefined);
  }

  /* ═══════════════════════════════════════════════════
   * リサイズ処理
   * ═══════════════════════════════════════════════════ */

  /**
   * canvas サイズを親要素に合わせてリサイズし、アスペクト比を更新する。
   */
  function resizeCanvas() {
    if (!viewerState.renderer || !viewerState.canvas) return;
    const parentElement = viewerState.canvas.parentElement;
    if (!parentElement) return;

    const rect = parentElement.getBoundingClientRect();
    const width = Math.max(MIN_CANVAS_WIDTH, Math.floor(rect.width));
    const height = Math.max(MIN_CANVAS_HEIGHT, Math.floor(rect.height));

    viewerState.renderer.setSize(width, height, false);
    viewerState.camera.aspect = width / height;
    viewerState.camera.updateProjectionMatrix();
  }

  /* ═══════════════════════════════════════════════════
   * グローバル API 公開（他ファイルとの互換性維持）
   * ═══════════════════════════════════════════════════ */

  window.addEventListener("kariyushi:render3d", (event) => rebuild(event.detail));
  window.addEventListener("resize", resizeCanvas);

  window.KariyushiThreeViewer = {
    rebuild,
    setEnvironment(name) {
      applyEnvironment(name);
    },
    setFocus(name) {
      applyFocus(name);
    },
    toggleBody() {
      viewerState.isBodyVisible = !viewerState.isBodyVisible;
      if (viewerState.mannequinGroup) {
        viewerState.mannequinGroup.visible = viewerState.isBodyVisible;
      }
      return viewerState.isBodyVisible;
    },
    isBodyVisible() {
      return viewerState.isBodyVisible;
    },
    isReady() {
      return Boolean(viewerState.renderer && viewerState.canvas && !viewerState.contextLost);
    },
    capturePreview,
    cleanup,
  };

  // 保留中のレンダリングデータがあれば即時実行
  if (window.KariyushiLatest3D) rebuild(window.KariyushiLatest3D);
})();
