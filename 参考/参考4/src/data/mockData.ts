import { CollarType, ButtonType, Pattern, Material } from './types';

export const PATTERNS: Pattern[] = [
  { id: 'p1', name: 'Hibiscus', url: 'https://images.unsplash.com/photo-1594751439417-fb76fd1aeb91?q=80&w=200&h=200&auto=format&fit=crop', category: 'nature' },
  { id: 'p2', name: 'Traditional Wave', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=200&h=200&auto=format&fit=crop', category: 'traditional' },
  { id: 'p3', name: 'Shisa Motif', url: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=200&h=200&auto=format&fit=crop', category: 'traditional' },
  { id: 'p4', name: 'Modern Geometric', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&h=200&auto=format&fit=crop', category: 'modern' },
];

export const MATERIALS: Material[] = [
  { id: 'm1', name: 'Cotton 100%', description: 'Breathable and classic Okinawan feel.' },
  { id: 'm2', name: 'Polyester Blend', description: 'Easy care, wrinkle-resistant.' },
  { id: 'm3', name: 'Linen Mix', description: 'Extra cool for peak summer heat.' },
];

export const COLORS = [
  { name: 'Okinawa Blue', value: '#0070bc' },
  { name: 'Sunset Orange', value: '#f15a24' },
  { name: 'Shuri Red', value: '#be0032' },
  { name: 'Palm Green', value: '#009245' },
  { name: 'Sandy White', value: '#fdfcf0' },
  { name: 'Coral Pink', value: '#ff8c8c' },
];

export const SIZE_CHART = [
  { label: 'S', chest: 104, shoulder: 44, length: 70 },
  { label: 'M', chest: 110, shoulder: 46, length: 72 },
  { label: 'L', chest: 116, shoulder: 48, length: 74 },
  { label: 'XL', chest: 124, shoulder: 51, length: 77 },
  { label: '3L', chest: 132, shoulder: 54, length: 80 },
];
