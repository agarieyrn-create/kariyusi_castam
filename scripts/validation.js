/** @typedef {{scene:string,mood:string,palette:string,motif:string,quantity:number}} Brief */
/** @typedef {{palette:string,logo:string,collar:string,button:string,density:number,scale:number,assetId:string}} EditState */

export const LIMITS = Object.freeze({ quantity: { min: 1, max: 10000 }, density: { min: 1, max: 100 }, scale: { min: 50, max: 180 }, dimensions: { min: 120, max: 240 } });

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function validateQuantity(value) { return Math.round(clampNumber(value, LIMITS.quantity.min, LIMITS.quantity.max, 50)); }
export function validateDensity(value) { return Math.round(clampNumber(value, LIMITS.density.min, LIMITS.density.max, 48)); }
export function validateScale(value) { return Math.round(clampNumber(value, LIMITS.scale.min, LIMITS.scale.max, 100)); }

export function validateBrief(input = {}, defaults = {}) {
  return Object.freeze({
    scene: typeof input.scene === 'string' && input.scene.trim() ? input.scene.trim().slice(0, 80) : defaults.scene || 'ホテル・店舗制服',
    mood: typeof input.mood === 'string' && input.mood.trim() ? input.mood.trim().slice(0, 40) : defaults.mood || '上品',
    palette: typeof input.palette === 'string' && input.palette.trim() ? input.palette.trim().slice(0, 40) : defaults.palette || '海風ブルー',
    motif: typeof input.motif === 'string' && input.motif.trim() ? input.motif.trim().slice(0, 40) : defaults.motif || 'AIに任せる',
    quantity: validateQuantity(input.quantity ?? defaults.quantity)
  });
}

export function validateEdit(input = {}, defaults = {}) {
  return Object.freeze({
    palette: typeof input.palette === 'string' ? input.palette.slice(0, 40) : defaults.palette || '海風ブルー',
    logo: typeof input.logo === 'string' ? input.logo.slice(0, 40) : defaults.logo || 'leftChest',
    collar: typeof input.collar === 'string' ? input.collar.slice(0, 40) : defaults.collar || '開襟',
    button: typeof input.button === 'string' ? input.button.slice(0, 40) : defaults.button || '黒蝶貝風',
    density: validateDensity(input.density ?? defaults.density),
    scale: validateScale(input.scale ?? defaults.scale),
    assetId: typeof input.assetId === 'string' ? input.assetId.slice(0, 80) : defaults.assetId || ''
  });
}

export function validateModel(input = {}, defaults = {}) {
  return Object.freeze({ ...defaults, ...input, height: clampNumber(input.height, 120, 240, defaults.height || 170), chest: clampNumber(input.chest, 50, 180, defaults.chest || 92), waist: clampNumber(input.waist, 50, 180, defaults.waist || 82), shoulder: clampNumber(input.shoulder, 25, 80, defaults.shoulder || 44) });
}
