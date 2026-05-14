(function () {
  "use strict";
  if (typeof THREE === "undefined") { console.warn("[3D] THREE not loaded"); return; }
  console.log("[3D] Three.js v" + THREE.REVISION);

  const V = {
    renderer: null, scene: null, camera: null, root: null,
    mannequin: null, shirt: null, canvas: null,
    angle: 0, target: 0, zoom: 5.8,
    drag: null, last: null, aid: 0, body: true
  };

  /* ── Texture ── */
  function makeTex(pal, edit, prop) {
    const S = 1024, d = Number(edit.density||prop.density||46);
    const sc = Number(edit.scale||prop.scale||100)/100;
    const tile = Math.max(90, d * 2.8 / sc);
    const c = document.createElement("canvas"); c.width=S; c.height=S;
    const g = c.getContext("2d");
    g.fillStyle = pal.base; g.fillRect(0,0,S,S);
    for (let y=-tile; y<S+tile; y+=tile)
      for (let x=-tile; x<S+tile; x+=tile) {
        const off = (Math.floor(y/tile)%2)*tile*.5;
        drawPattern(g, x+off, y, tile, pal);
      }
    // fabric weave
    g.globalAlpha=.06; g.fillStyle="#fff";
    for(let i=0;i<S;i+=6){g.fillRect(i,0,1,S);g.fillRect(0,i,S,1);}
    g.globalAlpha=1;
    const t = new THREE.CanvasTexture(c);
    if(THREE.SRGBColorSpace) t.colorSpace=THREE.SRGBColorSpace;
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(2,3); t.anisotropy=8;
    return t;
  }

  function drawPattern(g, x, y, t, p) {
    g.save(); g.translate(x,y);
    // ── 大きなハイビスカス ──
    const cx=t*.4, cy=t*.35, pr=t*.22;
    g.globalAlpha=.85;
    for(let i=0;i<5;i++){
      g.save(); g.translate(cx,cy); g.rotate(i*Math.PI*2/5);
      g.fillStyle=p.accent;
      g.beginPath(); g.ellipse(0,-pr*.6,pr*.3,pr*.7,0,0,Math.PI*2); g.fill();
      g.restore();
    }
    // center
    g.fillStyle=p.sub; g.globalAlpha=.95;
    g.beginPath(); g.arc(cx,cy,t*.06,0,Math.PI*2); g.fill();
    // stamen lines
    g.strokeStyle=p.sub; g.globalAlpha=.5; g.lineWidth=1.5;
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3, r=t*.1;
      g.beginPath(); g.moveTo(cx,cy);
      g.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); g.stroke();
    }

    // ── 大きな葉 ──
    g.globalAlpha=.7; g.fillStyle=p.dark;
    g.beginPath();
    g.moveTo(t*.02, t*.78);
    g.bezierCurveTo(t*.15,t*.5, t*.4,t*.42, t*.65,t*.55);
    g.bezierCurveTo(t*.4,t*.62, t*.18,t*.72, t*.02,t*.78);
    g.fill();
    // leaf vein
    g.strokeStyle=p.base; g.globalAlpha=.4; g.lineWidth=2;
    g.beginPath(); g.moveTo(t*.05,t*.76);
    g.bezierCurveTo(t*.2,t*.58, t*.4,t*.5, t*.6,t*.56); g.stroke();
    // secondary veins
    g.globalAlpha=.25; g.lineWidth=1;
    for(let i=1;i<5;i++){
      const px=t*(.1+i*.1), py=t*(.72-i*.04);
      g.beginPath(); g.moveTo(px,py);
      g.lineTo(px+t*.08, py-t*.08); g.stroke();
    }

    // ── 第2の葉(右下) ──
    g.globalAlpha=.55; g.fillStyle=p.dark;
    g.beginPath();
    g.moveTo(t*.55, t*.82);
    g.bezierCurveTo(t*.65,t*.65, t*.82,t*.6, t*.96,t*.68);
    g.bezierCurveTo(t*.84,t*.72, t*.68,t*.78, t*.55,t*.82);
    g.fill();

    // ── 波模様 ──
    g.strokeStyle=p.accent; g.globalAlpha=.35; g.lineWidth=3;
    g.beginPath(); g.moveTo(0,t*.94);
    g.quadraticCurveTo(t*.25,t*.82, t*.5,t*.94);
    g.quadraticCurveTo(t*.75,t*1.06, t,t*.94); g.stroke();

    // ── 小花 ──
    g.fillStyle=p.accent; g.globalAlpha=.6;
    [[t*.78,t*.18,t*.04],[t*.88,t*.35,t*.03],[t*.15,t*.92,t*.035]].forEach(([fx,fy,fr])=>{
      for(let i=0;i<5;i++){
        g.save(); g.translate(fx,fy); g.rotate(i*Math.PI*2/5);
        g.beginPath(); g.ellipse(0,-fr*2.5,fr,fr*2.2,0,0,Math.PI*2); g.fill();
        g.restore();
      }
      g.beginPath(); g.arc(fx,fy,fr*.8,0,Math.PI*2); g.fillStyle=p.sub; g.fill();
      g.fillStyle=p.accent;
    });

    g.restore();
  }

  /* ── Scene ── */
  function initScene(cv) {
    if(V.canvas===cv && V.renderer) return;
    if(V.renderer){cancelAnimationFrame(V.aid);V.renderer.dispose();}
    V.canvas=cv;
    V.scene=new THREE.Scene();
    V.scene.background=new THREE.Color("#e4efe8");
    V.camera=new THREE.PerspectiveCamera(34,1,.1,100);
    V.camera.position.set(0,2.2,V.zoom);
    V.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});
    V.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    if(THREE.SRGBColorSpace) V.renderer.outputColorSpace=THREE.SRGBColorSpace;
    V.renderer.shadowMap.enabled=true;
    V.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    if(THREE.ACESFilmicToneMapping) V.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    V.renderer.toneMappingExposure=1.1;
    // lights
    V.scene.add(new THREE.HemisphereLight("#fff","#bdd4c8",1.5));
    const k=new THREE.DirectionalLight("#fffef5",2.2);
    k.position.set(3,6,4); k.castShadow=true; k.shadow.mapSize.set(1024,1024);
    V.scene.add(k);
    const fillLight = new THREE.DirectionalLight("#d4f0ed", .9);
    fillLight.position.set(-4, 3, 2);
    V.scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight("#ffecd2", .5);
    rimLight.position.set(0, 2, -5);
    V.scene.add(rimLight);
    // floor
    const fl=new THREE.Mesh(new THREE.CircleGeometry(2.2,80),new THREE.MeshStandardMaterial({color:"#d5e2dc",roughness:.9}));
    fl.rotation.x=-Math.PI/2; fl.position.y=-.02; fl.receiveShadow=true; V.scene.add(fl);
    const rg=new THREE.Mesh(new THREE.TorusGeometry(2.15,.015,8,120),new THREE.MeshStandardMaterial({color:"#16727d",roughness:.5}));
    rg.rotation.x=-Math.PI/2; rg.position.y=-.01; V.scene.add(rg);
    V.root=new THREE.Group(); V.scene.add(V.root);
    bindCtrl(cv); animate();
  }

  function bindCtrl(cv){
    cv.addEventListener("pointerdown",e=>{
      V.drag={x:e.clientX,a:V.target}; cv.setPointerCapture(e.pointerId); cv.style.cursor="grabbing";
    });
    cv.addEventListener("pointermove",e=>{ if(V.drag) V.target=V.drag.a+(e.clientX-V.drag.x)*.012; });
    const up=e=>{ V.drag=null; cv.style.cursor="grab"; if(cv.hasPointerCapture(e.pointerId))cv.releasePointerCapture(e.pointerId); };
    cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",up);
    cv.addEventListener("wheel",e=>{ e.preventDefault(); V.zoom=THREE.MathUtils.clamp(V.zoom+e.deltaY*.005,3.5,9); },{passive:false});
  }

  /* ── Mannequin ── */
  function makeBody(bs) {
    const g=new THREE.Group();
    const sk=new THREE.MeshStandardMaterial({color:"#c89570",roughness:.62,metalness:.01});
    // head
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.22,32,24),sk);
    hd.position.y=2.92; hd.scale.set(.88,1.06,.84); hd.castShadow=true; g.add(hd);
    // neck
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.18,16),sk);
    nk.position.y=2.72; nk.castShadow=true; g.add(nk);
    // torso (BODY under shirt — only lower arms & legs visible)
    // upper arms visible below sleeve
    [-1,1].forEach(s=>{
      // forearm (below sleeve)
      const fa=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.46,8,16),sk);
      fa.position.set(s*.58*bs,1.62,.04); fa.rotation.z=s*.1; fa.castShadow=true; g.add(fa);
      // hand
      const h=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),sk);
      h.position.set(s*.6*bs,1.32,.06); h.scale.set(1,1.2,.6); g.add(h);
    });
    // legs
    [-.16,.16].forEach(xo=>{
      const ul=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.56,8,16),sk);
      ul.position.set(xo,.88,0); ul.castShadow=true; g.add(ul);
      const ll=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.5,8,16),sk);
      ll.position.set(xo,.3,.02); ll.castShadow=true; g.add(ll);
    });
    return g;
  }

  /* ── Shirt that fits the body ── */
  function makeShirt(pal, edit, prop, ss) {
    const g=new THREE.Group(), S=ss;
    const tex=makeTex(pal,edit,prop);
    const fm=new THREE.MeshStandardMaterial({map:tex,roughness:.76,metalness:.01,side:THREE.DoubleSide});
    const seam=new THREE.MeshStandardMaterial({color:"#1d2e31",roughness:.7});

    // Torso — fits directly over mannequin body
    // Using LatheGeometry that matches mannequin +offset for cloth thickness
    const off=.06; // cloth offset
    const prof=[
      new THREE.Vector2(.40*S+off, 0),     // hem (bottom)
      new THREE.Vector2(.39*S+off, .12),
      new THREE.Vector2(.38*S+off, .28),    // lower waist
      new THREE.Vector2(.40*S+off, .48),
      new THREE.Vector2(.46*S+off, .68),    // mid torso
      new THREE.Vector2(.50*S+off, .85),    // chest
      new THREE.Vector2(.48*S+off, .98),
      new THREE.Vector2(.42*S+off, 1.08),   // shoulder area
      new THREE.Vector2(.28*S+off, 1.18),   // neck opening
    ];
    const bodyGeo=new THREE.LatheGeometry(prof,64);
    const body=new THREE.Mesh(bodyGeo,fm);
    body.position.y=1.42; body.scale.z=.56; body.castShadow=true; g.add(body);

    // Placket
    const pk=new THREE.Mesh(new THREE.BoxGeometry(.02,1.16,.008),seam);
    pk.position.set(0,1.98,.28*S); g.add(pk);

    // Buttons
    const bc=edit.button==="白蝶貝風"?"#f2edd8":edit.button==="木目風"?"#8b5c36":"#222e30";
    const bm=new THREE.MeshStandardMaterial({color:bc,roughness:.35,metalness:.2});
    for(let i=0;i<5;i++){
      const b=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.006,16),bm);
      b.position.set(0, 2.32-i*.22, .29*S); b.rotation.x=Math.PI/2; g.add(b);
    }

    // Hem seam
    const hm=new THREE.Mesh(new THREE.TorusGeometry(.40*S+off,.008,8,80),seam);
    hm.position.y=1.42; hm.scale.z=.57; hm.rotation.x=Math.PI/2; g.add(hm);

    // Sleeves — covering upper arms
    [-1,1].forEach(side=>{
      const slG=new THREE.CylinderGeometry(.08,.18,.48,32,1,true);
      const sl=new THREE.Mesh(slG,fm);
      sl.position.set(side*.54*S, 2.16, .02);
      sl.rotation.z=side*(Math.PI/2-.4);
      sl.rotation.y=side*.15;
      sl.castShadow=true; g.add(sl);
      // sleeve hem
      const sh=new THREE.Mesh(new THREE.TorusGeometry(.18,.006,8,40),seam);
      sh.position.set(side*.64*S, 1.92, .04);
      sh.rotation.z=sl.rotation.z;
      g.add(sh);
    });

    // Collar
    const cm=new THREE.MeshStandardMaterial({color:"#fbfaf0",roughness:.65,side:THREE.DoubleSide});
    const ct=edit.collar||prop.collar||"開襟";
    if(ct==="ボタンダウン"||ct==="スタンドカラー"){
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.24*S,.26*S,.1,32,1,true),cm);
      band.position.y=2.52; band.scale.z=.5; g.add(band);
    } else {
      // Open collar flaps
      for(let s=-1;s<=1;s+=2){
        const flap=new THREE.Mesh(new THREE.PlaneGeometry(.18,.28),cm);
        flap.position.set(s*.14, 2.48, .24*S);
        flap.rotation.set(-.3, s*.25, s*-.18);
        g.add(flap);
      }
    }

    // Pocket
    const pm=new THREE.MeshStandardMaterial({color:"#fff",transparent:true,opacity:.15});
    const pocket=new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.006),pm);
    pocket.position.set(.22*S, 2.08, .28*S); g.add(pocket);

    // Logo
    const lp=edit.logo||prop.logo;
    if(lp!=="none") g.add(makeLogo(lp,S));

    return g;
  }

  function makeLogo(pos,S){
    const c=document.createElement("canvas"); c.width=256;c.height=128;
    const g=c.getContext("2d");
    g.fillStyle="rgba(20,32,34,.7)"; g.fillRect(4,4,248,120);
    g.fillStyle="#fff"; g.font="bold 40px sans-serif";
    g.textAlign="center"; g.textBaseline="middle"; g.fillText("LOGO",128,66);
    const t=new THREE.CanvasTexture(c);
    if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.24,.12),new THREE.MeshBasicMaterial({map:t,transparent:true}));
    if(pos==="back"){m.position.set(0,2.1,-.28*S);m.rotation.y=Math.PI;}
    else if(pos==="sleeve"){m.position.set(-.62*S,2.14,.08);m.rotation.y=Math.PI/2;}
    else{m.position.set(.22*S,2.18,.29*S);}
    return m;
  }

  /* ── Guides ── */
  function makeGuides(fit){
    const g=new THREE.Group();
    const ec=fit.chestEase<8?"#d75c4f":fit.chestEase>24?"#d7a33f":"#16727d";
    const r=new THREE.Mesh(new THREE.TorusGeometry(.58,.008,8,80),new THREE.MeshBasicMaterial({color:ec,transparent:true,opacity:.6}));
    r.position.y=2.0; r.scale.z=.52; r.rotation.x=Math.PI/2; g.add(r);
    const lm=new THREE.LineBasicMaterial({color:"#16727d",transparent:true,opacity:.5});
    [[new THREE.Vector3(-.58,2.44,.36),new THREE.Vector3(.58,2.44,.36)],
     [new THREE.Vector3(-.66,2.0,.36),new THREE.Vector3(.66,2.0,.36)],
     [new THREE.Vector3(-.72,2.44,.34),new THREE.Vector3(-.72,1.4,.34)]
    ].forEach(([a,b])=>g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),lm)));
    return g;
  }

  /* ── Rebuild ── */
  function rebuild(payload){
    console.log("[3D] rebuild()");
    try{
      V.last=payload;
      const ct=document.getElementById("modelPreview");
      if(!ct){console.warn("[3D] #modelPreview missing");return;}
      let cv=ct.querySelector("canvas.tryon-canvas");
      if(!cv){
        ct.classList.add("three-tryon");
        cv=document.createElement("canvas"); cv.className="tryon-canvas";
        cv.style.cssText="width:100%;height:100%;display:block;cursor:grab;touch-action:none;border-radius:12px;";
        ct.innerHTML=""; ct.appendChild(cv);
      }
      initScene(cv);
      // clear
      while(V.root.children.length){
        const c=V.root.children.pop();
        c.traverse(o=>{
          if(o.geometry)o.geometry.dispose();
          if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
            Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();}); m.dispose();
          });
        });
      }
      const {proposal,palettes,edit,model,fit} = payload;
      const pal = palettes[edit.palette] || palettes[proposal.palette];
      const bs = {slim:.88,normal:1,strong:1.14}[model.body] || 1;
      const ss = (fit && fit.selected && fit.selected.chest ? fit.selected.chest : 110) / 110;
      V.mannequin = makeBody(bs); V.mannequin.visible = V.body; V.root.add(V.mannequin);
      V.shirt = makeShirt(pal,edit,proposal,ss,payload.assets); V.root.add(V.shirt);
      if(fit) V.root.add(makeGuides(fit));
      const va = {front:0,side:Math.PI/2,back:Math.PI};
      V.target = va[model.view] !== undefined ? va[model.view] : THREE.MathUtils.degToRad(((Number(model.rotation)||0)%360+360)%360);
      V.angle = V.target; resize();
      console.log("[3D] rebuild complete");
    }catch(e){console.error("[3D] error:",e);}
  }

  function resize(){
    if(!V.renderer||!V.canvas)return;
    const p=V.canvas.parentElement; if(!p)return;
    const r=p.getBoundingClientRect();
    const w=Math.max(320,Math.floor(r.width)), h=Math.max(420,Math.floor(r.height));
    V.renderer.setSize(w,h,false); V.camera.aspect=w/h; V.camera.updateProjectionMatrix();
  }

  function animate(){
    V.aid=requestAnimationFrame(animate);
    if(!V.renderer)return;
    V.camera.position.z+=(V.zoom-V.camera.position.z)*.08;
    V.camera.lookAt(0,1.8,0);
    if(V.root){V.angle+=(V.target-V.angle)*.12; V.root.rotation.y=V.angle;}
    V.renderer.render(V.scene,V.camera);
  }

  window.addEventListener("kariyushi:render3d",e=>rebuild(e.detail));
  window.addEventListener("resize",resize);
  window.KariyushiThreeViewer={rebuild, toggleBody(){V.body=!V.body;if(V.mannequin)V.mannequin.visible=V.body;}};
  if(window.KariyushiLatest3D)rebuild(window.KariyushiLatest3D);
})();
