import type { MythicVehicleMode, TrinityKeywords } from './types';

export type TrinityModeSpec = {
  id: MythicVehicleMode;
  zhName: string;
  enName: string;
  totem: string;
  icon: string;
  keywords: TrinityKeywords;
  environment: {
    title: string;
    palette: {
      primary: string;
      accent: string;
      fog: string;
      background: string;
    };
  };
  vfx: {
    signature: string[];
  };
};

export const TRINITY_MODES: Record<MythicVehicleMode, TrinityModeSpec> = {
  car: {
    id: 'car',
    zhName: '麒麟战车',
    enName: 'Kylin Cruiser',
    totem: '麒麟',
    icon: '🚗',
    keywords: {
      mythic: ['踏火', '仁兽', '符纹', '灵火'],
      cyber: ['霓虹网格', '电光紫', '能量护盾', '故障艺术'],
      transform: ['形态重构', '粒子重组', '扫描环', '瞬态加速'],
    },
    environment: {
      title: '赛博荒原',
      palette: {
        primary: '#9945FF',
        accent: '#14F195',
        fog: '#050505',
        background: '#1B1B1F',
      },
    },
    vfx: {
      signature: ['轮胎摩擦火花', '尾部能量拖尾', '符文地面叠印'],
    },
  },
  yacht: {
    id: 'yacht',
    zhName: '灵鲲游艇',
    enName: 'Leviathan Yacht',
    totem: '鲲',
    icon: '🛥️',
    keywords: {
      mythic: ['北冥', '鳞纹', '幽蓝', '声纳'],
      cyber: ['数据海', '水面反射', '深海流光', '全息纹理'],
      transform: ['浮力切换', '形态平衡', '水翼展开', '低阻滑行'],
    },
    environment: {
      title: '无尽数字海',
      palette: {
        primary: '#00F0FF',
        accent: '#006994',
        fog: '#001e36',
        background: '#00101f',
      },
    },
    vfx: {
      signature: ['尾部水花粒子', '声纳波纹', '水面网格脉冲'],
    },
  },
  jet: {
    id: 'jet',
    zhName: '朱雀战机',
    enName: 'Phoenix Jet',
    totem: '朱雀',
    icon: '✈️',
    keywords: {
      mythic: ['浴火', '赤金', '光翼', '重生'],
      cyber: ['平流层', '极光', '深空剪影', '光流轨迹'],
      transform: ['折叠机翼', '光翼展开', '音爆破圈', '高速俯冲'],
    },
    environment: {
      title: '平流层',
      palette: {
        primary: '#FFE6A6',
        accent: '#8B5CF6',
        fog: '#1B1B2A',
        background: '#0B1020',
      },
    },
    vfx: {
      signature: ['引擎喷射火焰', '音爆云', '机翼光流'],
    },
  },
};

export const getTrinityModeSpec = (mode: MythicVehicleMode) => TRINITY_MODES[mode];

