export type Vibe = 'Modern' | 'Traditional' | 'Pop' | 'Elegant';
export type Purpose = 'Uniform' | 'Gift' | 'Personal' | 'Event';
export type CollarType = 'ButtonDown' | 'OpenCollar' | 'StandCollar';
export type LogoPosition = 'None' | 'Chest' | 'Sleeve' | 'Hem';

export interface DesignConfig {
  purpose: Purpose;
  vibe: Vibe;
  baseColor: string;
  motifs: string[];
  quantity: number;
  patternDensity: number; // 0 to 1
  patternSize: number; // 0 to 1
  collarType: CollarType;
  logoPosition: LogoPosition;
  buttonType: 'Wood' | 'Plastic' | 'Pearl';
  aiProposalId?: string;
  imagePrompt?: string;
}

export interface SizeConfig {
  height: number;
  chest: number;
  shoulderWidth: number;
}

export interface AIProposal {
  id: string;
  name: string;
  description: string;
  color: string;
  motifs: string[];
  imagePrompt: string;
}
