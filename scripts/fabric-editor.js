(function () {
  "use strict";

  let fabricCanvas = null;
  let onDesignChange = null;

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
  function addLogo(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
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
        });
      };
      reader.readAsDataURL(file);
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
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename || "kariyushi-design.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
