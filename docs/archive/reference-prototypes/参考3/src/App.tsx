/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  Palette, 
  Sparkles, 
  Settings, 
  Maximize2, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Layers,
  History,
  Download,
  Users,
  Target
} from 'lucide-react';
import { DesignConfig, AIProposal, SizeConfig, Vibe, Purpose } from './types';
import { generateProposals } from './services/geminiService';
import { ShirtPreview } from './components/ShirtPreview';
import { cn } from './lib/utils';

const INITIAL_CONFIG: DesignConfig = {
  purpose: 'Personal',
  vibe: 'Modern',
  baseColor: '#0066cc',
  motifs: ['Ocean'],
  quantity: 5,
  patternDensity: 0.5,
  patternSize: 0.5,
  collarType: 'ButtonDown',
  logoPosition: 'None',
  buttonType: 'Wood',
};

const MOTIFS = ['Ocean', 'Hibiscus', 'Shisa', 'Palm Leaves', 'Minsar Pattern', 'Geometric', 'Bird of Paradise', 'Coral'];
const VIBES: Vibe[] = ['Modern', 'Traditional', 'Pop', 'Elegant'];
const PURPOSES: Purpose[] = ['Uniform', 'Gift', 'Personal', 'Event'];

export default function App() {
  const [step, setStep] = useState(0);
  const [design, setDesign] = useState<DesignConfig>(INITIAL_CONFIG);
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [size, setSize] = useState<SizeConfig>({ height: 170, chest: 95, shoulderWidth: 45 });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const startGeneration = async () => {
    setIsLoading(true);
    setStep(2);
    const props = await generateProposals(design);
    setProposals(props);
    setIsLoading(false);
  };

  const selectProposal = (prop: AIProposal) => {
    setDesign(prev => ({
      ...prev,
      baseColor: prop.color,
      motifs: prop.motifs,
      aiProposalId: prop.id,
      imagePrompt: prop.imagePrompt
    }));
    nextStep();
  };

  const purposeLabels: Record<string, string> = {
    Personal: '個人用',
    Gift: 'ギフト',
    Uniform: '制服・ユニフォーム',
    Event: 'イベント・祭事'
  };
  const vibeLabels: Record<string, string> = {
    Modern: 'モダン',
    Traditional: '伝統的',
    Pop: 'ポップ',
    Elegant: 'エレガント'
  };
  const motifLabels: Record<string, string> = {
    Ocean: '海・波',
    Hibiscus: 'ハイビスカス',
    Shisa: 'シーサー',
    'Palm Leaves': 'ヤシの葉',
    'Minsar Pattern': 'ミンサー柄',
    Geometric: '幾何学模様',
    'Bird of Paradise': '極楽鳥花',
    Coral: 'サンゴ'
  };

  const collarLabels: Record<string, string> = {
    ButtonDown: 'ボタンダウン',
    OpenCollar: '開襟',
    StandCollar: 'マオカラー'
  };
  const buttonLabels: Record<string, string> = {
    Wood: '木製',
    Plastic: 'プラスチック',
    Pearl: '高瀬貝'
  };
  const logoLabels: Record<string, string> = {
    None: 'なし',
    Chest: '左胸',
    Sleeve: '袖口',
    Hem: '裾'
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1a1a1a] font-sans selection:bg-sky-100">
      {/* Navigation Rail / Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Kariyushi Design Studio</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Okinawa Original System</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-zinc-100 rounded-full p-1 border border-zinc-200">
          {[
            { id: 1, label: 'コンセプト', icon: Target },
            { id: 2, label: 'AI提案', icon: Sparkles },
            { id: 3, label: 'エディター', icon: Settings },
            { id: 4, label: 'サイズ', icon: Maximize2 },
            { id: 5, label: '仕様書', icon: FileText },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => step >= s.id && setStep(s.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all",
                step === s.id ? "bg-white text-sky-600 shadow-sm" : 
                step > s.id ? "text-zinc-600 hover:text-sky-600" : "text-zinc-400 cursor-not-allowed"
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="text-zinc-500 hover:text-[#1a1a1a] transition-colors">
            <History className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-zinc-200" />
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Est. Total</p>
            <p className="font-mono font-medium">¥{(design.quantity * 12800).toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 0: WELCOME */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-3xl mx-auto py-12"
            >
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-sky-200/50 blur-3xl rounded-full" />
                <img 
                  src="https://images.unsplash.com/photo-1621274098596-d341926615ee?w=800&q=80" 
                  alt="Kariyushi Texture" 
                  className="relative w-64 h-64 object-cover rounded-[32px] rotate-3 shadow-2xl border-4 border-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-5xl font-bold tracking-tight mb-6 leading-[1.1]">世界に一着だけの、<br/><span className="text-sky-600">かりゆしウェア</span>をデザイン。</h2>
              <p className="text-xl text-zinc-600 mb-10 leading-relaxed">
                沖縄の守り神、伝統の柄、そしてあなたの想いをAIがカタチにします。
                用途や好みを入力するだけで、本格的なデザインが完成します。
              </p>
              <button
                onClick={nextStep}
                className="group bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl text-lg font-bold flex items-center gap-3 hover:bg-sky-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                デザインを始める
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="grid grid-cols-3 gap-8 mt-24 text-left border-t border-zinc-200 pt-12">
                <div>
                  <h4 className="font-bold mb-2">AI提案</h4>
                  <p className="text-sm text-zinc-500">あなたの好みを分析し、3つの異なる切り口でデザインを提案します。</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">精密編集</h4>
                  <p className="text-sm text-zinc-500">柄の密度、衿の形、ボタンの種類までミリ単位で調整可能です。</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">自動採寸</h4>
                  <p className="text-sm text-zinc-500">身長と体型データを入力するだけで、最適なゆとり量を計算します。</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: CONCEPT */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-[1fr_400px] gap-12"
            >
              <div className="space-y-12">
                <section>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 block">01. 用途を選択</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {PURPOSES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setDesign({ ...design, purpose: p })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all",
                          design.purpose === p 
                            ? "border-sky-600 bg-sky-50 text-sky-700 shadow-md ring-4 ring-sky-100" 
                            : "border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <Users className={cn("w-6 h-6 mb-3", design.purpose === p ? "text-sky-600" : "text-zinc-400")} />
                        <span className="font-bold text-sm block">{purposeLabels[p] || p}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 block">02. デザインの雰囲気</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {VIBES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setDesign({ ...design, vibe: v })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all",
                          design.vibe === v 
                            ? "border-sky-600 bg-sky-50 text-sky-700" 
                            : "border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <Palette className={cn("w-6 h-6 mb-3", design.vibe === v ? "text-sky-600" : "text-zinc-400")} />
                        <span className="font-bold text-sm block">{vibeLabels[v] || v}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 block">03. モチーフ選択</label>
                  <div className="flex flex-wrap gap-2">
                    {MOTIFS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          const newMotifs = design.motifs.includes(m)
                            ? design.motifs.filter(x => x !== m)
                            : [...design.motifs, m];
                          setDesign({ ...design, motifs: newMotifs });
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium border-2 transition-all",
                          design.motifs.includes(m)
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        {motifLabels[m] || m}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 block">04. 予定枚数</label>
                    <div className="flex items-center gap-6">
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={design.quantity} 
                            onChange={(e) => setDesign({...design, quantity: parseInt(e.target.value)})}
                            className="flex-1 accent-sky-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="w-16 text-center font-mono font-bold text-lg">{design.quantity}枚</div>
                    </div>
                </section>
              </div>

              <div className="relative">
                <div className="sticky top-32 space-y-8 bg-sky-50/50 rounded-[32px] p-8 border border-sky-100">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">デザイン概要</h3>
                    <p className="text-sm text-zinc-500">選択した条件に基づいてAIが最適な案を作成します。</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-sky-200/50">
                      <span className="text-sm text-zinc-600">用途</span>
                      <span className="font-bold">{purposeLabels[design.purpose] || design.purpose}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-sky-200/50">
                      <span className="text-sm text-zinc-600">雰囲気</span>
                      <span className="font-bold">{vibeLabels[design.vibe] || design.vibe}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 py-3 border-b border-sky-200/50">
                      {design.motifs.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-bold rounded uppercase">{motifLabels[m] || m}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startGeneration}
                    disabled={design.motifs.length === 0}
                    className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    AI案を作成する
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>

                  <p className="text-[10px] text-zinc-400 text-center uppercase tracking-widest font-bold">
                    GenAI technology powered by Google Gemini
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROPOSALS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">生成されたデザイン案</h2>
                  <p className="text-zinc-500">3つの提案からベースとなるデザインを選択してください。</p>
                </div>
                <button onClick={() => setStep(1)} className="text-sm font-bold text-sky-600 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> 条件をやり直す
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[32px] p-8 space-y-6 border border-zinc-200 animate-pulse">
                      <div className="aspect-[3/4] bg-zinc-100 rounded-2xl" />
                      <div className="h-6 bg-zinc-100 rounded w-2/3" />
                      <div className="space-y-2">
                        <div className="h-4 bg-zinc-100 rounded" />
                        <div className="h-4 bg-zinc-100 rounded w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {proposals.map((prop, idx) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-white rounded-[32px] p-8 border border-zinc-200 hover:border-sky-300 transition-all hover:shadow-2xl overflow-hidden relative cursor-pointer"
                      onClick={() => selectProposal(prop)}
                    >
                      <ShirtPreview 
                        color={prop.color} 
                        collarType="ButtonDown" 
                        logoPosition="None" 
                        buttonType="Wood"
                        patternOpacity={0.8}
                        patternScale={1.2}
                        className="mb-8 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-2 py-1 rounded mb-3 inline-block">Option {idx + 1}</span>
                        <h3 className="text-2xl font-bold mb-3">{prop.name}</h3>
                        <p className="text-zinc-600 text-sm leading-relaxed">{prop.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-8">
                        {prop.motifs.map(m => (
                          <span key={m} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded">{m}</span>
                        ))}
                      </div>
                      <button className="w-full bg-zinc-100 text-[#1a1a1a] py-3 rounded-xl font-bold group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        これを選択する
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: EDITOR */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-[1fr_450px] gap-12"
            >
              <div className="flex flex-col gap-6">
                 <div className="bg-white rounded-[40px] p-12 border border-zinc-200 shadow-xl flex items-center justify-center sticky top-32 min-h-[600px]">
                    <ShirtPreview 
                        color={design.baseColor} 
                        collarType={design.collarType} 
                        logoPosition={design.logoPosition} 
                        buttonType={design.buttonType}
                        patternOpacity={design.patternDensity}
                        patternScale={2 - design.patternSize} // reverse for natural feel
                        className="w-full max-w-sm"
                    />
                 </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-zinc-200 space-y-10">
                   <h2 className="text-2xl font-bold tracking-tight">デザインの詳細編集</h2>

                   <section>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">ベースカラー</label>
                      <div className="flex gap-3">
                        {['#0066cc', '#cc3333', '#339966', '#f39c12', '#2c3e50', '#ffffff'].map(c => (
                           <button 
                             key={c}
                             onClick={() => setDesign({...design, baseColor: c})}
                             className={cn(
                               "w-10 h-10 rounded-full border-2 transition-all",
                               design.baseColor === c ? "border-sky-600 scale-110 shadow-lg" : "border-transparent"
                             )}
                             style={{ backgroundColor: c }}
                           />
                        ))}
                        <input 
                           type="color" 
                           value={design.baseColor} 
                           onChange={(e) => setDesign({...design, baseColor: e.target.value})}
                           className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
                        />
                      </div>
                   </section>

                   <section className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">柄の密度</label>
                          <span className="text-[10px] font-mono text-zinc-400">{Math.round(design.patternDensity * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05" 
                            value={design.patternDensity} 
                            onChange={(e) => setDesign({...design, patternDensity: parseFloat(e.target.value)})}
                            className="w-full accent-sky-600 h-1.5 bg-zinc-100 rounded-lg appearance-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">柄のサイズ</label>
                          <span className="text-[10px] font-mono text-zinc-400">×{(1 + design.patternSize).toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05" 
                            value={design.patternSize} 
                            onChange={(e) => setDesign({...design, patternSize: parseFloat(e.target.value)})}
                            className="w-full accent-sky-600 h-1.5 bg-zinc-100 rounded-lg appearance-none"
                        />
                      </div>
                   </section>

                   <section>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">衿のデザイン</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['ButtonDown', 'OpenCollar', 'StandCollar'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setDesign({...design, collarType: t})}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold border-2 transition-all",
                              design.collarType === t ? "border-sky-600 bg-sky-50 text-sky-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                            )}
                          >
                            {collarLabels[t] || t}
                          </button>
                        ))}
                      </div>
                   </section>

                   <section>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">ボタンの種類</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Wood', 'Plastic', 'Pearl'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setDesign({...design, buttonType: t})}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold border-2 transition-all",
                              design.buttonType === t ? "border-sky-600 bg-sky-50 text-sky-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                            )}
                          >
                            {buttonLabels[t] || t}
                          </button>
                        ))}
                      </div>
                   </section>

                   <section>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">ロゴ位置</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['None', 'Chest', 'Sleeve', 'Hem'] as const).map(l => (
                          <button
                            key={l}
                            onClick={() => setDesign({...design, logoPosition: l})}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold border-2 transition-all",
                              design.logoPosition === l ? "border-sky-600 bg-sky-50 text-sky-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                            )}
                          >
                            {logoLabels[l] || l}
                          </button>
                        ))}
                      </div>
                   </section>

                   <div className="pt-4 flex gap-4">
                      <button onClick={prevStep} className="flex-1 bg-zinc-100 text-[#1a1a1a] py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all">戻る</button>
                      <button onClick={nextStep} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
                        サイズ調整へ <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SIZE */}
          {step === 4 && (
            <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-12"
            >
                <div className="text-center">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">サイズ・フィッティング模型</h2>
                    <p className="text-zinc-500">あなたの体型データを入力し、ゆとり量を可視化します。</p>
                </div>

                <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
                    <div className="bg-white rounded-[32px] p-8 border border-zinc-200 space-y-8">
                        <section className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block">身長 (cm)</label>
                            <input 
                                type="number" 
                                value={size.height} 
                                onChange={(e) => setSize({...size, height: parseInt(e.target.value)})}
                                className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 focus:border-sky-600 outline-none transition-all font-mono font-bold"
                            />
                        </section>
                        <section className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block">胸囲 (cm)</label>
                            <input 
                                type="number" 
                                value={size.chest} 
                                onChange={(e) => setSize({...size, chest: parseInt(e.target.value)})}
                                className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 focus:border-sky-600 outline-none transition-all font-mono font-bold"
                            />
                        </section>
                        <section className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block">肩幅 (cm)</label>
                            <input 
                                type="number" 
                                value={size.shoulderWidth} 
                                onChange={(e) => setSize({...size, shoulderWidth: parseInt(e.target.value)})}
                                className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 focus:border-sky-600 outline-none transition-all font-mono font-bold"
                            />
                        </section>
                        
                        <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100">
                            <div className="flex items-center gap-2 text-sky-700 font-bold mb-3">
                                <Info className="w-4 h-4" />
                                <span className="text-sm">推奨サイズ: L</span>
                            </div>
                            <p className="text-xs text-sky-600 leading-relaxed font-medium">
                                かりゆしウェアは、胸囲に+15~20cmのゆとりを持たせると涼しく着用いただけます。
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="aspect-square bg-white rounded-[40px] border border-zinc-200/50 shadow-inner p-12 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                           {/* Simple Body Silhouette with Shirt Overlaid */}
                           <svg viewBox="0 0 400 550" className="w-full h-full relative z-10 drop-shadow-2xl opacity-40">
                              <path d="M 200 80 Q 150 80 150 150 L 150 500 L 250 500 L 250 150 Q 250 80 200 80" fill="#e5e7eb" />
                           </svg>
                           <div className="absolute inset-0 p-12 flex items-center justify-center">
                              <ShirtPreview 
                                color={design.baseColor} 
                                collarType={design.collarType} 
                                logoPosition={design.logoPosition} 
                                buttonType={design.buttonType}
                                patternOpacity={design.patternDensity}
                                patternScale={2 - design.patternSize}
                                className="w-full max-w-[280px] scale-110 opacity-90"
                              />
                           </div>
                           
                           {/* Size Indicators */}
                           <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 items-center">
                              <div className="w-1 h-20 bg-sky-600 rounded-full" />
                              <span className="text-[10px] font-bold text-sky-600 rotate-90 whitespace-nowrap">BODY HEIGHT</span>
                           </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="flex-1 bg-zinc-100 text-[#1a1a1a] py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all">戻る</button>
                            <button onClick={nextStep} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
                                仕様書の発行へ <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
          )}

          {/* STEP 5: SPEC REPORT */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-[40px] border border-zinc-200 shadow-2xl p-12 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600 rotate-45 translate-x-32 -translate-y-32 flex flex-col items-center justify-end pb-8">
                    <span className="text-white text-xs font-bold tracking-widest uppercase -rotate-45">Official Design</span>
                 </div>

                 <div className="flex flex-col md:flex-row justify-between gap-12 mb-16 border-b border-dashed border-zinc-200 pb-16">
                    <div className="space-y-8">
                       <div>
                          <h2 className="text-4xl font-extrabold tracking-tight mb-2">かりゆしウェア製作仕様書</h2>
                          <p className="text-zinc-400 font-mono text-xs uppercase tracking-tighter">REF: KDS-{Math.floor(Math.random()*1000000)} / {new Date().toLocaleDateString()}</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">お客様名</p>
                             <p className="font-bold underline decoration-zinc-200 underline-offset-4">ゲストユーザー 様</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">用途</p>
                             <p className="font-bold">{design.purpose === 'Personal' ? '個人用' : design.purpose === 'Gift' ? 'ギフト' : design.purpose === 'Uniform' ? '制服' : 'イベント'}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">デザイン</p>
                             <p className="font-bold">{design.vibe}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">発注枚数</p>
                             <p className="font-bold">{design.quantity} 枚</p>
                          </div>
                       </div>
                    </div>

                    <div className="w-full md:w-64">
                       <ShirtPreview 
                          color={design.baseColor} 
                          collarType={design.collarType} 
                          logoPosition={design.logoPosition} 
                          buttonType={design.buttonType}
                          patternOpacity={design.patternDensity}
                          patternScale={2 - design.patternSize}
                          className="w-full h-auto bg-transparent border-none p-0 drop-shadow-lg"
                       />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-6">
                       <h4 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm text-zinc-800">
                          <Layers className="w-4 h-4" /> 縫製仕様詳細
                       </h4>
                       <table className="w-full text-sm">
                          <tbody className="divide-y divide-zinc-100">
                             <tr>
                                <td className="py-2 text-zinc-500 font-medium">衿 型</td>
                                <td className="py-2 font-bold text-right">{design.collarType === 'ButtonDown' ? 'ボタンダウン' : design.collarType === 'OpenCollar' ? '開襟' : 'スタンドカラー'}</td>
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-500 font-medium">ボタン</td>
                                <td className="py-2 font-bold text-right">{design.buttonType === 'Wood' ? '木製' : design.buttonType === 'Pearl' ? '高瀬貝' : 'プラスチック'}</td>
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-500 font-medium">ロゴ位置</td>
                                <td className="py-2 font-bold text-right">{design.logoPosition === 'None' ? 'なし' : design.logoPosition === 'Chest' ? '左胸' : design.logoPosition === 'Sleeve' ? '袖' : '裾'}</td>
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-500 font-medium">基本色</td>
                                <td className="py-2 font-bold text-right flex items-center justify-end gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: design.baseColor }} />
                                   {design.baseColor.toUpperCase()}
                                </td>
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-500 font-medium">柄イメージ (Prompt)</td>
                                <td className="py-2 font-bold text-right text-[10px] text-zinc-400 max-w-[150px] truncate">{design.imagePrompt}</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    <div className="space-y-6">
                       <h4 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm text-zinc-800">
                          <Target className="w-4 h-4" /> 推奨サイズ
                       </h4>
                       <div className="bg-[#1a1a1a] text-white rounded-3xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-600 blur-3xl opacity-30" />
                          <div className="relative z-10">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Standard Size</p>
                             <p className="text-6xl font-black italic tracking-tighter mb-4">Size L</p>
                             <div className="space-y-2 font-mono text-[10px]">
                                <p className="flex justify-between"><span>CHEST:</span> <span className="font-bold">115cm ({size.chest}+20)</span></p>
                                <p className="flex justify-between"><span>SHOULDER:</span> <span className="font-bold">48cm ({size.shoulderWidth}+3)</span></p>
                                <p className="flex justify-between"><span>LENGTH:</span> <span className="font-bold">74cm</span></p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <p className="text-zinc-500 text-sm font-medium mb-1">概算お見積り（税込）</p>
                        <p className="text-4xl font-mono font-black tracking-tighter">¥{(design.quantity * 12800).toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">*生地：高品質綿ポリ混紡 / 納期：約4週間</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white border-2 border-zinc-200 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all">
                            <Download className="w-5 h-5" /> PDF保存
                        </button>
                        <button className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 transition-all shadow-lg shadow-sky-200/50">
                            このプランで発注する <CheckCircle2 className="w-5 h-5" />
                        </button>
                    </div>
                 </div>
              </div>
              
              <div className="text-center pb-24">
                 <button onClick={() => setStep(0)} className="text-sm font-bold text-zinc-400 uppercase tracking-widest hover:text-sky-600 transition-colors">
                    最初から作り直す
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-sky-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-orange-50/30 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/fabric.png')] opacity-[0.03]" />
      </div>
    </div>
  );
}
