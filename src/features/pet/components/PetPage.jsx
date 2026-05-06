import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LuChevronLeft, LuChevronDown,
  LuUtensils, LuHeart, LuActivity, LuGauge,
  LuTrophy, LuHeartPulse, LuSoup, LuBrain,
  LuCake, LuBeef, LuApple, LuMilk, LuFish, LuCookie,
  LuShowerHead, LuShirt, LuBedSingle, LuBrush, LuBath, LuBandage,
  LuPackage2, LuCarFront, LuPlane, LuGamepad2, LuBookOpen, LuFootprints, LuPuzzle,
  LuSmile, LuLaugh, LuMeh, LuFrown, LuSparkles, LuMoon, LuSun, LuCloudSun, LuCloudRain,
  LuUtensilsCrossed, LuChefHat, LuCupSoda, LuIceCreamCone,
  LuClapperboard, LuMusic, LuShoppingBag, LuScissors, LuWashingMachine, LuDumbbell, LuPaintbrush,
  LuHammer, LuBed, LuTrainFront, LuSunset, LuWaves, LuLaptop, LuPlus, LuSearch
} from 'react-icons/lu';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import { fetchPet, fetchStatus, savePet, saveStatus } from '../../../services';
import AddActivityModal from './AddActivityModal';
import ChooseActivityModal from './ChooseActivityModal';
import UpdateIconModal from './UpdateIconModal';
import ConfirmActivityModal from './ConfirmActivityModal';
import '../styles/pet.css';

const ITEM_ICONS = {
  pudding: LuCake,
  meat: LuBeef,
  apple: LuApple,
  milk: LuMilk,
  fish: LuFish,
  cookie: LuCookie,
  shower: LuShowerHead,
  towel: LuShirt,
  mat: LuBedSingle,
  brush: LuBrush,
  soap: LuBath,
  bandage: LuBandage,
  box: LuPackage2,
  car: LuCarFront,
  plane: LuPlane,
  ball: LuGamepad2,
  book: LuBookOpen,
  walk: LuFootprints,
  puzzle: LuPuzzle,
  happy: LuSmile,
  laugh: LuLaugh,
  calm: LuMeh,
  grumpy: LuFrown,
  sparkle: LuSparkles,
  sleepy: LuMoon,
  sunny: LuSun,
  cozy: LuCloudSun,
  gloomy: LuCloudRain
};

const ACTIVITY_ICON_RULES = [
  { keywords: ['an ', 'com', 'mi', 'bun', 'pho', 'hu tieu', 'banh', 'goi cuon', 'lau', 'ramen', 'tacos', 'ga', 'bo ', 'heo', 'cha ca', 'trung', 'khoai', 'dau hu'], shape: 'meal' },
  { keywords: ['nau', 'chien', 'ham', 'got', 'goi banh'], shape: 'cook' },
  { keywords: ['tra sua', 'sinh to', 'nuoc', 'un ', 'uong', 'ca phe'], shape: 'drink' },
  { keywords: ['kem', 'flan', 'keo', 'snack', 'vat'], shape: 'treat' },
  { keywords: ['phim', 'one piece', 'netflix', 'youtube', 'tivi', 'hoat hinh'], shape: 'watch' },
  { keywords: ['game', 'lien quan', 'overcook', 'temtem', 'choi'], shape: 'game' },
  { keywords: ['doc sach', 'nha sach', 'hoc'], shape: 'read' },
  { keywords: ['nghe nhac', 'hat'], shape: 'music' },
  { keywords: ['ve ', 'to tuong', 'nail'], shape: 'art' },
  { keywords: ['di choi', 'di dao', 'di bo', 'ngoai duong', 'phieu luu', 'kham pha', 'ngam canh', 'ngam troi', 'ngam trang', 'ngam may', 'ngam duong', 'hong gio', 'phoi nang', 'phoi gio'], shape: 'walk' },
  { keywords: ['di xe', 'chim sat', 'san bay', 'que', 'thanh pho'], shape: 'travel' },
  { keywords: ['cho', 'mua', 'shopee', 'sale', 'unbox'], shape: 'shop' },
  { keywords: ['don', 'quet', 'giat', 'phoi do', 'rua chen', 'rua bat', 'lau', 'viec nha', 'xep do'], shape: 'clean' },
  { keywords: ['tam', 'rua mat', 'rua tay', 'danh rang', 'skincare', 've sinh', 'cat mong'], shape: 'careSelf' },
  { keywords: ['ngu', 'khò', 'nam', 'nghi trua', 'chill', 'khong lam gi', 'ngoi nghi', 'mo'], shape: 'rest' },
  { keywords: ['lam viec', 'lam diec', 'may tinh'], shape: 'work' },
  { keywords: ['tap the duc', 'tap het'], shape: 'exercise' },
  { keywords: ['sua', 'dong dinh', 'lap ban'], shape: 'fix' },
  { keywords: ['kham', 'dau bung', 'suc khoe'], shape: 'health' },
  { keywords: ['cat toc', 'thu dam', 'lam nail'], shape: 'style' },
  { keywords: ['song', 'ho', 'thac nuoc', 'bien', 'ngam nuoc'], shape: 'water' },
  { keywords: ['hoang hon', 'nang', 'mua', 'troi'], shape: 'weather' }
];

const ACTIVITY_ICONS = {
  meal: LuUtensilsCrossed,
  cook: LuChefHat,
  drink: LuCupSoda,
  treat: LuIceCreamCone,
  watch: LuClapperboard,
  game: LuGamepad2,
  read: LuBookOpen,
  music: LuMusic,
  shop: LuShoppingBag,
  style: LuScissors,
  clean: LuWashingMachine,
  exercise: LuDumbbell,
  art: LuPaintbrush,
  fix: LuHammer,
  careSelf: LuBath,
  rest: LuBed,
  walk: LuFootprints,
  travel: LuTrainFront,
  weather: LuSunset,
  water: LuWaves,
  work: LuLaptop,
  health: LuHeartPulse,
  default: LuSparkles
};

const TAB_ITEMS = {
  food: [
    { name: 'Pudding', count: 0, shape: 'pudding' },
    { name: 'Meat', count: 1, shape: 'meat' },
    { name: 'Apple', count: 0, shape: 'apple' },
    { name: 'Milk', count: 2, shape: 'milk' },
    { name: 'Fish', count: 0, shape: 'fish' },
    { name: 'Cookie', count: 3, shape: 'cookie' },
    { name: 'Juice', count: 1, shape: 'milk' },
    { name: 'Berry', count: 2, shape: 'apple' },
    { name: 'Biscuit', count: 0, shape: 'cookie' }
  ],
  care: [
    { name: 'Shower', count: 1, shape: 'shower' },
    { name: 'Towel', count: 2, shape: 'towel' },
    { name: 'Nap Mat', count: 1, shape: 'mat' },
    { name: 'Brush', count: 1, shape: 'brush' },
    { name: 'Soap', count: 0, shape: 'soap' },
    { name: 'Bandage', count: 2, shape: 'bandage' },
    { name: 'Comb', count: 1, shape: 'brush' },
    { name: 'Cushion', count: 0, shape: 'mat' },
    { name: 'Care Kit', count: 1, shape: 'bandage' }
  ],
  activity: [],
  moods: [
    { name: 'Happy', count: 0, shape: 'happy' },
    { name: 'Silly', count: 1, shape: 'laugh' },
    { name: 'Calm', count: 0, shape: 'calm' },
    { name: 'Grumpy', count: 0, shape: 'grumpy' },
    { name: 'Spark', count: 2, shape: 'sparkle' },
    { name: 'Sleepy', count: 1, shape: 'sleepy' },
    { name: 'Sunny', count: 0, shape: 'sunny' },
    { name: 'Cozy', count: 1, shape: 'cozy' },
    { name: 'Gloomy', count: 0, shape: 'gloomy' }
  ]
};

