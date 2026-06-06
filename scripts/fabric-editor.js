(function () {
  "use strict";

  let fabricCanvas = null;
  let onDesignChange = null;
  const DEFAULT_UPLOAD_RULES = {
    allowedLogoTypes: ["image/png", "image/jpeg", "image/webp"],
    maxLogoBytes: 2 * 1024 * 1024,
    maxLogoPixels: 16 * 1000 * 1000
  };

  function uploadRules() {
    return window.KariyushiConfig?.upload || DEFAULT_UPLOAD_RULES;
  }

  function validateLogoFile(file) {
    const rules = uploadRules();
    if (!file) throw new Error("画像ファイルを選択してください。");
    if (!rules.allowedLogoTypes.includes(file.type)) {
      throw new Error("ロゴ画像は PNG / JPEG / WebP のみ対応しています。");
    }
    if (file.size > rules.maxLogoBytes) {
      throw new Error(`ロゴ画像は ${Math.round(rules.maxLogoBytes / 1024 / 1024)}MB 以下にしてください。`);
    }
  }

  function checkMagicBytes(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = function(e) {
        if (e.target.readyState !== FileReader.DONE) {
          resolve(false);
          return;
         }
        const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
        let header = "";
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16).toUpperCase();
        }
        const isPng = header.startsWith("89504E47");
        const isJpeg = header.startsWith("FFD8FF");
        const isWebp = header.startsWith("52494646"); // RIFF (WebP)
        if (isPng || isJpeg || isWebp) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  async function validateImageDimensions(dataUrl) {
    const rules = uploadRules();
    const image = new Image();
    image.decoding = "async";
    image.src = dataUrl;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > rules.maxLogoPixels) {
      throw new Error("画像サイズが大きすぎます。縦横を小さくしてから再度選択してください。");
    }
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("画像ファイルを読み込めませんでした。"));
      reader.readAsDataURL(file);
    });
  }

  function init(canvasId, onChange) {
    const el = document.getElementById(canvasId);
    if (!el) return null;
    onDesignChange = onChange;

    fabricCanvas = new fabric.Canvas(canvasId, {
      width: 512,
      height: 512,
      backgroundColor: "transparent",
      selection: true
    });

    fabricCanvas.on("object:modified", fireChange);
    fabricCanvas.on("object:added", fireChange);
    fabricCanvas.on("object:removed", fireChange);
    return fabricCanvas;
  }

  function fireChange() {
    if (onDesignChange) onDesignChange(getDesignDataUrl(), toJSON());
  }

  /* ── Logo Upload ── */
  async function addLogo(file) {
    if (!fabricCanvas) throw new Error("編集キャンバスを初期化できていません。");
    validateLogoFile(file);
    const isValidMagic = await checkMagicBytes(file);
    if (!isValidMagic) {
      throw new Error("ファイルの拡張子と実際のデータ形式が一致しません。正しい画像ファイルを選択してください。");
    }
    const dataUrl = await readAsDataUrl(file);
    await validateImageDimensions(dataUrl);
    return new Promise((resolve, reject) => {
      try {
        fabric.Image.fromURL(
          dataUrl,
          (img) => {
            if (!img || !img.width || !img.height) {
              reject(new Error("画像データを確認できませんでした。"));
              return;
            }
            const maxSize = 180;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            img.set({
              left: 256 - (img.width * scale) / 2,
              top: 140,
              scaleX: scale,
              scaleY: scale,
              cornerColor: "#16727d",
              cornerStrokeColor: "#fff",
              cornerSize: 10,
              transparentCorners: false,
              _type: "logo"
            });
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
            resolve(img);
          },
          { crossOrigin: "anonymous" }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ── Text Input ── */
  function addText(value, options = {}) {
    const text = new fabric.IText(value || "OKINAWA", {
      left: 180,
      top: 340,
      fontFamily: options.font || "Noto Sans JP",
      fontSize: options.fontSize || 36,
      fill: options.color || "#172326",
      stroke: options.stroke || "",
      strokeWidth: options.strokeWidth || 0,
      fontWeight: options.bold ? "bold" : "normal",
      textAlign: "center",
      cornerColor: "#16727d",
      cornerStrokeColor: "#fff",
      cornerSize: 10,
      transparentCorners: false,
      _type: "text"
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    return text;
  }

  /* ── Delete Selected ── */
  function deleteSelected() {
    const active = fabricCanvas.getActiveObject();
    if (active) {
      fabricCanvas.remove(active);
      fabricCanvas.renderAll();
    }
  }

  /* ── Clear All ── */
  function clearAll() {
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "transparent";
    fabricCanvas.renderAll();
    fireChange();
  }

  /* ── Get Data URL ── */
  function getDesignDataUrl() {
    if (!fabricCanvas) return null;
    return fabricCanvas.toDataURL({ format: "png", multiplier: 2 });
  }

  /* ── Export as PNG download ── */
  function exportPNG(filename) {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: 2 });
    const base64Parts = dataUrl.split(",");
    const mime = base64Parts[0].match(/:(.*?);/)[1];
    const binStr = atob(base64Parts[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    const blob = new Blob([arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "kariyushi-design.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  /* ── Serialize / Deserialize ── */
  function toJSON() {
    if (!fabricCanvas) return null;
    return JSON.stringify(fabricCanvas.toJSON(["_type"]));
  }

  function fromJSON(json) {
    if (!fabricCanvas || !json) return;
    fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.renderAll();
      fireChange();
    });
  }

  /* ── Public API ── */
  window.KariyushiFabricEditor = {
    init,
    addLogo,
    addText,
    deleteSelected,
    clearAll,
    getDesignDataUrl,
    exportPNG,
    toJSON,
    fromJSON,
    getCanvas: () => fabricCanvas
  };
})();
