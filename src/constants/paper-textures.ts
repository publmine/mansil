import { ImageSourcePropType } from 'react-native';

export type PaperTextureType = 'cotton' | 'hanji' | 'parchment';
export type CottonColorType = 'white' | 'cream' | 'black';

export interface CottonColorConfig {
  id: CottonColorType;
  labelKey: string;
  dotColor: string;
  backgroundColor: string;
  uncoloredFill: string;
  lineStroke: string;
  guidelineStroke: string;
  guidelineOpacity: number;
}

export const COTTON_COLORS: Record<CottonColorType, CottonColorConfig> = {
  white: {
    id: 'white',
    labelKey: 'mandala_coloring.cotton_white',
    dotColor: '#FAF8F5',
    backgroundColor: '#FAF8F5',
    uncoloredFill: '#FAF8F5',
    lineStroke: '#3c4c73',
    guidelineStroke: '#D1D5DB',
    guidelineOpacity: 0.8,
  },
  cream: {
    id: 'cream',
    labelKey: 'mandala_coloring.cotton_cream',
    dotColor: '#F4EEDC',
    backgroundColor: '#F4EEDC',
    uncoloredFill: '#F4EEDC',
    lineStroke: '#4D4336',
    guidelineStroke: '#D1C4B0',
    guidelineOpacity: 0.8,
  },
  black: {
    id: 'black',
    labelKey: 'mandala_coloring.cotton_black',
    dotColor: '#18181B',
    backgroundColor: '#18181B',
    uncoloredFill: '#18181B',
    lineStroke: '#E4E4E7',
    guidelineStroke: '#52525B',
    guidelineOpacity: 0.8,
  },
};

export interface PaperTextureConfig {
  id: PaperTextureType;
  icon: string;
  labelKey: string;
  image: ImageSourcePropType | null;
  backgroundColor: string;
  uncoloredFill: string;
  lineStroke: string;
  guidelineStroke: string;
  guidelineOpacity: number;
}

export const PAPER_TEXTURES: Record<PaperTextureType, PaperTextureConfig> = {
  cotton: {
    id: 'cotton',
    icon: '📄',
    labelKey: 'mandala_coloring.paper_cotton',
    image: require('../../assets/images/drawing_paper_texture.jpg'),
    backgroundColor: '#FAF8F5',
    uncoloredFill: '#FAF8F5',
    lineStroke: '#3c4c73',
    guidelineStroke: '#D1D5DB',
    guidelineOpacity: 0.8,
  },
  hanji: {
    id: 'hanji',
    icon: '📜',
    labelKey: 'mandala_coloring.paper_hanji',
    image: require('../../assets/images/hanji_texture.jpg'),
    backgroundColor: '#f7f2e7',
    uncoloredFill: '#f7f2e7',
    lineStroke: '#483a29',
    guidelineStroke: '#8c785f',
    guidelineOpacity: 0.65,
  },
  parchment: {
    id: 'parchment',
    icon: '🌾',
    labelKey: 'mandala_coloring.paper_parchment',
    image: require('../../assets/images/parchment_texture.jpg'),
    backgroundColor: '#ebd9b0',
    uncoloredFill: '#ebd9b0',
    lineStroke: '#422f18',
    guidelineStroke: '#846638',
    guidelineOpacity: 0.7,
  },
};