const TABS = [
  { key: 'food', label: 'Food', Icon: LuUtensils },
  { key: 'care', label: 'Care', Icon: LuHeart },
  { key: 'activity', label: 'Activity', Icon: LuActivity },
  { key: 'moods', label: 'Moods', Icon: LuSmile },
  { key: 'status', label: 'Status', Icon: LuGauge }
];

const PET_STATUS_ROWS = [
  { key: 'level', label: 'LV.0', value: 10, Icon: LuTrophy },
  { key: 'health', label: 'Health', value: 84, Icon: LuHeartPulse },
  { key: 'hunger', label: 'Hunger', value: 38, Icon: LuSoup },
  { key: 'sanity', label: 'Sanity', value: 72, Icon: LuBrain }
];

const PET_STATUS_KEYS = ['health', 'hunger', 'sanity'];
const PET_ITEM_CATEGORIES = ['food', 'care'];
const PET_STATUS_DECAY_CHUNK_MS = 6 * 60 * 60 * 1000;
const PET_STATUS_DECAY = {
  hunger: 8,
  sanity: 4,
  health: 3
};
const PET_ITEM_EFFECTS = {
  food: {
    label: 'Food',
    stats: {
      hunger: 25,
      health: 8
    }
  },
  care: {
    label: 'Care',
    stats: {
      health: 15,
      sanity: 10
    }
  }
};
const PET_REACTION_LEVELS = {
  stable: 'stable',
  needsCare: 'needs-care',
  critical: 'critical'
};
const PET_STAT_LABELS = {
  health: 'Health',
  hunger: 'Hunger',
  sanity: 'Sanity'
};
const PET_ITEM_DESCRIPTIONS = {
  pudding: 'Mềm mịn ngọt ngào, pet ăn là vui bụng liền.',
  meat: 'Một miếng chắc bụng cho ngày cần nhiều năng lượng.',
  apple: 'Giòn giòn tươi mát, nhẹ bụng mà vẫn ngon.',
  milk: 'Một ngụm béo thơm để bụng êm lại.',
  fish: 'Mùi cá hấp dẫn, pet sẽ chạy tới ngay.',
  cookie: 'Giòn rụm nhỏ xinh, thưởng một cái là tươi tỉnh.',
  juice: 'Mát lạnh ngọt nhẹ, uống xong tỉnh táo hơn.',
  berry: 'Chua ngọt tí hon, cắn một miếng là vui.',
  biscuit: 'Bánh quy giòn tan cho lúc đói lưng chừng.',
  shower: 'Tắm sạch bụi bặm, pet thơm tho lại ngay.',
  towel: 'Lau khô ấm áp sau khi tắm xong.',
  'nap mat': 'Một chỗ nằm mềm để nghỉ lại sức.',
  brush: 'Chải lông gọn gàng, nhìn tỉnh táo hơn hẳn.',
  soap: 'Bọt xà phòng nhỏ xíu làm pet sạch bong.',
  bandage: 'Dán nhẹ một miếng để vết đau bớt nhăn nhó.',
  comb: 'Chải một lượt là lông vào nếp đáng yêu.',
  cushion: 'Gối êm để pet cuộn tròn nghỉ một chút.',
  'care kit': 'Bộ chăm sóc nhỏ nhưng hồi phục rất ra gì.'
};

const PET_CURRENT_MOOD = { label: 'Happy', Icon: LuSmile };
const PET_MOOD_FLOAT_OPTIONS = {
  animationSeconds: 3,
  runIntervalSeconds: 8,
  itemsPerRun: 3,
  itemDelaySeconds: 1.5,
  bubbleSizePx: 78,
  iconSizePx: 18,
  floatDistancePx: 96,
  startOffsetRangePx: 18,
  endOffsetRangePx: 44,
  rotateRangeDeg: 9,
  startScale: 0.58,
  endScale: 1.12
};

const PET_THOUGHT_BUBBLE_OPTIONS = {
  playDurationSeconds: 7,
  replayDelaySeconds: 5
};
const PET_FOOD_EFFECT_DURATION_MS = 3000;
const PET_CARE_EFFECT_DURATION_MS = 3000;

const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

const normalizeActivityText = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
);

const getActivityShape = (activityName) => {
  const normalizedName = normalizeActivityText(activityName);
  const matchedRule = ACTIVITY_ICON_RULES.find(({ keywords }) => (
    keywords.some((keyword) => normalizedName.includes(normalizeActivityText(keyword)))
  ));

  return matchedRule?.shape || 'default';
};

const getMoodShape = (moodName) => {
  const normalizedName = normalizeActivityText(moodName);

  if (['happy', 'vui', 'hanh phuc', 'yeu doi'].some((keyword) => normalizedName.includes(keyword))) {
    return 'happy';
  }

  if (['silly', 'laugh', 'cuoi', 'nhon', 'vui ve'].some((keyword) => normalizedName.includes(keyword))) {
    return 'laugh';
  }

  if (['calm', 'binh yen', 'binh tinh', 'thu gian'].some((keyword) => normalizedName.includes(keyword))) {
    return 'calm';
  }

  if (['grumpy', 'buon', 'cau', 'kho chiu', 'tuc'].some((keyword) => normalizedName.includes(keyword))) {
    return 'grumpy';
  }

  if (['sleepy', 'ngu', 'met', 'mo mang'].some((keyword) => normalizedName.includes(keyword))) {
    return 'sleepy';
  }

  if (['sunny', 'nang', 'am ap'].some((keyword) => normalizedName.includes(keyword))) {
    return 'sunny';
  }

  if (['cozy', 'am', 'chill', 'de chiu'].some((keyword) => normalizedName.includes(keyword))) {
    return 'cozy';
  }

  if (['gloomy', 'mua', 'am u', 'tam trang'].some((keyword) => normalizedName.includes(keyword))) {
    return 'gloomy';
  }

  return 'sparkle';
};

const normalizeActivityItems = (activities) => (
  (Array.isArray(activities) ? activities : [])
    .map((activity) => {
      if (activity && typeof activity === 'object') {
        const name = typeof activity.name === 'string' ? activity.name.trim() : String(activity.name || '').trim();
        const icon = typeof activity.icon === 'string' ? activity.icon.trim() : '';
        return name ? { name, icon, shape: getActivityShape(name) } : null;
      }

      const name = typeof activity === 'string' ? activity.trim() : String(activity || '').trim();
      return name ? { name, icon: '', shape: getActivityShape(name) } : null;
    })
    .filter(Boolean)
);

const normalizeMoodItems = (moods, fallbackItems = TAB_ITEMS.moods) => {
  const sourceMoods = Array.isArray(moods) && moods.length > 0 ? moods : [];
  const savedMoods = sourceMoods
    .map((mood) => {
      if (mood && typeof mood === 'object') {
        const name = typeof mood.name === 'string' ? mood.name.trim() : String(mood.name || '').trim();
        const icon = typeof mood.icon === 'string' ? mood.icon.trim() : '';
        return name ? { name, icon, shape: getMoodShape(name) } : null;
      }

      const name = typeof mood === 'string' ? mood.trim() : String(mood || '').trim();
      return name ? { name, icon: '', shape: getMoodShape(name) } : null;
    })
    .filter(Boolean);

  const mergedMoods = [...savedMoods, ...fallbackItems];
  const seenNames = new Set();

  return mergedMoods.filter((mood) => {
    const key = mood.name.toLowerCase();
    if (seenNames.has(key)) {
      return false;
    }
    seenNames.add(key);
    if (!mood.icon) {
      mood.icon = '';
    }
    return true;
  });
};

