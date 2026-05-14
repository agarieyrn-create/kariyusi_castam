/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Settings, 
  User, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Layers, 
  Image as ImageIcon,
  Zap,
  Info,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { ShirtPreview } from './components/ShirtPreview';
import { Manikin } from './components/Manikin';
import { 
  DesignState, 
  CollarType, 
  ButtonType, 
  UserMeasurements,
  Pattern
} from './types';
import { PATTERNS, COLORS, SIZE_CHART } from './data/mockData';

const INITIAL_DESIGN: DesignState = {
  usage: 'Business',
  impression: 'Clean',
  baseColor: '#fdfcf0',
  accentColor: '#0070bc',
  patternId: 'p1',
  patternDensity: 0.6,
  patternSize: 1,
  collar: CollarType.OPEN,
  button: ButtonType.WOOD,
  logoPosition: 'left-chest'
};

const INITIAL_MEASUREMENTS: UserMeasurements = {
  height: 175,
  chest: 96,
  shoulder: 46,
  waist: 82,
};

type Step = 'input' | 'proposals' | 'editor' | 'sizing' | 'review';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [design, setDesign] = useState<DesignState>(INITIAL_DESIGN);
  const [measurements, setMeasurements] = useState<UserMeasurements>(INITIAL_MEASUREMENTS);
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number | null>(null);

  // Simulated AI Proposals
  const proposals = useMemo(() => [
    { ...INITIAL_DESIGN, name: 'Traditional Coastal', baseColor: '#fdfcf0', accentColor: '#0070bc', patternId: 'p2' },
    { ...INITIAL_DESIGN, name: 'Modern Sunset', baseColor: '#f15a24', accentColor: '# Sandy White', patternId: 'p4', collar: CollarType.MAO },
    { ...INITIAL_DESIGN, name: 'Shuri Heritage', baseColor: '#be0032', accentColor: '# Sandy White', patternId: 'p3' },
  ], []);

  const recommendedSize = useMemo(() => {
    const diffs = SIZE_CHART.map(s => ({
      ...s,
      score: Math.abs(s.chest - (measurements.chest + 12)) + Math.abs(s.shoulder - measurements.shoulder)
    }));
    return diffs.sort((a, b) => a.score - b.score)[0];
  }, [measurements]);

  const updateDesign = (updates: Partial<DesignState>) => {
    setDesign(prev => ({ ...prev, ...updates }));
  };

  const navTo = (nextStep: Step) => setStep(nextStep);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1a1a1a] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-bottom border-gray-100 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic">K</div>
          <div>
            <h1 className="text-xl font-medium tracking-tight">Kariyushi Custom Studio</h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">沖縄デザインエンジン v1.0</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {[
            { key: 'input', label: '条件入力' },
            { key: 'proposals', label: '提案比較' },
            { key: 'editor', label: 'デザイン編集' },
            { key: 'sizing', label: 'サイズ確認' },
            { key: 'review', label: '最終確認' }
          ].map((s, i) => (
            <div key={s.key} className="flex items-center">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${step === s.key ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                {i + 1}. {s.label}
              </span>
              {i < 4 && <div className="w-4 h-[1px] bg-gray-100 mx-1" />}
            </div>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-light leading-tight mb-4">
                    あなただけの<span className="italic font-serif text-blue-600">特別なかかりゆし</span>を。
                  </h2>
                  <p className="text-gray-500 max-w-md">
                    一着一着に想いを込めて。用途や好みのスタイルを選択するだけで、AIが最適なデザイン案を生成します。
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">着用シーン</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['ビジネス', 'ウェディング', 'カジュアル', 'ユニフォーム'].map(u => (
                        <button
                          key={u}
                          onClick={() => updateDesign({ usage: u })}
                          className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${design.usage === u ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">全体の印象</label>
                    <div className="flex flex-wrap gap-2">
                      {['清潔感', 'ダイナミック', '伝統的', 'モダン', 'トロピカル'].map(imp => (
                        <button
                          key={imp}
                          onClick={() => updateDesign({ impression: imp })}
                          className={`px-4 py-2 rounded-full border text-xs transition-all ${design.impression === imp ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navTo('proposals')}
                  className="group flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  デザイン案を生成する
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-orange-50 rounded-[40px] opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
                <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl border-8 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1574182245530-967d9b3831af?q=80&w=800&auto=format&fit=crop" 
                    alt="Kariyushi Inspiration"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex flex-col justify-end text-white">
                    <p className="text-xs font-mono tracking-widest uppercase opacity-70">Inspired by</p>
                    <h3 className="text-2xl font-serif italic">石垣島の碧い海</h3>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'proposals' && (
            <motion.div
              key="proposals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Zap className="w-3 h-3" /> AI生成結果
                </div>
                <h2 className="text-4xl font-light">おすすめのデザイン案</h2>
                <p className="text-gray-500">「{design.usage}」かつ「{design.impression}」なイメージで3つの方向性を提案します。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {proposals.map((p, idx) => (
                  <motion.div
                    key={p.name}
                    whileHover={{ y: -8 }}
                    className={`relative p-6 rounded-3xl bg-white border-2 transition-all cursor-pointer ${selectedProposalIndex === idx ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    onClick={() => {
                      setSelectedProposalIndex(idx);
                      setDesign(p);
                    }}
                  >
                    <ShirtPreview design={p} />
                    <div className="mt-6 flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-medium">{p.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{p.impression}スタイル</p>
                      </div>
                      {selectedProposalIndex === idx && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => navTo('input')}
                  className="px-8 py-4 rounded-full border border-gray-200 font-medium hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> 前に戻る
                </button>
                <button 
                  disabled={selectedProposalIndex === null}
                  onClick={() => navTo('editor')}
                  className="px-8 py-4 rounded-full bg-gray-900 text-white font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-2"
                >
                  この案を編集する
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-12"
            >
              {/* Preview - Left Col */}
              <div className="xl:col-span-7 space-y-6">
                <div className="sticky top-28">
                  <ShirtPreview design={design} />
                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <img 
                      src={PATTERNS.find(pt => pt.id === design.patternId)?.url} 
                      className="aspect-square rounded-xl object-cover border-2 border-white shadow-sm" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="col-span-3 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm font-medium">
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: design.baseColor }} />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">現在のカラー</p>
                        <p className="text-sm">{COLORS.find(c => c.value === design.baseColor)?.name || 'カスタム'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls - Right Col */}
              <div className="xl:col-span-5 space-y-10 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">柄と配色</h3>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => updateDesign({ baseColor: c.value })}
                        className={`w-10 h-10 rounded-full shrink-0 border-2 transition-transform hover:scale-110 ${design.baseColor === c.value ? 'border-gray-900 ring-4 ring-gray-100' : 'border-white'}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PATTERNS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateDesign({ patternId: p.id })}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${design.patternId === p.id ? 'border-blue-600' : 'border-transparent hover:border-gray-200'}`}
                      >
                        <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {design.patternId === p.id && <div className="absolute inset-0 bg-blue-600/10" />}
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-medium text-gray-400 uppercase">
                        <span>柄の密度</span>
                        <span>{Math.round(design.patternDensity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={design.patternDensity} 
                        onChange={(e) => updateDesign({ patternDensity: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-medium text-gray-400 uppercase">
                        <span>柄のサイズ</span>
                        <span>{design.patternSize.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2" step="0.1" 
                        value={design.patternSize} 
                        onChange={(e) => updateDesign({ patternSize: parseFloat(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">ディテール設定</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-gray-400 uppercase">襟の形状</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(CollarType).map(c => (
                          <button
                            key={c}
                            onClick={() => updateDesign({ collar: c })}
                            className={`px-4 py-2 rounded-xl border text-xs transition-all ${design.collar === c ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-gray-400 uppercase">ロゴ位置</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['none', 'left-chest', 'sleeve'].map(pos => (
                          <button
                            key={pos}
                            //@ts-ignore
                            onClick={() => updateDesign({ logoPosition: pos })}
                            className={`px-3 py-2 rounded-xl border text-[10px] capitalize transition-all ${design.logoPosition === pos ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}`}
                          >
                            {pos === 'none' ? 'なし' : pos === 'left-chest' ? '左胸' : '袖'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => navTo('proposals')}
                    className="flex-1 py-4 px-6 rounded-full border border-gray-200 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> 戻る
                  </button>
                  <button 
                    onClick={() => navTo('sizing')}
                    className="flex-[2] py-4 px-6 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2 group shadow-lg shadow-blue-100"
                  >
                    サイズと適合感を確認
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'sizing' && (
            <motion.div
              key="sizing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              <div className="space-y-8 sticky top-28">
                 <div>
                  <h2 className="text-3xl font-light mb-2">あなたに最適なサイズを。</h2>
                  <p className="text-gray-500">身体の寸法を入力すると、推奨サイズ「{recommendedSize.label}」の着用状況を確認できます。</p>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">身長 (cm)</label>
                    <input 
                      type="number" value={measurements.height}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">胸囲 (cm)</label>
                    <input 
                      type="number" value={measurements.chest}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, chest: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">肩幅 (cm)</label>
                    <input 
                      type="number" value={measurements.shoulder}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, shoulder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">胴囲 (cm)</label>
                    <input 
                      type="number" value={measurements.waist}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, waist: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                <div className="p-6 bg-blue-600 rounded-[32px] text-white">
                  <div className="flex items-center gap-2 mb-4 opacity-80 uppercase text-[10px] font-bold tracking-widest">
                    <Info className="w-3 h-3" /> 推奨サイズ
                  </div>
                  <div className="flex items-end gap-4">
                    <span className="text-7xl font-light leading-none">{recommendedSize.label}</span>
                    <p className="text-sm opacity-90 pb-2">
                      胸囲{measurements.chest}cmに基づき、<br />
                      ゆったりとした島時間を楽しめる{recommendedSize.label}サイズが最適です。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => navTo('editor')}
                    className="flex-1 py-4 rounded-full border border-gray-200 font-medium hover:bg-gray-50"
                  >
                    デザインを再調整
                  </button>
                  <button 
                    onClick={() => navTo('review')}
                    className="flex-[2] bg-gray-900 text-white py-4 rounded-full font-medium hover:bg-black"
                  >
                    最終確認へ
                  </button>
                </div>
              </div>

              <div className="bg-[#f0f0ed] rounded-[40px] p-12">
                 <Manikin measurements={measurements} shirtChest={recommendedSize.chest} />
                 
                 <div className="mt-12 space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-blue-600">模型シミュレート詳細</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: '胸元のゆとり', value: `+${recommendedSize.chest - measurements.chest}cm` },
                        { label: '着丈', value: `${recommendedSize.length}cm` },
                        { label: '肩幅', value: `${recommendedSize.shoulder}cm` },
                        { label: 'フィット感', value: 'リラックス' }
                      ].map(stat => (
                        <div key={stat.label} className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl">
                          <p className="text-[10px] text-gray-500 uppercase font-medium">{stat.label}</p>
                          <p className="text-lg font-medium">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-light">オーダー内容の確認</h2>
                <p className="text-gray-500">製作を開始する前に、デザインと仕様の最終確認を行ってください。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <ShirtPreview design={design} />
                  <div className="flex gap-4">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                      <ImageIcon className="w-4 h-4" /> 画像を保存
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                      <Maximize2 className="w-4 h-4" /> 生地詳細を見る
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">コンセプト仕様</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm">用途</span>
                        <span className="font-medium text-blue-600">{design.usage}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm">印象</span>
                        <span className="font-medium text-blue-600">{design.impression}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm">襟の形状</span>
                        <span className="font-medium">{design.collar}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm">選択された柄</span>
                        <span className="font-medium">{PATTERNS.find(p => p.id === design.patternId)?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">選択されたサイズ</h3>
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                          {recommendedSize.label}
                        </div>
                        <div>
                          <p className="text-sm font-medium">スタンダードフィット</p>
                          <p className="text-xs text-gray-400">身長{measurements.height}cm向けに最適化</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-900 rounded-[32px] text-white">
                 <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">概算お見積り</h3>
                      <FileText className="w-4 h-4 opacity-50" />
                    </div>
                    <div className="space-y-2 mb-8">
                      <div className="flex justify-between text-2xl font-light">
                        <span>単価 (税込)</span>
                        <span>¥12,800</span>
                      </div>
                      <p className="text-xs opacity-50 italic">素材調達、デジタルプリント、縫製工賃を含みます。</p>
                    </div>
                    <button className="w-full bg-white text-gray-900 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors">
                      仕様書を保存して問い合わせ
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center pt-8">
                <button 
                  onClick={() => navTo('sizing')}
                  className="text-gray-400 text-sm font-medium hover:text-gray-600 underline underline-offset-8"
                >
                  サイズを修正する
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-gray-100 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold italic">K</div>
              <span className="font-bold tracking-tight">Kariyushi Custom Studio</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              沖縄の伝統的なクラフトマンシップと、最新のAI技術を融合。アイランド・デジタル・イノベーションの一環として提供されています。
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900">製作プロセス</h4>
            <ul className="text-xs text-gray-500 space-y-2">
              <li>スマートパターン生成</li>
              <li>那覇市内での素材調達</li>
              <li>環境配慮型デジタルプリント</li>
              <li>県内工房での一貫縫製</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900">お問い合わせ</h4>
            <p className="text-xs text-gray-500">support@kariyushi-custom.jp</p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                <Layers className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-gray-400 tracking-widest leading-loose">
            © 2026 KARIYUSHI CUSTOM STUDIO - DIGITAL TWIN PROTOTYPE
          </p>
          <div className="flex gap-8 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <span>利用規約</span>
            <span>プライバシー</span>
            <span>稼働状況: 良好</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
