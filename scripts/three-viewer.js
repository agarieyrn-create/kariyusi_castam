import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const state = {
  renderer: null,
  scene: null,
  camera: null,
  root: null,
  shirt: null,
  canvas: null,
  angle: 0,
  zoom: 6.4,
  drag: null,
  lastPayload: null,
  animationId: 0
};

function color(value, fallback = "#ffffff") {
  return new THREE.Color(value || fallback);
}

function normalizeAngle(value) {
  return ((Number(value) || 0) % 360 + 360) % 360;
}

function makeFabricTexture(palette, edit, proposal) {
  const size = 512;
  const density = Number(edit.density || proposal.density || 46);
  const scale = Number(edit.scale || proposal.scale || 100) / 100;
  const tile = Math.max(72, density * 1.85 / scale);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, size, size);

  for (let y = -tile; y < size + tile; y += tile) {
    for (let x = -tile; x < size + tile; x += tile) {
      const offset = (Math.floor(y / tile) % 2) * tile * .45;
      drawMotif(ctx, x + offset, y, tile, palette);
    }
  }

  ctx.globalAlpha = .14;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < size; i += 12) ctx.fillRect(i, 0, 1, size);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.7, 2.4);
  texture.anisotropy = 8;
  return texture;
}

function drawMotif(ctx, x, y, tile, palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(4, tile * .05);
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = .82;
  ctx.beginPath();
  ctx.moveTo(tile * .08, tile * .68);
  ctx.bezierCurveTo(tile * .28, tile * .42, tile * .52, tile * .42, tile * .74, tile * .68);
  ctx.stroke();

  ctx.fillStyle = palette.dark;
  ctx.globalAlpha = .72;
  ctx.beginPath();
  ctx.ellipse(tile * .32, tile * .55, tile * .11, tile * .27, .85, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tile * .72, tile * .38, tile * .13, tile * .24, -.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.sub;
  ctx.globalAlpha = .9;
  ctx.beginPath();
  ctx.arc(tile * .38, tile * .28, tile * .07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tile * .48, tile * .31, tile * .052, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value && value.isTexture) value.dispose();
        });
        material.dispose();
      });
    }
  });
}

function init(canvas) {
  if (state.canvas === canvas && state.renderer) return;
  if (state.renderer) {
    cancelAnimationFrame(state.animationId);
    state.renderer.dispose();
  }

  state.canvas = canvas;
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color("#eef6f3");
  state.camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  state.camera.position.set(0, 2.5, state.zoom);
  state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight("#ffffff", "#cad8d2", 1.9);
  state.scene.add(hemi);
  const key = new THREE.DirectionalLight("#ffffff", 2.7);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  state.scene.add(key);
  const fill = new THREE.DirectionalLight("#d9f4f2", 1.2);
  fill.position.set(-4, 2, 2);
  state.scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 80),
    new THREE.MeshStandardMaterial({ color: "#dfe9e5", roughness: .9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.02;
  floor.receiveShadow = true;
  state.scene.add(floor);

  state.root = new THREE.Group();
  state.scene.add(state.root);
  bindControls(canvas);
  animate();
}

function bindControls(canvas) {
  canvas.onpointerdown = (event) => {
    state.drag = { x: event.clientX, angle: state.angle };
    canvas.setPointerCapture(event.pointerId);
    canvas.closest(".model-preview")?.classList.add("dragging");
  };
  canvas.onpointermove = (event) => {
    if (!state.drag) return;
    state.angle = state.drag.angle + (event.clientX - state.drag.x) * .012;
  };
  canvas.onpointerup = (event) => endDrag(canvas, event);
  canvas.onpointercancel = (event) => endDrag(canvas, event);
  canvas.onwheel = (event) => {
    event.preventDefault();
    state.zoom = THREE.MathUtils.clamp(state.zoom + event.deltaY * .004, 4.2, 8.5);
    state.camera.position.z = state.zoom;
  };
}

function endDrag(canvas, event) {
  state.drag = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  canvas.closest(".model-preview")?.classList.remove("dragging");
}

function rebuild(payload) {
  state.lastPayload = payload;
  const canvas = document.getElementById("tryonCanvas");
  if (!canvas) return;
  init(canvas);
  while (state.root.children.length) {
    const child = state.root.children.pop();
    disposeObject(child);
  }

  const { proposal, palettes, edit, model, fit } = payload;
  const palette = palettes[edit.palette] || palettes[proposal.palette];
  const bodyScale = { slim: .92, normal: 1, strong: 1.12 }[model.body] || 1;
  const shirtScale = (fit?.selected?.chest || 110) / 110;

  const mannequin = makeMannequin(bodyScale);
  state.root.add(mannequin);

  const shirt = makeShirt(palette, edit, proposal, shirtScale);
  state.shirt = shirt;
  state.root.add(shirt);

  state.root.add(makeMeasurementGuides(fit));
  const targetAngle = { front: 0, side: Math.PI / 2, back: Math.PI }[model.view] ?? THREE.MathUtils.degToRad(normalizeAngle(model.rotation));
  state.angle = targetAngle;
  resize();
}

function makeMannequin(scale) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: "#c8956e", roughness: .68, metalness: .02 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.42 * scale, 1.55, 18, 32), skin);
  torso.position.y = 1.8;
  torso.scale.set(1.05, 1, .55);
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(.26, 32, 24), skin);
  head.position.y = 3.02;
  head.scale.set(.86, 1.08, .82);
  head.castShadow = true;
  group.add(head);

  addLimb(group, skin, -.58 * scale, 1.75, -.15, .18, 1.15, -.22);
  addLimb(group, skin, .58 * scale, 1.75, .15, .18, 1.15, .22);
  addLimb(group, skin, -.18, .64, .02, .18, 1.25, .03);
  addLimb(group, skin, .18, .64, -.02, .18, 1.25, -.03);
  return group;
}