const getStatusText = (value) => {
  if (Array.isArray(value)) {
    return getStatusText(value[0]);
  }

  if (value && typeof value === 'object') {
    return typeof value.name === 'string' ? value.name.trim() : '';
  }

  return String(value || '').trim();
};

const DEFAULT_PET_ITEMS = {
  food: TAB_ITEMS.food.map(({ name, shape }) => ({
    name,
    icon: '',
    desc: PET_ITEM_DESCRIPTIONS[name.toLowerCase()] || '',
    shape
  })),
  care: TAB_ITEMS.care.map(({ name, shape }) => ({
    name,
    icon: '',
    desc: PET_ITEM_DESCRIPTIONS[name.toLowerCase()] || '',
    shape
  }))
};

const DEFAULT_PET_STATUS = PET_STATUS_ROWS.reduce((status, row) => ({
  ...status,
  [row.key]: row.value
}), {});

const DEFAULT_PET_SHAPES = [...DEFAULT_PET_ITEMS.food, ...DEFAULT_PET_ITEMS.care].reduce((shapes, item) => {
  shapes[item.name.toLowerCase()] = item.shape;
  return shapes;
}, {});

const clampPetStatusValue = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numberValue)));
};

const clampPetStatus = (status = {}) => ({
  health: clampPetStatusValue(status.health ?? DEFAULT_PET_STATUS.health),
  hunger: clampPetStatusValue(status.hunger ?? DEFAULT_PET_STATUS.hunger),
  sanity: clampPetStatusValue(status.sanity ?? DEFAULT_PET_STATUS.sanity)
});

const getPetStatusLevel = (value) => {
  if (value < 30) {
    return PET_REACTION_LEVELS.critical;
  }

  if (value < 70) {
    return PET_REACTION_LEVELS.needsCare;
  }

  return PET_REACTION_LEVELS.stable;
};

const getWeakestPetStatus = (status = {}) => (
  PET_STATUS_KEYS
    .map((key) => ({ key, value: clampPetStatusValue(status[key]) }))
    .reduce((weakest, stat) => (stat.value < weakest.value ? stat : weakest), {
      key: 'health',
      value: 100
    })
);

const getPetReaction = (status = {}) => {
  const weakest = getWeakestPetStatus(status);
  const level = getPetStatusLevel(weakest.value);
  const label = PET_STAT_LABELS[weakest.key] || 'Status';
  const criticalMessages = {
    health: 'Mình yếu quá. Chăm sóc một chút sẽ giúp mình hồi phục.',
    hunger: 'Bụng mình trống rỗng rồi. Cho mình ăn với nha.',
    sanity: 'Đầu mình hơi rối. Chăm sóc sẽ giúp mình bình tĩnh lại.'
  };
  const needsCareMessages = {
    health: 'Mình vẫn ổn, nhưng được chăm sóc thêm thì sẽ khỏe hơn.',
    hunger: 'Mình hơi đói rồi. Một món ăn nhẹ sẽ tuyệt lắm.',
    sanity: 'Mình cần được dỗ dành một chút để tâm trạng tốt hơn.'
  };

  if (level === PET_REACTION_LEVELS.critical) {
    return {
      level,
      weakest,
      message: criticalMessages[weakest.key] || `${label} is critical.`
    };
  }

  if (level === PET_REACTION_LEVELS.needsCare) {
    return {
      level,
      weakest,
      message: needsCareMessages[weakest.key] || `${label} needs attention.`
    };
  }

  return {
    level,
    weakest,
    message: 'Hôm nay mình thấy ổn. Cứ giữ mình ấm áp và được yêu thương nha.'
  };
};

const calculatePetStatusDecay = (status = {}, lastStatusTickAt, now = new Date()) => {
  const nextStatus = clampPetStatus(status);
  const nextTickAt = now.toISOString();
  const lastTickDate = lastStatusTickAt ? new Date(lastStatusTickAt) : null;

  if (!lastTickDate || Number.isNaN(lastTickDate.getTime())) {
    return {
      status: nextStatus,
      lastStatusTickAt: nextTickAt,
      chunks: 0,
      shouldSave: true
    };
  }

  const elapsedMs = now.getTime() - lastTickDate.getTime();
  const chunks = Math.max(0, Math.floor(elapsedMs / PET_STATUS_DECAY_CHUNK_MS));

  if (chunks === 0) {
    return {
      status: nextStatus,
      lastStatusTickAt,
      chunks,
      shouldSave: false
    };
  }

  for (let index = 0; index < chunks; index += 1) {
    nextStatus.hunger = clampPetStatusValue(nextStatus.hunger - PET_STATUS_DECAY.hunger);
    nextStatus.sanity = clampPetStatusValue(nextStatus.sanity - PET_STATUS_DECAY.sanity);

    if (nextStatus.hunger < 30 || nextStatus.sanity < 30) {
      nextStatus.health = clampPetStatusValue(nextStatus.health - PET_STATUS_DECAY.health);
    }
  }

  return {
    status: nextStatus,
    lastStatusTickAt: nextTickAt,
    chunks,
    shouldSave: true
  };
};

const getPetItemUsePreview = (category, status = {}) => {
  const effect = PET_ITEM_EFFECTS[category];
  const currentStatus = clampPetStatus(status);

  if (!effect) {
    return {
      canUse: false,
      reason: '',
      rows: [],
      nextStatus: currentStatus
    };
  }

  const nextStatus = { ...currentStatus };
  const rows = Object.entries(effect.stats).map(([key, amount]) => {
    const before = currentStatus[key];
    const after = clampPetStatusValue(before + amount);
    nextStatus[key] = after;

    return {
      key,
      label: PET_STAT_LABELS[key] || key,
      amount,
      before,
      after
    };
  });

  const canUse = category === 'food'
    ? currentStatus.hunger < 100 || currentStatus.health < 100
    : currentStatus.health < 100 || currentStatus.sanity < 100;

  return {
    canUse,
    reason: category === 'food' ? 'Hunger and health are already full.' : 'Health and sanity are already full.',
    rows,
    nextStatus
  };
};

const normalizePetInventoryItems = (items, fallbackItems = []) => {
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems;

  return sourceItems
    .map((item) => {
      if (!item) return null;
      const name = typeof item.name === 'string' ? item.name.trim() : String(item.name || '').trim();
      const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
      const desc = typeof item.desc === 'string' ? item.desc.trim() : '';
      const shape = item.shape || DEFAULT_PET_SHAPES[name.toLowerCase()] || 'box';
      return name ? {
        name,
        icon,
        desc: desc || PET_ITEM_DESCRIPTIONS[name.toLowerCase()] || '',
        shape
      } : null;
    })
    .filter(Boolean);
};

const serializePetItems = (items) => (
  normalizePetInventoryItems(items)
    .map(({ name, icon, desc }) => ({ name, icon, desc }))
);

const upsertPetItem = (items, nextItem) => {
  const normalizedItem = normalizePetInventoryItems([nextItem])[0];
  if (!normalizedItem) return items;

  const filteredItems = normalizePetInventoryItems(items).filter((item) => (
    item.name.toLowerCase() !== normalizedItem.name.toLowerCase()
  ));

  return [normalizedItem, ...filteredItems];
};

const createPetStatusRows = (petStatus) => (
  PET_STATUS_ROWS.map((row) => {
    const value = row.key === 'level' ? row.value : clampPetStatusValue(petStatus[row.key] ?? row.value);

    return {
      ...row,
      value,
      statusLevel: PET_STATUS_KEYS.includes(row.key) ? getPetStatusLevel(value) : PET_REACTION_LEVELS.stable
    };
  })
);

