import * as core from '../renderers.js';

/** 提案カードの描画責務。 */
export const proposalRenderer = Object.freeze({ render: core.renderProposals, renderHero: core.renderHero });
/** 素材ギャラリーの描画責務。 */
export const assetRenderer = Object.freeze({ render: core.renderAssets });
/** 編集プレビューの描画責務。 */
export const editorRenderer = Object.freeze({ render: core.renderEditor });
/** 採寸・3D表示の描画責務。 */
export const modelRenderer = Object.freeze({ render: core.renderModel, fitAnalysis: core.fitAnalysis });
/** 見積・仕様書の描画責務。 */
export const estimateRenderer = Object.freeze({ renderFitReport: core.renderFitReport, renderDesignNotes: core.renderDesignNotes, renderSpec: core.renderSpec });

export const { esc, renderHero, renderProposals, renderAssets, renderEditor, renderModel, renderFitReport, renderDesignNotes, renderSpec, fitAnalysis, designScore, shirtSvg } = core;
