/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CollarType {
  STANDARD = 'Standard',
  MAO = 'Mao',
  OPEN = 'Open',
  BUTTON_DOWN = 'Button Down',
}

export enum ButtonType {
  PLASTIC = 'Plastic',
  WOOD = 'Wood',
  SHELL = 'Shell',
}

export interface Pattern {
  id: string;
  name: string;
  url: string;
  category: 'traditional' | 'modern' | 'nature';
}

export interface Material {
  id: string;
  name: string;
  description: string;
}

export interface DesignState {
  usage: string;
  impression: string;
  baseColor: string;
  accentColor: string;
  patternId: string;
  patternDensity: number; // 0 to 1
  patternSize: number; // 0.5 to 2
  collar: CollarType;
  button: ButtonType;
  logoPosition: 'none' | 'left-chest' | 'sleeve' | 'back';
}

export interface UserMeasurements {
  height: number;
  chest: number;
  shoulder: number;
  waist: number;
}

export interface SizeRecommendation {
  size: string;
  chestFit: string;
  shoulderFit: string;
  lengthFit: string;
}