const createMoodFloatVariant = () => {
  const startOffsetPx = randomBetween(-PET_MOOD_FLOAT_OPTIONS.startOffsetRangePx, PET_MOOD_FLOAT_OPTIONS.startOffsetRangePx);
  const endOffsetPx = randomBetween(-PET_MOOD_FLOAT_OPTIONS.endOffsetRangePx, PET_MOOD_FLOAT_OPTIONS.endOffsetRangePx);

  return {
    id: `${Date.now()}-${Math.random()}`,
    startOffsetPx,
    midOffsetPx: Math.round((startOffsetPx + endOffsetPx) / 2),
    endOffsetPx,
    startRotateDeg: randomBetween(-PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg, PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg),
    midRotateDeg: randomBetween(-PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg, PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg),
    endRotateDeg: randomBetween(-PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg, PET_MOOD_FLOAT_OPTIONS.rotateRangeDeg)
  };
};

const createMoodFloatBatch = () => (
  Array.from({ length: PET_MOOD_FLOAT_OPTIONS.itemsPerRun }, (_, index) => ({
    ...createMoodFloatVariant(),
    delaySeconds: index * PET_MOOD_FLOAT_OPTIONS.itemDelaySeconds
  }))
);

const moodFloatStyle = {
  '--pet-mood-duration': `${PET_MOOD_FLOAT_OPTIONS.animationSeconds}s`,
  '--pet-mood-size': `${PET_MOOD_FLOAT_OPTIONS.bubbleSizePx}px`,
  '--pet-mood-icon-size': `${PET_MOOD_FLOAT_OPTIONS.iconSizePx}px`,
  '--pet-mood-rise-end': `-${PET_MOOD_FLOAT_OPTIONS.floatDistancePx}px`,
  '--pet-mood-start-scale': PET_MOOD_FLOAT_OPTIONS.startScale,
  '--pet-mood-end-scale': PET_MOOD_FLOAT_OPTIONS.endScale
};

const PetItemCard = ({
  item,
  showCount = true,
  isCurrent = false,
  showEmptyIcon = false,
  disabled = false,
  disabledReason = '',
  onClick
}) => {
  const Icon = ACTIVITY_ICONS[item.shape] ?? ITEM_ICONS[item.shape] ?? LuPackage2;
  const ariaLabel = [
    showCount ? `${item.name}, quantity ${item.count}` : item.name,
    disabled && disabledReason ? disabledReason : ''
  ].filter(Boolean).join('. ');

  return (
    <button
      type="button"
      className={`pet-item-card ${showCount ? '' : 'pet-item-card--activity'} ${isCurrent ? 'pet-item-card--current' : ''} ${disabled ? 'pet-item-card--disabled' : ''}`}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
    >
      {!showCount ? (
        item.icon ? (
          <IconRenderer iconName={item.icon} size={44} className="pet-item-icon" />
        ) : showEmptyIcon ? (
          <span className="pet-item-card__empty">&#60;&#62;</span>
        ) : (
          <Icon className="pet-item-icon" aria-hidden="true" />
        )
      ) : (
        <Icon className="pet-item-icon" aria-hidden="true" />
      )}
      {showCount && (
        <span className="pet-item-card__count"><span className="pet-item-card__count-x">x</span>{item.count}</span>
      )}
      <span className="pet-item-card__name">{item.name}</span>
      {isCurrent && <span className="pet-item-card__badge">Current</span>}
    </button>
  );
};

