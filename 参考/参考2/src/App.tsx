/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  Sparkles, 
  Image as ImageIcon, 
  Settings2, 
  Ruler, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  Plus,
  Save,
  User,
  History,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster, toast } from 'sonner';
import { ShirtModel } from '@/components/ShirtModel';
import { generateDesignProposals, DesignProposal, getDesignAdvice } from '@/lib/gemini';
import { auth, signInWithGoogle, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Step = 'input' | 'proposal' | 'material' | 'editor' | 'size' | 'spec';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // States for design data
  const [conditions, setConditions] = useState({
    purpose: 'ビジネス',
    impression: '爽やか・誠実',
    baseColor: '#0047AB',
    motif: 'ハイビスカス',
    quantity: 50
  });

  const [proposals, setProposals] = useState<DesignProposal[]>([]);
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number | null>(null);
  
  const [editorSettings, setEditorSettings] = useState({
    patternDensity: 40,
    patternSize: 60,
    collarStyle: 'regular',
    logoPosition: '左胸',
    buttonType: '木目'
  });

  const [sizeData, setSizeData] = useState({
    height: 170,
    chest: 90,
    shoulder: 44,
    waist: 80
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    const steps: Step[] = ['input', 'proposal', 'material', 'editor', 'size', 'spec'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['input', 'proposal', 'material', 'editor', 'size', 'spec'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateDesignProposals(conditions);
      setProposals(res);
      setStep('proposal');
      toast.success('AI提案が生成されました');
    } catch (error) {
      toast.error('生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('保存するにはログインが必要です');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'designs'), {
        userId: user.uid,
        status: 'finalized',
        conditions,
        proposals,
        selectedProposalIndex,
        editorSettings,
        sizeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('デザインが保存されました');
    } catch (error) {
      toast.error('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1a1a1a] font-sans">
      <Toaster position="top-right" />
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e5e5e5] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#0047AB] rounded-xl flex items-center justify-center text-white">
            <Shirt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">KARIYUSHI STUDIO</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Custom Design System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="avatar" referrerPolicy="no-referrer" />
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={signInWithGoogle} className="bg-[#0047AB] hover:bg-[#003685]">
              ログイン
            </Button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Step Progress */}
        <div className="flex justify-between mb-16 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#e5e5e5] -translate-y-1/2 z-0" />
          {[
            { id: 'input', label: '条件指定', icon: <Sparkles size={16} /> },
            { id: 'proposal', label: 'AI案比較', icon: <History size={16} /> },
            { id: 'material', label: '参考素材', icon: <ImageIcon size={16} /> },
            { id: 'editor', label: '詳細調整', icon: <Settings2 size={16} /> },
            { id: 'size', label: 'サイズ模型', icon: <Ruler size={16} /> },
            { id: 'spec', label: '仕様書', icon: <FileText size={16} /> },
          ].map((s, idx) => {
            const isActive = step === s.id;
            const isCompleted = ['input', 'proposal', 'material', 'editor', 'size', 'spec'].indexOf(step) > idx;
            
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border ${
                    isActive 
                      ? 'bg-[#0047AB] text-white border-[#0047AB] scale-110 shadow-lg' 
                      : isCompleted
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-muted-foreground border-[#e5e5e5]'
                  }`}
                >
                  {s.icon}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-[#0047AB]' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[600px]">
          
          {/* Main Workspace */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-light serif italic">Design Intent</h2>
                    <p className="text-muted-foreground">どのようなシーンで着用されるかりゆしウェアを希望されますか？</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-widest font-bold opacity-50">着用用途</Label>
                      <Select value={conditions.purpose} onValueChange={(v) => setConditions({...conditions, purpose: v})}>
                        <SelectTrigger className="h-14 rounded-xl border-2 border-[#e5e5e5] focus:border-[#0047AB]">
                          <SelectValue placeholder="用途を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ビジネス">ビジネス・フォーマル</SelectItem>
                          <SelectItem value="カジュアル">休日・カジュアル</SelectItem>
                          <SelectItem value="ユニフォーム">店舗・企業制服</SelectItem>
                          <SelectItem value="ウェディング">リゾートウェディング</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-widest font-bold opacity-50">雰囲気・印象</Label>
                      <Select value={conditions.impression} onValueChange={(v) => setConditions({...conditions, impression: v})}>
                        <SelectTrigger className="h-14 rounded-xl border-2 border-[#e5e5e5] focus:border-[#0047AB]">
                          <SelectValue placeholder="印象を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="爽やか・誠実">爽やか・誠実</SelectItem>
                          <SelectItem value="華やか・活動的">華やか・活動的</SelectItem>
                          <SelectItem value="シック・上品">シック・上品</SelectItem>
                          <SelectItem value="伝統的・厳格">伝統的・厳格</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-widest font-bold opacity-50">基本色（ベースカラー）</Label>
                      <div className="flex gap-3">
                        {['#0047AB', '#008080', '#568203', '#E32636', '#FFFFFF', '#1a1a1a'].map(c => (
                          <button
                            key={c}
                            onClick={() => setConditions({...conditions, baseColor: c})}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${conditions.baseColor === c ? 'border-[#0047AB] scale-110 shadow-md' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input 
                          type="color" 
                          value={conditions.baseColor}
                          onChange={(e) => setConditions({...conditions, baseColor: e.target.value})}
                          className="w-10 h-10 rounded-full opacity-0 absolute cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-widest font-bold opacity-50">モチーフ（柄の主題）</Label>
                      <Input 
                        value={conditions.motif}
                        onChange={(e) => setConditions({...conditions, motif: e.target.value})}
                        className="h-14 rounded-xl border-2 border-[#e5e5e5] focus:border-[#0047AB]"
                        placeholder="例：ハイビスカス、ゴーヤー、海"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-widest font-bold opacity-50">予定制作枚数</Label>
                      <Input 
                        type="number"
                        value={conditions.quantity}
                        onChange={(e) => setConditions({...conditions, quantity: parseInt(e.target.value) || 0})}
                        className="h-14 rounded-xl border-2 border-[#e5e5e5] focus:border-[#0047AB]"
                      />
                    </div>
                  </div>

                  <div className="pt-12">
                    <Button 
                      onClick={handleGenerate} 
                      disabled={loading}
                      className="w-full h-16 bg-[#0047AB] hover:bg-[#003685] text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                      {loading ? 'AIがデザインを考案中...' : 'AIにデザイン案を依頼する'}
                      {!loading && <ArrowRight className="ml-2" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'proposal' && (
                <motion.div
                  key="proposal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-light serif italic">AI Proposals</h2>
                    <p className="text-muted-foreground">AIが考案した3つのデザイン案からベースとなるものをお選びください。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {proposals.map((p, i) => (
                      <Card 
                        key={i} 
                        className={`overflow-hidden cursor-pointer transition-all border-2 ${selectedProposalIndex === i ? 'border-[#0047AB] ring-4 ring-blue-100' : 'border-[#e5e5e5] hover:border-blue-200'}`}
                        onClick={() => setSelectedProposalIndex(i)}
                      >
                        <div className="aspect-[3/4] relative">
                          <img src={p.imageUrl} alt={`Proposal ${i+1}`} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-white/90 backdrop-blur-sm text-black font-bold">案 {i + 1}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-6 space-y-4">
                          <p className="text-sm font-medium leading-relaxed">{p.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {p.features.map((f, fi) => (
                              <Badge key={fi} variant="secondary" className="text-[10px] uppercase font-bold">{f}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl font-bold">
                      <ChevronLeft className="mr-2" /> 戻る
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      disabled={selectedProposalIndex === null}
                      className="h-14 px-12 bg-[#0047AB] hover:bg-[#003685] rounded-xl font-bold"
                    >
                      次へ進む <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'material' && (
                <motion.div
                  key="material"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-light serif italic">Reference Materials</h2>
                    <p className="text-muted-foreground">イメージに近い写真や素材を追加してAIの理解を深めます。</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 border-2 border-transparent hover:border-[#0047AB] transition-all">
                        <img 
                          src={`https://picsum.photos/seed/kariyushi-${i}/400/400`} 
                          alt="reference" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-[#e5e5e5] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
                      <Plus className="text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload Photo</span>
                      <input type="file" className="hidden" />
                    </label>
                  </div>

                  <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl font-bold">
                      <ChevronLeft className="mr-2" /> 戻る
                    </Button>
                    <Button onClick={handleNext} className="h-14 px-12 bg-[#0047AB] hover:bg-[#003685] rounded-xl font-bold">
                      詳細調整へ <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'editor' && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-light serif italic">Visual Editor</h2>
                    <p className="text-muted-foreground">柄の密度や各パーツの仕様を細かく調整します。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="bg-white rounded-3xl border border-[#e5e5e5] p-12 flex items-center justify-center relative shadow-sm">
                        <ShirtModel 
                          color={conditions.baseColor}
                          patternDensity={editorSettings.patternDensity}
                          patternSize={editorSettings.patternSize}
                          collarStyle={editorSettings.collarStyle}
                          className="w-full max-w-[300px]"
                        />
                        {editorSettings.logoPosition === '左胸' && (
                          <div className="absolute top-[140px] left-[140px] w-8 h-4 border border-red-500 rounded flex items-center justify-center">
                            <span className="text-[6px] font-bold text-red-500">LOGO</span>
                          </div>
                        )}
                     </div>

                     <div className="space-y-8 py-4">
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <Label className="text-xs uppercase tracking-widest font-bold opacity-50">柄の密度</Label>
                            <span className="text-xs font-mono">{editorSettings.patternDensity}%</span>
                          </div>
                          <Slider 
                            value={[editorSettings.patternDensity]} 
                            onValueChange={(v) => setEditorSettings({...editorSettings, patternDensity: v[0]})} 
                            max={100} step={1}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <Label className="text-xs uppercase tracking-widest font-bold opacity-50">柄のサイズ</Label>
                            <span className="text-xs font-mono">{editorSettings.patternSize}%</span>
                          </div>
                          <Slider 
                            value={[editorSettings.patternSize]} 
                            onValueChange={(v) => setEditorSettings({...editorSettings, patternSize: v[0]})} 
                            min={10} max={200} step={5}
                          />
                        </div>

                        <div className="space-y-4">
                           <Label className="text-xs uppercase tracking-widest font-bold opacity-50">襟（えり）の形</Label>
                           <div className="flex gap-4">
                              {['regular', 'open'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => setEditorSettings({...editorSettings, collarStyle: s})}
                                  className={`flex-1 h-14 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${editorSettings.collarStyle === s ? 'border-[#0047AB] bg-blue-50 text-[#0047AB]' : 'border-[#e5e5e5] text-muted-foreground'}`}
                                >
                                  {s === 'regular' ? 'レギュラーカラー' : '開襟'}
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <Label className="text-xs uppercase tracking-widest font-bold opacity-50">ロゴ刺繍・プリント位置</Label>
                           <Select value={editorSettings.logoPosition} onValueChange={(v) => setEditorSettings({...editorSettings, logoPosition: v})}>
                            <SelectTrigger className="h-14 rounded-xl border-2 border-[#e5e5e5]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="なし">なし</SelectItem>
                              <SelectItem value="左胸">左胸</SelectItem>
                              <SelectItem value="右袖">右袖</SelectItem>
                              <SelectItem value="背中">背中（上部）</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl font-bold">
                      <ChevronLeft className="mr-2" /> 戻る
                    </Button>
                    <Button onClick={handleNext} className="h-14 px-12 bg-[#0047AB] hover:bg-[#003685] rounded-xl font-bold">
                      サイズ模型へ <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'size' && (
                <motion.div
                  key="size"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-light serif italic">Size Simulation</h2>
                    <p className="text-muted-foreground">パーソナルデータを入力して、着心地とサイズ感を確認します。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold opacity-50">身長 (cm)</Label>
                        <Input type="number" value={sizeData.height} onChange={(e) => setSizeData({...sizeData, height: parseInt(e.target.value)})} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold opacity-50">胸囲 (cm)</Label>
                        <Input type="number" value={sizeData.chest} onChange={(e) => setSizeData({...sizeData, chest: parseInt(e.target.value)})} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold opacity-50">肩幅 (cm)</Label>
                        <Input type="number" value={sizeData.shoulder} onChange={(e) => setSizeData({...sizeData, shoulder: parseInt(e.target.value)})} className="h-12 rounded-lg" />
                      </div>
                    </div>

                    <div className="bg-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center gap-6">
                      <div className="text-center">
                        <Badge className="bg-[#0047AB] mb-2">Recommended Size</Badge>
                        <div className="text-6xl font-black">L</div>
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-sm font-medium">想定される「ゆとり量」</p>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Chest</span>
                            <span className="text-md font-bold text-green-600">+12cm</span>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Shoulder</span>
                            <span className="text-md font-bold text-green-600">+4cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl font-bold">
                      <ChevronLeft className="mr-2" /> 戻る
                    </Button>
                    <Button onClick={handleNext} className="h-14 px-12 bg-[#0047AB] hover:bg-[#003685] rounded-xl font-bold">
                      仕様書を確認 <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'spec' && (
                <motion.div
                  key="spec"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-4xl font-light serif italic">Specification</h2>
                        <p className="text-muted-foreground">最終的なオーダー仕様書を確認し、保存・出力します。</p>
                      </div>
                      <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 h-10 gap-2">
                        <Save size={16} /> 保存する
                      </Button>
                    </div>
                  </div>

                  <Card className="border-none shadow-none bg-white font-mono p-8 rounded-3xl border border-[#e5e5e5] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Shirt size={200} />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start border-b border-dashed border-[#e5e5e5] pb-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Design ID</p>
                          <p className="font-bold">KD-2024-05-10-001</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Date</p>
                          <p className="font-bold">2024.05.10</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Base Material</p>
                              <p className="font-semibold text-sm">オックスフォード（綿100%）</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Collar Type</p>
                              <p className="font-semibold text-sm">{editorSettings.collarStyle === 'regular' ? 'レギュラーカラー' : 'オープンカラー'}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Buttons</p>
                              <p className="font-semibold text-sm">ココナッツボタン</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Motif Context</p>
                              <p className="font-semibold text-sm">{conditions.motif}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Estimated Quantity</p>
                              <p className="font-semibold text-sm">{conditions.quantity} 枚</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Unit Price (Estimated)</p>
                              <p className="font-semibold text-sm text-[#0047AB]">¥7,800 + TAX</p>
                           </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-dashed border-[#e5e5e5]">
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">Designer Comments (AI Generated)</p>
                        <p className="text-xs leading-relaxed opacity-60">
                          {selectedProposalIndex !== null ? proposals[selectedProposalIndex].description : 'デザイン案が選択されていません。'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl font-bold">
                      <ChevronLeft className="mr-2" /> 戻る
                    </Button>
                    <Button variant="outline" className="h-14 px-12 rounded-xl font-bold border-2 border-[#1a1a1a]">
                      PDF保存・印刷
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Info Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-3xl border-[#e5e5e5] shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-sm font-bold tracking-tight uppercase">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-bold">Base Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: conditions.baseColor }} />
                      <span className="font-mono">{conditions.baseColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-bold">Impression</span>
                    <span className="font-bold">{conditions.impression}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-bold">Quantity</span>
                    <span className="font-bold">{conditions.quantity} 枚</span>
                  </div>
                </div>

                <div className="aspect-square bg-slate-50 rounded-2xl border border-dashed border-[#e5e5e5] flex items-center justify-center p-8">
                  <ShirtModel 
                    color={conditions.baseColor}
                    patternDensity={editorSettings.patternDensity}
                    patternSize={editorSettings.patternSize}
                    collarStyle={editorSettings.collarStyle}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none bg-[#0047AB] text-white shadow-xl shadow-blue-200 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                   <Sparkles size={16} />
                </div>
                <h3 className="font-bold">AI Assistant</h3>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed font-medium">
                「{conditions.impression}」な印象を与えるためには、柄の密度をもう少し抑えると、より洗練されたビジネススタイルになります。
              </p>
              <Button 
                variant="outline" 
                className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white border-0 font-bold"
                onClick={async () => {
                  const advice = await getDesignAdvice({ conditions, editorSettings }, "このデザインをより良くするための具体的なアドバイスをください。");
                  toast.info(advice, { duration: 10000 });
                }}
              >
                詳しく聞く
              </Button>
            </Card>
          </div>

        </div>
      </main>

      <footer className="mt-24 border-t border-[#e5e5e5] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <Shirt size={20} />
            <span className="text-sm font-bold tracking-tighter">KARIYUSHI STUDIO</span>
          </div>
          <div className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-[#0047AB]">利用規約</a>
            <a href="#" className="hover:text-[#0047AB]">プライバシー</a>
            <a href="#" className="hover:text-[#0047AB]">製造プロセス</a>
            <a href="#" className="hover:text-[#0047AB]">サポート</a>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">© 2024 OKINAWA TEXTILE LAB.</p>
        </div>
      </footer>
    </div>
  );
}