function addLimb(group, material, x, y, rotZ, radius, length, lean) {
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 12, 20), material);
  limb.position.set(x, y, 0);
  limb.rotation.z = rotZ + lean;
  limb.castShadow = true;
  group.add(limb);
}

function makeShirt(palette, edit, proposal, scale) {
  const group = new THREE.Group();
  const fabric = makeFabricTexture(palette, edit, proposal);
  const mat = new THREE.MeshStandardMaterial({
    map: fabric,
    roughness: .82,
    metalness: .02,
    side: THREE.DoubleSide
  });
  const seamMat = new THREE.MeshStandardMaterial({ color: "#1d2e31", roughness: .8 });
  const collarMat = new THREE.MeshStandardMaterial({ color: "#fbfbf2", roughness: .78, side: THREE.DoubleSide });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.28 * scale, 1.58, .62), mat);
  body.position.y = 1.78;
  body.castShadow = true;
  group.add(body);

  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(.025, 1.5, .36), seamMat);
  frontLeft.position.set(-.012, 1.77, .33);
  group.add(frontLeft);

  for (let i = 0; i < 4; i++) {
    const button = new THREE.Mesh(new THREE.SphereGeometry(.035, 18, 12), seamMat);
    button.position.set(.09, 2.35 - i * .28, .64);
    group.add(button);
  }

  const pocket = new THREE.Mesh(new THREE.BoxGeometry(.26, .28, .018), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: .24 }));
  pocket.position.set(.34 * scale, 2.1, .65);
  group.add(pocket);

  const sleeveGeometry = new THREE.CylinderGeometry(.16, .24, .52, 28, 1, true);
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mat);
  leftSleeve.position.set(-.78 * scale, 2.2, .02);
  leftSleeve.rotation.z = Math.PI / 2 - .45;
  leftSleeve.rotation.y = .2;
  leftSleeve.castShadow = true;
  group.add(leftSleeve);

  const rightSleeve = leftSleeve.clone();
  rightSleeve.position.x = .78 * scale;
  rightSleeve.rotation.z = Math.PI / 2 + .45;
  rightSleeve.rotation.y = -.2;
  group.add(rightSleeve);

  const collarL = new THREE.Mesh(new THREE.ConeGeometry(.24, .42, 3), collarMat);
  collarL.position.set(-.22, 2.72, .23);
  collarL.rotation.set(Math.PI / 2, 0, -.22);
  group.add(collarL);
  const collarR = collarL.clone();
  collarR.position.x = .22;
  collarR.rotation.z = .22;
  group.add(collarR);

  if ((edit.logo || proposal.logo) !== "none") {
    group.add(makeLogo((edit.logo || proposal.logo) === "back" ? 0 : .3, (edit.logo || proposal.logo) === "back" ? -.22 : .39));
  }
  return group;
}

function makeLogo(x, z) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(20,32,34,.76)";
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOGO", 128, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(.32, .16),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  logo.position.set(x, 2.22, z + .27);
  return logo;
}

function makeMeasurementGuides(fit) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: "#16727d", transparent: true, opacity: .72 });
  const points = [
    new THREE.Vector3(-.72, 2.55, .52),
    new THREE.Vector3(.72, 2.55, .52),
    new THREE.Vector3(.82, 2.1, .52),
    new THREE.Vector3(-.82, 2.1, .52),
    new THREE.Vector3(-.9, 2.55, .48),
    new THREE.Vector3(-.9, 1.0, .48)
  ];
  [[0, 1], [2, 3], [4, 5]].forEach(([a, b]) => {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[a], points[b]]), mat));
  });
  return group;
}

function resize() {
  if (!state.renderer || !state.canvas) return;
  const rect = state.canvas.parentElement.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(420, Math.floor(rect.height));
  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

function animate() {
  state.animationId = requestAnimationFrame(animate);
  if (!state.renderer || !state.scene || !state.camera) return;
  resize();
  if (state.root) {
    state.root.rotation.y += (state.angle - state.root.rotation.y) * .16;
  }
  state.renderer.render(state.scene, state.camera);
}

window.addEventListener("kariyushi:render3d", (event) => rebuild(event.detail));
window.addEventListener("resize", resize);
if (window.KariyushiLatest3D) rebuild(window.KariyushiLatest3D);