const PetStatusPanel = ({ rows }) => (
  <div className="pet-status-list" aria-label="Pet status cards">
    {rows.map(({ key, label, value, Icon, statusLevel }) => (
      <div
        key={key}
        className={`pet-status-row pet-status-row--${statusLevel}`}
        aria-label={`${label} ${value}%`}
      >
        <div className="pet-status-row__header">
          <Icon className="pet-status-icon" aria-hidden="true" />
          <span className="pet-status-row__title">{label}</span>
          <span className="pet-status-row__value">{value}%</span>
        </div>
        <div className="pet-status-row__track" aria-hidden="true">
          <span style={{ width: `${value}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const PetStageFoodEffect = ({ effect, onDone }) => {
  const item = effect.item || {};
  const Icon = ACTIVITY_ICONS[item.shape] ?? ITEM_ICONS[item.shape] ?? LuPackage2;

  return (
    <div
      className="pet-food-effect"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === 'pet-food-eat') {
          onDone(effect.id);
        }
      }}
    >
      {item.icon ? (
        <IconRenderer iconName={item.icon} size={54} className="pet-food-effect__icon" />
      ) : (
        <Icon className="pet-food-effect__icon" aria-hidden="true" />
      )}
    </div>
  );
};

const PetStageCareEffect = ({ effect, onDone }) => {
  const item = effect.item || {};
  const Icon = ACTIVITY_ICONS[item.shape] ?? ITEM_ICONS[item.shape] ?? LuHeart;

  return (
    <div
      className="pet-care-effect"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === 'pet-care-heal') {
          onDone(effect.id);
        }
      }}
    >
      <span className="pet-care-effect__ring" />
      <span className="pet-care-effect__pulse" />
      <span className="pet-care-effect__plus pet-care-effect__plus--one">+</span>
      <span className="pet-care-effect__plus pet-care-effect__plus--two">+</span>
      <span className="pet-care-effect__plus pet-care-effect__plus--three">+</span>
      <span className="pet-care-effect__icon-wrap">
        {item.icon ? (
          <IconRenderer iconName={item.icon} size={48} className="pet-care-effect__icon" />
        ) : (
          <Icon className="pet-care-effect__icon" aria-hidden="true" />
        )}
      </span>
    </div>
  );
};

const PetUseItemModal = ({ isOpen, category, item, preview, isLoading, onClose, onConfirm }) => {
  if (!isOpen || !item || !preview) {
    return null;
  }

  const Icon = ACTIVITY_ICONS[item.shape] ?? ITEM_ICONS[item.shape] ?? LuPackage2;
  const actionLabel = category === 'care' ? 'Use Care' : 'Use Food';
  const itemDescription = item.desc || PET_ITEM_DESCRIPTIONS[String(item.name || '').toLowerCase()] || '';

  return (
    <div className="pet-use-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="pet-use-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-use-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pet-use-modal__header">
          <div className="pet-use-modal__icon" aria-hidden="true">
            {item.icon ? (
              <IconRenderer iconName={item.icon} size={42} className="pet-use-modal__icon-svg" />
            ) : (
              <Icon className="pet-use-modal__icon-svg" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="pet-use-modal__eyebrow">{PET_ITEM_EFFECTS[category]?.label || 'Item'}</p>
            <h2 id="pet-use-modal-title">{item.name}</h2>
            {itemDescription && (
              <p className="pet-use-modal__desc">{itemDescription}</p>
            )}
          </div>
        </div>

        <div className="pet-use-modal__preview" aria-label="Status preview">
          {preview.rows.map(({ key, label, amount }) => (
            <div key={key} className="pet-use-modal__row">
              <span>{label}</span>
              <strong>+{amount}%</strong>
            </div>
          ))}
        </div>

        <div className="pet-use-modal__actions">
          <button type="button" className="pet-use-modal__button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className="pet-use-modal__button pet-use-modal__button--primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const PetInfoDropdown = ({ expanded, onToggle, rows }) => (
  <div className="pet-info-dropdown">
    <button
      type="button"
      className={`pet-round-button ${expanded ? 'pet-round-button--flipped' : ''}`}
      onClick={onToggle}
      aria-label={expanded ? 'Collapse pet info' : 'Expand pet info'}
      aria-expanded={expanded}
    >
      <LuChevronDown className="pet-topbar-icon" aria-hidden="true" />
    </button>
    <div className={`pet-info-panel ${expanded ? 'pet-info-panel--open' : ''}`} aria-hidden={!expanded}>
      {rows.filter(({ key }) => PET_STATUS_KEYS.includes(key)).map(({ key, label, value, Icon }) => (
        <div key={key} className="pet-info-item pet-info-item--stat" aria-label={`${label} ${value}%`}>
          <Icon className="pet-info-item__icon" aria-hidden="true" />
          <span className="pet-info-item__label">{value}%</span>
        </div>
      ))}
    </div>
  </div>
);

const PetPage = ({ onBack }) => {
  const petSaveQueueRef = useRef(Promise.resolve());
  const foodEffectTimeoutsRef = useRef(new Set());
  const careEffectTimeoutsRef = useRef(new Set());
  const [activeTab, setActiveTab] = useState('food');
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [moodFloatBatch, setMoodFloatBatch] = useState(() => createMoodFloatBatch());
  const [thoughtBubbleVisible, setThoughtBubbleVisible] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [moodItems, setMoodItems] = useState(() => normalizeMoodItems());
  const [currentActivityName, setCurrentActivityName] = useState('');
  const [currentMoodName, setCurrentMoodName] = useState('');
  const [currentLocationName, setCurrentLocationName] = useState('Home');
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isAddMoodModalOpen, setIsAddMoodModalOpen] = useState(false);
  const [isChooseActivityModalOpen, setIsChooseActivityModalOpen] = useState(false);
  const [isChooseMoodModalOpen, setIsChooseMoodModalOpen] = useState(false);
  const [isUpdateIconModalOpen, setIsUpdateIconModalOpen] = useState(false);
  const [isUpdateMoodIconModalOpen, setIsUpdateMoodIconModalOpen] = useState(false);
  const [activityToUpdate, setActivityToUpdate] = useState(null);
  const [moodToUpdate, setMoodToUpdate] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmMoodModalOpen, setIsConfirmMoodModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [petItems, setPetItems] = useState(() => ({
    food: DEFAULT_PET_ITEMS.food,
    care: DEFAULT_PET_ITEMS.care
  }));
  const [petStatus, setPetStatus] = useState(() => ({
    health: DEFAULT_PET_STATUS.health,
    hunger: DEFAULT_PET_STATUS.hunger,
    sanity: DEFAULT_PET_STATUS.sanity
  }));
  const [, setLastStatusTickAt] = useState(null);
  const [petItemModalCategory, setPetItemModalCategory] = useState(null);
  const [selectedPetUseItem, setSelectedPetUseItem] = useState(null);
  const [foodEffects, setFoodEffects] = useState([]);
  const [isFoodUseAnimating, setIsFoodUseAnimating] = useState(false);
  const [careEffects, setCareEffects] = useState([]);
  const [isCareUseAnimating, setIsCareUseAnimating] = useState(false);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const items = useMemo(() => (
    activeTab === 'activity'
      ? activityItems
      : activeTab === 'moods'
        ? moodItems
        : PET_ITEM_CATEGORIES.includes(activeTab)
          ? petItems[activeTab]
          : (TAB_ITEMS[activeTab] ?? TAB_ITEMS.food)
  ), [activeTab, activityItems, moodItems, petItems]);
  const petStatusRows = useMemo(() => createPetStatusRows(petStatus), [petStatus]);
  const petReaction = useMemo(() => getPetReaction(petStatus), [petStatus]);
  const selectedPetUsePreview = useMemo(() => (
    selectedPetUseItem
      ? getPetItemUsePreview(selectedPetUseItem.category, petStatus)
      : null
  ), [selectedPetUseItem, petStatus]);
  const moodFloatStyles = useMemo(() => (
    moodFloatBatch.map((moodFloatItem) => ({
      ...moodFloatStyle,
      '--pet-mood-delay': `${moodFloatItem.delaySeconds}s`,
      '--pet-mood-start-x': `${moodFloatItem.startOffsetPx}px`,
      '--pet-mood-mid-x': `${moodFloatItem.midOffsetPx}px`,
      '--pet-mood-end-x': `${moodFloatItem.endOffsetPx}px`,
      '--pet-mood-start-rotate': `${moodFloatItem.startRotateDeg}deg`,
      '--pet-mood-mid-rotate': `${moodFloatItem.midRotateDeg}deg`,
      '--pet-mood-end-rotate': `${moodFloatItem.endRotateDeg}deg`
    }))
  ), [moodFloatBatch]);
  const currentMoodItem = useMemo(() => (
    moodItems.find(item => item.name === currentMoodName) || moodItems[0] || null
  ), [currentMoodName, moodItems]);

  useEffect(() => {
    let cancelled = false;

    const loadPetPageData = async () => {
      try {
        const [status, pet] = await Promise.all([
          fetchStatus(),
          fetchPet().catch((error) => {
            console.warn('⚠️ Failed to fetch pet table data:', error);
            return null;
          })
        ]);

        if (!cancelled) {
          const activities = normalizeActivityItems(status?.doing);
          const moods = normalizeMoodItems(status?.mood);
          const locationName = getStatusText(status?.location) || 'Home';
          setActivityItems(activities);
          setMoodItems(moods);
          setCurrentLocationName(locationName);
          // Set current activity (first one in the list)
          if (activities.length > 0) {
            setCurrentActivityName(activities[0].name);
          }
          if (moods.length > 0) {
            setCurrentMoodName(moods[0].name);
          }

          setPetItems({
            food: normalizePetInventoryItems(pet?.food, DEFAULT_PET_ITEMS.food),
            care: normalizePetInventoryItems(pet?.care, DEFAULT_PET_ITEMS.care)
          });

          const decayResult = calculatePetStatusDecay(clampPetStatus(pet?.status), pet?.lastStatusTickAt);
          setPetStatus(decayResult.status);
          setLastStatusTickAt(decayResult.lastStatusTickAt);

          if (decayResult.shouldSave) {
            enqueuePetSave({
              status: decayResult.status,
              lastStatusTickAt: decayResult.lastStatusTickAt
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch pet page data:', error);
        if (!cancelled) {
          setActivityItems([]);
          setMoodItems(normalizeMoodItems());
          setCurrentActivityName('');
          setCurrentMoodName('');
          setCurrentLocationName('Home');
          setPetItems({
            food: DEFAULT_PET_ITEMS.food,
            care: DEFAULT_PET_ITEMS.care
          });
          setPetStatus({
            health: DEFAULT_PET_STATUS.health,
            hunger: DEFAULT_PET_STATUS.hunger,
            sanity: DEFAULT_PET_STATUS.sanity
          });
          setLastStatusTickAt(null);
        }
      }
    };

    loadPetPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMoodFloatBatch(createMoodFloatBatch());
    }, PET_MOOD_FLOAT_OPTIONS.runIntervalSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let hideTimeoutId;
    let replayTimeoutId;
    const playDurationMs = PET_THOUGHT_BUBBLE_OPTIONS.playDurationSeconds * 1000;
    const replayDelayMs = PET_THOUGHT_BUBBLE_OPTIONS.replayDelaySeconds * 1000;

    const playThoughtBubble = () => {
      setThoughtBubbleVisible(true);
      hideTimeoutId = window.setTimeout(() => {
        setThoughtBubbleVisible(false);
        replayTimeoutId = window.setTimeout(playThoughtBubble, replayDelayMs);
      }, playDurationMs);
    };

    playThoughtBubble();

    return () => {
      window.clearTimeout(hideTimeoutId);
      window.clearTimeout(replayTimeoutId);
    };
  }, []);

  useEffect(() => () => {
    foodEffectTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    foodEffectTimeoutsRef.current.clear();
    careEffectTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    careEffectTimeoutsRef.current.clear();
  }, []);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    window.history.back();
  };

  const enqueuePetSave = (updates) => {
    petSaveQueueRef.current = petSaveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const result = await savePet(updates);
        if (!result.success) {
          console.warn('⚠️ Background pet sync failed:', result.message);
        }
      })
      .catch((error) => {
        console.warn('⚠️ Background pet sync failed:', error);
      });
  };

  const handleAddPetItem = async (newItem) => {
    if (!petItemModalCategory || isSavingPet) return;

    setIsSavingPet(true);

    try {
      const category = petItemModalCategory;
      const nextItems = upsertPetItem(petItems[category], newItem);
      const result = await savePet({
        [category]: serializePetItems(nextItems)
      });

      if (result.success) {
        setPetItems(prev => ({
          ...prev,
          [category]: normalizePetInventoryItems(nextItems, DEFAULT_PET_ITEMS[category])
        }));
        setPetItemModalCategory(null);
      } else {
        console.error(`Failed to save pet ${category}:`, result.message);
        alert(`Failed to save pet ${category}. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving pet item:', error);
      alert('Failed to save pet item. Please try again.');
    } finally {
      setIsSavingPet(false);
    }
  };

  const handlePetItemClick = (item, category) => {
    if (isSavingPet) return;
    if (category === 'food' && isFoodUseAnimating) return;
    if (category === 'care' && isCareUseAnimating) return;

    const preview = getPetItemUsePreview(category, petStatus);
    if (!preview.canUse) return;

    setSelectedPetUseItem({ item, category });
  };

  const handleConfirmUsePetItem = () => {
    if (!selectedPetUseItem || !selectedPetUsePreview?.canUse) return;
    if (selectedPetUseItem.category === 'food' && isFoodUseAnimating) return;
    if (selectedPetUseItem.category === 'care' && isCareUseAnimating) return;

    const nextStatus = selectedPetUsePreview.nextStatus;
    const nextTickAt = new Date().toISOString();
    const usedPetItem = selectedPetUseItem;

    setPetStatus(nextStatus);
    setLastStatusTickAt(nextTickAt);
    setSelectedPetUseItem(null);

    if (usedPetItem.category === 'food') {
      const effectId = `${Date.now()}-${Math.random()}`;
      setIsFoodUseAnimating(true);
      setFoodEffects([{
        id: effectId,
        item: usedPetItem.item
      }]);
      const timeoutId = window.setTimeout(() => {
        handleFoodEffectDone(effectId);
        foodEffectTimeoutsRef.current.delete(timeoutId);
      }, PET_FOOD_EFFECT_DURATION_MS);
      foodEffectTimeoutsRef.current.add(timeoutId);
    }

    if (usedPetItem.category === 'care') {
      const effectId = `${Date.now()}-${Math.random()}`;
      setIsCareUseAnimating(true);
      setCareEffects([{
        id: effectId,
        item: usedPetItem.item
      }]);
      const timeoutId = window.setTimeout(() => {
        handleCareEffectDone(effectId);
        careEffectTimeoutsRef.current.delete(timeoutId);
      }, PET_CARE_EFFECT_DURATION_MS);
      careEffectTimeoutsRef.current.add(timeoutId);
    }

    enqueuePetSave({
      status: nextStatus,
      lastStatusTickAt: nextTickAt
    });
  };

  const handleFoodEffectDone = (effectId) => {
    setFoodEffects(prev => prev.filter(effect => effect.id !== effectId));
    setIsFoodUseAnimating(false);
  };

  const handleCareEffectDone = (effectId) => {
    setCareEffects(prev => prev.filter(effect => effect.id !== effectId));
    setIsCareUseAnimating(false);
  };

  const handleChooseActivityConfirm = async (activity) => {
    setIsSavingActivity(true);

    try {
      const result = await saveStatus({
        doing: {
          name: activity.name,
          icon: activity.icon
        }
      });

      if (result.success) {
        setCurrentActivityName(activity.name);
        setActivityItems(prev => {
          const filtered = prev.filter(item => item.name !== activity.name);
          return [activity, ...filtered];
        });
        setIsChooseActivityModalOpen(false);
      } else {
        console.error('Failed to set activity:', result.message);
        alert('Failed to set activity. Please try again.');
      }
    } catch (error) {
      console.error('Error setting activity:', error);
      alert('Failed to set activity. Please try again.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleChooseActivityUpdate = (activity) => {
    // Close choose modal and open update icon modal
    setIsChooseActivityModalOpen(false);
    setActivityToUpdate(activity);
    setIsUpdateIconModalOpen(true);
  };

  const handleUpdateIcon = async (updatedActivity) => {
    setIsSavingActivity(true);

    try {
      const result = await saveStatus({
        doing: {
          name: updatedActivity.name,
          icon: updatedActivity.icon
        }
      });

      if (result.success) {
        // Update activity in list
        setActivityItems(prev => {
          const filtered = prev.filter(item => item.name !== updatedActivity.name);
          return [updatedActivity, ...filtered];
        });
        setIsUpdateIconModalOpen(false);
        setActivityToUpdate(null);
      } else {
        console.error('Failed to update icon:', result.message);
        alert('Failed to update icon. Please try again.');
      }
    } catch (error) {
      console.error('Error updating icon:', error);
      alert('Failed to update icon. Please try again.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleAddActivity = async (newActivity, setAsCurrent) => {
  if (isSavingActivity) return;

  setIsSavingActivity(true);

  try {
    // Check if activity already exists
    const existingActivity = activityItems.find(
      item => item.name.toLowerCase() === newActivity.name.toLowerCase()
    );

    // Save to NocoDB
    const result = await saveStatus({
      doing: {
        name: newActivity.name,
        icon: newActivity.icon
      }
    });

    if (result.success) {
      if (existingActivity) {
        // Update existing activity (icon change or reorder)
        setActivityItems(prev => {
          const filtered = prev.filter(
            item => item.name.toLowerCase() !== newActivity.name.toLowerCase()
          );
          return [{
            name: newActivity.name,
            icon: newActivity.icon,
            shape: getActivityShape(newActivity.name)
          }, ...filtered];
        });
      } else {
        // Add new activity
        const normalizedActivity = {
          name: newActivity.name,
          icon: newActivity.icon,
          shape: getActivityShape(newActivity.name)
        };
        setActivityItems(prev => [normalizedActivity, ...prev]);
      }

      // Set as current activity if requested
      if (setAsCurrent) {
          setCurrentActivityName(newActivity.name);
        }

        setIsAddActivityModalOpen(false);
      } else {
        console.error('Failed to save activity:', result.message);
        alert('Failed to save activity. Please try again.');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleChooseMoodConfirm = async (mood) => {
    setIsSavingMood(true);

    try {
      const result = await saveStatus({
        mood: {
          name: mood.name,
          icon: mood.icon
        }
      });

      if (result.success) {
        setCurrentMoodName(mood.name);
        setMoodItems(prev => {
          const filtered = prev.filter(item => item.name !== mood.name);
          return [mood, ...filtered];
        });
        setIsChooseMoodModalOpen(false);
      } else {
        console.error('Failed to set mood:', result.message);
        alert('Failed to set mood. Please try again.');
      }
    } catch (error) {
      console.error('Error setting mood:', error);
      alert('Failed to set mood. Please try again.');
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleChooseMoodUpdate = (mood) => {
    setIsChooseMoodModalOpen(false);
    setMoodToUpdate(mood);
    setIsUpdateMoodIconModalOpen(true);
  };

  const handleUpdateMoodIcon = async (updatedMood) => {
    setIsSavingMood(true);

    try {
      const result = await saveStatus({
        mood: {
          name: updatedMood.name,
          icon: updatedMood.icon
        }
      });

      if (result.success) {
        setMoodItems(prev => {
          const filtered = prev.filter(item => item.name !== updatedMood.name);
          return [{ ...updatedMood, shape: getMoodShape(updatedMood.name) }, ...filtered];
        });
        setIsUpdateMoodIconModalOpen(false);
        setMoodToUpdate(null);
      } else {
        console.error('Failed to update mood icon:', result.message);
        alert('Failed to update mood icon. Please try again.');
      }
    } catch (error) {
      console.error('Error updating mood icon:', error);
      alert('Failed to update mood icon. Please try again.');
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleAddMood = async (newMood, setAsCurrent) => {
    if (isSavingMood) return;

    const moodName = String(newMood?.name || '').trim();
    if (!moodName) return;

    setIsSavingMood(true);

    try {
      const existingMood = moodItems.find(
        item => item.name.toLowerCase() === moodName.toLowerCase()
      );

      const result = await saveStatus({
        mood: {
          name: moodName,
          icon: newMood.icon || ''
        }
      });

      if (result.success) {
        const normalizedMood = {
          name: moodName,
          icon: newMood.icon || '',
          shape: getMoodShape(moodName)
        };

        if (existingMood) {
          setMoodItems(prev => {
            const filtered = prev.filter(
              item => item.name.toLowerCase() !== moodName.toLowerCase()
            );
            return [normalizedMood, ...filtered];
          });
        } else {
          setMoodItems(prev => [normalizedMood, ...prev]);
        }

        if (setAsCurrent) {
          setCurrentMoodName(moodName);
        }

        setIsAddMoodModalOpen(false);
      } else {
        console.error('Failed to save mood:', result.message);
        alert('Failed to save mood. Please try again.');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood. Please try again.');
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleMoodCardClick = (mood) => {
    setSelectedMood(mood);
    setIsConfirmMoodModalOpen(true);
  };

  const handleConfirmSetCurrentMood = async (newIcon, updateIconOnly = false) => {
    if (!selectedMood || isSavingMood) return;

    setIsSavingMood(true);

    try {
      const iconToSave = newIcon !== undefined ? newIcon : selectedMood.icon;
      const result = await saveStatus({
        mood: {
          name: selectedMood.name,
          icon: iconToSave
        }
      });

      if (result.success) {
        const updatedMood = {
          ...selectedMood,
          icon: iconToSave,
          shape: getMoodShape(selectedMood.name)
        };

        if (!updateIconOnly) {
          setCurrentMoodName(selectedMood.name);
        }

        setMoodItems(prev => {
          const filtered = prev.filter(item => item.name !== selectedMood.name);
          return [updatedMood, ...filtered];
        });

        setIsConfirmMoodModalOpen(false);
        setSelectedMood(null);
      } else {
        console.error('Failed to set current mood:', result.message);
        alert('Failed to set current mood. Please try again.');
      }
    } catch (error) {
      console.error('Error setting current mood:', error);
      alert('Failed to set current mood. Please try again.');
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleActivityCardClick = (activity) => {
    setSelectedActivity(activity);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSetCurrent = async (newIcon, updateIconOnly = false) => {
    if (!selectedActivity || isSavingActivity) return;

    setIsSavingActivity(true);

    try {
      // Use new icon if provided, otherwise keep existing
      const iconToSave = newIcon !== undefined ? newIcon : selectedActivity.icon;

      // Save to NocoDB to update the order (move to first position)
      const result = await saveStatus({
        doing: {
          name: selectedActivity.name,
          icon: iconToSave
        }
      });

      if (result.success) {
        // Update activity in list with new icon
        const updatedActivity = {
          ...selectedActivity,
          icon: iconToSave
        };

        // Update current activity (unless it's icon-only update)
        if (!updateIconOnly) {
          setCurrentActivityName(selectedActivity.name);
        }

        // Reorder activities list to move selected to first
        setActivityItems(prev => {
          const filtered = prev.filter(item => item.name !== selectedActivity.name);
          return [updatedActivity, ...filtered];
        });

        setIsConfirmModalOpen(false);
        setSelectedActivity(null);
      } else {
        console.error('Failed to set current activity:', result.message);
        alert('Failed to set current activity. Please try again.');
      }
    } catch (error) {
      console.error('Error setting current activity:', error);
      alert('Failed to set current activity. Please try again.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  return (
    <main className="pet-page">
      <section className="pet-phone" aria-label="Virtual pet preview">
        <div className="pet-topbar">
          <button type="button" className="pet-round-button" onClick={handleBack} aria-label="Back">
            <LuChevronLeft className="pet-topbar-icon" aria-hidden="true" />
          </button>
          <div className="pet-nameplate" aria-label={`Méo, current location ${currentLocationName}`}>
            <span className="pet-nameplate__flip" aria-hidden="true">
              <span className="pet-nameplate__face pet-nameplate__face--front">Méo</span>
              <span className="pet-nameplate__face pet-nameplate__face--back">{currentLocationName}</span>
            </span>
          </div>
          <PetInfoDropdown expanded={infoExpanded} onToggle={() => setInfoExpanded(v => !v)} rows={petStatusRows} />
        </div>

        <div className={`pet-stage pet-stage--${petReaction.level}`}>
          <div className={`pet-bubble ${thoughtBubbleVisible ? 'pet-bubble--visible' : ''}`} aria-hidden={!thoughtBubbleVisible}>
            <p>{petReaction.message}</p>
          </div>

          <div className="pet-stage-indicators" aria-label="Pet context">
            {moodFloatBatch.map((moodFloatItem, index) => (
              <div key={moodFloatItem.id} className="pet-mood-float" style={moodFloatStyles[index]} aria-label={`Current mood ${currentMoodItem?.name || PET_CURRENT_MOOD.label}`}>
                {currentMoodItem?.icon ? (
                  <IconRenderer iconName={currentMoodItem.icon} size={18} className="pet-mood-float__icon" />
                ) : (
                  <PET_CURRENT_MOOD.Icon className="pet-mood-float__icon" aria-hidden="true" />
                )}
                <span>{currentMoodItem?.name || PET_CURRENT_MOOD.label}</span>
              </div>
            ))}
          </div>

          <div className="pet-food-effects" aria-hidden="true">
            {foodEffects.map((effect) => (
              <PetStageFoodEffect
                key={effect.id}
                effect={effect}
                onDone={handleFoodEffectDone}
              />
            ))}
          </div>

          <div className="pet-care-effects" aria-hidden="true">
            {careEffects.map((effect) => (
              <PetStageCareEffect
                key={effect.id}
                effect={effect}
                onDone={handleCareEffectDone}
              />
            ))}
          </div>

          <div className={`pet-character pet-character--pet pet-character--${petReaction.level}`} role="img" aria-label="Meo pet placeholder">
            <span className="pet-character__ear pet-character__ear--left" />
            <span className="pet-character__ear pet-character__ear--right" />
            <span className="pet-character__face">
              <span className="pet-character__eye pet-character__eye--left" />
              <span className="pet-character__eye pet-character__eye--right" />
              <span className="pet-character__nose" />
              <span className="pet-character__mouth" />
            </span>
            <span className="pet-character__body" />
            <span className="pet-character__tail" />
            <span className="pet-character__shadow" />
          </div>
        </div>

        <section className="pet-bottom-sheet" aria-label="Pet item inventory preview">
          <nav className="pet-tabs" aria-label="Pet inventory categories">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                className={`pet-tab ${activeTab === key ? 'pet-tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
                aria-pressed={activeTab === key}
              >
                <Icon className="pet-tab-icon" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="pet-sheet-scroll">
            {activeTab === 'status' ? (
              <PetStatusPanel
                rows={petStatusRows}
              />
            ) : (
              <div className="pet-item-grid">
                {PET_ITEM_CATEGORIES.includes(activeTab) && (
                  <button
                    type="button"
                    className="pet-item-card pet-item-card--add"
                    onClick={() => setPetItemModalCategory(activeTab)}
                    aria-label={`Add new ${activeTab} item`}
                    disabled={isSavingPet}
                  >
                    <LuPlus className="pet-item-icon" aria-hidden="true" />
                    <span className="pet-item-card__name">Add</span>
                  </button>
                )}
                {activeTab === 'moods' && (
                  <>
                    <button
                      type="button"
                      className="pet-item-card pet-item-card--add"
                      onClick={() => setIsAddMoodModalOpen(true)}
                      aria-label="Add new mood"
                      disabled={isSavingMood}
                    >
                      <LuPlus className="pet-item-icon" aria-hidden="true" />
                      <span className="pet-item-card__name">Add</span>
                    </button>
                    <button
                      type="button"
                      className="pet-item-card pet-item-card--choose"
                      onClick={() => setIsChooseMoodModalOpen(true)}
                      aria-label="Choose existing mood"
                      disabled={isSavingMood}
                    >
                      <LuSearch className="pet-item-icon" aria-hidden="true" />
                      <span className="pet-item-card__name">Choose</span>
                    </button>
                  </>
                )}
                {activeTab === 'activity' && (
                  <>
                    <button
                      type="button"
                      className="pet-item-card pet-item-card--add"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      aria-label="Add new activity"
                    >
                      <LuPlus className="pet-item-icon" aria-hidden="true" />
                      <span className="pet-item-card__name">Add</span>
                    </button>
                    <button
                      type="button"
                      className="pet-item-card pet-item-card--choose"
                      onClick={() => setIsChooseActivityModalOpen(true)}
                      aria-label="Choose existing activity"
                    >
                      <LuSearch className="pet-item-icon" aria-hidden="true" />
                      <span className="pet-item-card__name">Choose</span>
                    </button>
                  </>
                )}
                {items.map((item, index) => {
                  const petUsePreview = PET_ITEM_CATEGORIES.includes(activeTab)
                    ? getPetItemUsePreview(activeTab, petStatus)
                    : null;
                  const isFoodLocked = activeTab === 'food' && isFoodUseAnimating;
                  const isCareLocked = activeTab === 'care' && isCareUseAnimating;
                  const isPetItemDisabled = Boolean(petUsePreview && (!petUsePreview.canUse || isSavingPet || isFoodLocked || isCareLocked));
                  const disabledReason = isFoodLocked
                    ? 'Đợi món trước tan hết đã nha.'
                    : isCareLocked
                      ? 'Đợi chăm sóc xong rồi dùng món tiếp theo nha.'
                      : petUsePreview?.reason;

                  return (
                    <PetItemCard
                      key={`${item.name}-${item.shape}-${index}`}
                      item={item}
                      showCount={false}
                      showEmptyIcon={activeTab === 'activity' || activeTab === 'moods'}
                      isCurrent={
                        (activeTab === 'activity' && item.name === currentActivityName)
                        || (activeTab === 'moods' && item.name === currentMoodName)
                      }
                      disabled={isPetItemDisabled}
                      disabledReason={disabledReason}
                      onClick={
                        activeTab === 'activity'
                          ? () => handleActivityCardClick(item)
                          : activeTab === 'moods'
                            ? () => handleMoodCardClick(item)
                            : PET_ITEM_CATEGORIES.includes(activeTab)
                              ? () => handlePetItemClick(item, activeTab)
                              : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </section>

      <ChooseActivityModal
        isOpen={isChooseActivityModalOpen}
        onClose={() => setIsChooseActivityModalOpen(false)}
        onConfirm={handleChooseActivityConfirm}
        onUpdate={handleChooseActivityUpdate}
        existingActivities={activityItems}
        isLoading={isSavingActivity}
      />

      <ChooseActivityModal
        isOpen={isChooseMoodModalOpen}
        onClose={() => setIsChooseMoodModalOpen(false)}
        onConfirm={handleChooseMoodConfirm}
        onUpdate={handleChooseMoodUpdate}
        existingActivities={moodItems}
        isLoading={isSavingMood}
        title="Choose Mood"
        searchPlaceholder="Search moods..."
        emptyText="No moods found"
      />

      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onSave={handleAddActivity}
        isLoading={isSavingActivity}
      />

      <AddActivityModal
        isOpen={isAddMoodModalOpen}
        onClose={() => {
          if (!isSavingMood) {
            setIsAddMoodModalOpen(false);
          }
        }}
        onSave={handleAddMood}
        isLoading={isSavingMood}
        title="Add New Mood"
        itemLabel="Mood"
        namePlaceholder="Enter mood name..."
        saveOnlyLabel="Save Only"
        saveAndSelectLabel="Save & Select"
        showIconPicker
        requireIcon
      />

      <AddActivityModal
        isOpen={!!petItemModalCategory}
        onClose={() => {
          if (!isSavingPet) {
            setPetItemModalCategory(null);
          }
        }}
        onSave={handleAddPetItem}
        isLoading={isSavingPet}
        title={`Add New ${petItemModalCategory === 'care' ? 'Care' : 'Food'}`}
        itemLabel="Name"
        namePlaceholder={`Enter ${petItemModalCategory === 'care' ? 'care' : 'food'} name...`}
        saveLabel="Save"
        showSaveAndSelect={false}
      />

      <UpdateIconModal
        isOpen={isUpdateIconModalOpen}
        onClose={() => {
          setIsUpdateIconModalOpen(false);
          setActivityToUpdate(null);
        }}
        onSave={handleUpdateIcon}
        activity={activityToUpdate}
        isLoading={isSavingActivity}
      />

      <UpdateIconModal
        isOpen={isUpdateMoodIconModalOpen}
        onClose={() => {
          setIsUpdateMoodIconModalOpen(false);
          setMoodToUpdate(null);
        }}
        onSave={handleUpdateMoodIcon}
        activity={moodToUpdate}
        isLoading={isSavingMood}
        itemLabel="Mood"
      />

      <ConfirmActivityModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedActivity(null);
        }}
        onConfirm={handleConfirmSetCurrent}
        activityName={selectedActivity?.name || ''}
        activityIcon={selectedActivity?.icon || ''}
        isLoading={isSavingActivity}
      />

      <ConfirmActivityModal
        isOpen={isConfirmMoodModalOpen}
        onClose={() => {
          setIsConfirmMoodModalOpen(false);
          setSelectedMood(null);
        }}
        onConfirm={handleConfirmSetCurrentMood}
        activityName={selectedMood?.name || ''}
        activityIcon={selectedMood?.icon || ''}
        isLoading={isSavingMood}
        title="Set Current Mood"
        messageLabel="current mood"
        iconErrorText="(Please select an icon for the mood.)"
      />

      <PetUseItemModal
        isOpen={Boolean(selectedPetUseItem)}
        category={selectedPetUseItem?.category}
        item={selectedPetUseItem?.item}
        preview={selectedPetUsePreview}
        isLoading={false}
        onClose={() => {
          setSelectedPetUseItem(null);
        }}
        onConfirm={handleConfirmUsePetItem}
      />
    </main>
  );
};

export default PetPage;
