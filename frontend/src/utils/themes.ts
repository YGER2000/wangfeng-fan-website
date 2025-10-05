export type ThemeType = 'classic' | 'gradient' | 'starfield' | 'waves' | 'particles';
export type ColorTheme = 'starry-fantasy' | 'white';

export interface Theme {
  id: ThemeType;
  name: string;
  description: string;
  component: string;
}

export interface ColorThemeConfig {
  id: ColorTheme;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  {
    id: 'classic',
    name: '经典黑色',
    description: '纯黑色背景，经典简洁',
    component: 'ClassicBackground'
  },
  {
    id: 'gradient',
    name: '紫色渐变',
    description: '微妙的紫色渐变，温暖神秘',
    component: 'GradientBackground'
  },
  {
    id: 'starfield',
    name: '星空幻想',
    description: '动态星空效果，梦幻浪漫',
    component: 'StarfieldBackground'
  },
  {
    id: 'waves',
    name: '音乐波浪',
    description: '流动的音乐波形，律动感强',
    component: 'WavesBackground'
  },
  {
    id: 'particles',
    name: '粒子风暴',
    description: '漂浮粒子效果，科技感十足',
    component: 'ParticlesBackground'
  }
];

export const colorThemes: ColorThemeConfig[] = [
  {
    id: 'starry-fantasy',
    name: '星空幻想',
    description: '黑色背景 + 紫色主题，神秘梦幻'
  },
  {
    id: 'white',
    name: '白色',
    description: '白色背景 + 紫色主题，简洁明亮'
  }
];

export const defaultTheme: ThemeType = 'gradient';
export const defaultColorTheme: ColorTheme = 'starry-fantasy';

// 背景主题存储
export const themeStorage = {
  get: (): ThemeType => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem('wangfeng-theme') as ThemeType) || defaultTheme;
  },
  set: (theme: ThemeType) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wangfeng-theme', theme);
  }
};

// 颜色主题存储
export const colorThemeStorage = {
  get: (): ColorTheme => {
    if (typeof window === 'undefined') return defaultColorTheme;
    return (localStorage.getItem('wangfeng-color-theme') as ColorTheme) || defaultColorTheme;
  },
  set: (theme: ColorTheme) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wangfeng-color-theme', theme);
    document.documentElement.className = theme;
  }
};