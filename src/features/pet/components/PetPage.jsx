import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LuHammer, LuBed, LuTrainFront, LuSunset, LuWaves, LuLaptop, LuPlus, LuSearch, LuCamera,
  LuImage, LuGalleryHorizontal, LuX, LuCheck
} from 'react-icons/lu';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import { LanguageProvider, CharacterProvider } from '../../../contexts';
import { characterData } from '../../../data/characterData';
import { useCharacterData } from '../../../hooks/useCharacterData';
import {
  CHARACTER_ID,
  clearNocoDBCache,
  fetchPet,
  fetchStatus,
  savePet,
  saveStatus,
  savePhotoAlbum,
  uploadProfileGalleryImages
} from '../../../services';
import LoadingDialog from '../../../components/common/LoadingDialog/LoadingDialog';
import { saveStatusChangesJournal } from '../../../utils/questJournalUtils';
import { PhotoAlbumTab, GalleryTab } from '../../photoalbum/components';
import { JournalTab, HistoryTab } from '../../journal/components';
import AddActivityModal from './AddActivityModal';
import ChooseActivityModal from './ChooseActivityModal';
import UpdateIconModal from './UpdateIconModal';
import ConfirmActivityModal from './ConfirmActivityModal';
import UpdateLocationModal from './UpdateLocationModal';
import '../styles/pet.css';

// Get time period based on current hour
const getTimePeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 21) return 'evening';
  if (hour >= 21 && hour < 23) return 'night';
  return 'midnight'; // 23-5h
};

// Check if current time is meal time
const getMealTime = (hour, minute) => {
  if (hour === 8 && minute === 0) return 'breakfast';
  if (hour === 11 && minute === 0) return 'lunch';
  if (hour === 18 && minute === 0) return 'dinner';
  return null;
};

// Check if it's bedtime
const isBedtime = (hour) => {
  return hour >= 22 || hour < 5; // 10 PM to 5 AM
};

const getVietnameseTimeLabel = (date = new Date()) => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const displayHour = hour % 12 || 12;
  const dayPart = hour < 11
    ? 'sáng'
    : hour < 13
      ? 'trưa'
      : hour < 18
        ? 'chiều'
        : 'tối';
  const minuteLabel = minute > 0 ? ` ${String(minute).padStart(2, '0')}` : '';

  return `${displayHour} giờ${minuteLabel} ${dayPart}`;
};

// Check if meal was eaten today
const wasMealEatenToday = (lastMealTimestamp) => {
  if (!lastMealTimestamp) return false;
  const now = new Date();
  const lastMeal = new Date(lastMealTimestamp);
  return now.toDateString() === lastMeal.toDateString();
};

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
  bed: LuBedSingle,
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
    { name: 'Bed', count: 1, shape: 'bed' },
    { name: 'Brush', count: 1, shape: 'brush' },
    { name: 'Soap', count: 0, shape: 'soap' },
    { name: 'Bandage', count: 2, shape: 'bandage' },
    { name: 'Comb', count: 1, shape: 'brush' },
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
  { key: 'album', label: 'Album', Icon: LuImage },
  { key: 'gallery', label: 'Gallery', Icon: LuGalleryHorizontal },
  { key: 'journal', label: 'Journal', Icon: LuFootprints },
  { key: 'history', label: 'History', Icon: LuBookOpen },
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
const PET_STATUS_DECAY_CHUNK_MS = 60 * 60 * 1000;
const PET_STATUS_DECAY = {
  hunger: 5,  // -5%/giờ (Ultra Hardcore: thay vì -2%)
  sanity: 4,  // -4%/giờ (Ultra Hardcore: thay vì -1%)
  health: 3   // -3%/giờ khi neglect (Ultra Hardcore: thay vì -1%)
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
  itemsPerRun: 3,
  itemDelaySeconds: 1.5,
  bubbleSizePx: 78,
  iconSizePx: 18,
  floatDistancePx: 96,
  startOffsetRangePx: 18,
  endOffsetRangePx: 44,
  rotateRangeDeg: 9,
  startScale: 0.58,
  endScale: 1.12,
  // Timing configuration (similar to thought bubble)
  timing: {
    minDelay: 8,   // Show mood every 8-15 seconds
    maxDelay: 15,
    showChance: 0.90  // 90% chance to show
  },
  initialDelaySeconds: 6,  // Wait 6s before first mood float
  interactionCooldownSeconds: 5  // Cooldown after user interaction
};

const PET_THOUGHT_BUBBLE_OPTIONS = {
  playDurationSeconds: 7,
  // Smart timing based on pet status level (5-15s boundary for active feel)
  timing: {
    critical: { minDelay: 5, maxDelay: 7, showChance: 0.95 },   // Most urgent - very frequent
    danger: { minDelay: 5, maxDelay: 9, showChance: 0.90 },     // High urgency
    warning: { minDelay: 5, maxDelay: 11, showChance: 0.85 },   // Medium urgency
    normal: { minDelay: 5, maxDelay: 13, showChance: 0.80 },    // Active feel
    excellent: { minDelay: 5, maxDelay: 15, showChance: 0.75 }  // Still active, slightly relaxed
  },
  initialDelaySeconds: 5, // Wait before first bubble (reduced for faster start)
  interactionCooldownSeconds: 8 // Cooldown after user interaction (reduced)
};

const BIOLOGICAL_CLOCK_MESSAGES = {
  breakfast: [
    "Tui đói rồi! Đến giờ ăn sáng rồi!",
    ({ timeLabel }) => `${timeLabel} rồi, tui cần ăn sáng!`,
    "Bụng tui sôi ùng ục! Giờ ăn sáng đây!"
  ],
  lunch: [
    "Tui đói bụng! Đến giờ ăn trưa rồi!",
    ({ timeLabel }) => `${timeLabel} rồi, tui cần ăn trưa!`,
    "Trưa rồi mà chưa ăn, tui đói quá!"
  ],
  dinner: [
    "Tui đói lắm! Đến giờ ăn tối rồi!",
    ({ timeLabel }) => `${timeLabel} rồi, tui cần ăn tối!`,
    "Tối rồi mà chưa ăn, tui sắp xỉu!"
  ],
  bedtime: [
    "Tui buồn ngủ quá! Đến giờ ngủ rồi!",
    ({ timeLabel }) => `${timeLabel} rồi, tui cần nghỉ ngơi!`,
    "Tui mệt lắm, để tui ngủ đi!"
  ]
};

const PET_FOOD_EFFECT_DURATION_MS = 3000;
const PET_CARE_EFFECT_DURATION_MS = 3000;
const PET_CAMERA_RAISE_DURATION_MS = 400;
const PET_CAMERA_FLASH_DURATION_MS = 500;
const PET_CAMERA_POST_FLASH_HOLD_MS = 500;
const PET_CAMERA_LOWER_DURATION_MS = 400;
const PET_CAMERA_READY_TIMEOUT_MS = 10000;

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
  if (value <= 20) return 'critical';
  if (value <= 40) return 'danger';
  if (value <= 60) return 'warning';
  if (value < 80) return 'normal';
  return 'excellent';
};

const getWeakestPetStatus = (status = {}) => (
  PET_STATUS_KEYS
    .map((key) => ({ key, value: clampPetStatusValue(status[key]) }))
    .reduce((weakest, stat) => (stat.value < weakest.value ? stat : weakest), {
      key: 'health',
      value: 100
    })
);

// Expanded message library with 60+ messages using "tui" pronoun
const PET_MESSAGES = {
  critical: {
    health: [
      'Tui yếu quá rồi... Cần chăm sóc gấp!',
      'Sức khỏe tui đang rất tệ. Giúp tui với!',
      'Tui không còn sức nữa... Chăm sóc tui đi...',
      'Đau quá... Tui cần được chữa trị ngay!'
    ],
    hunger: [
      'Bụng tui đói cồn cào! Cho tui ăn gấp!',
      'Tui đói đến mức chóng mặt rồi...',
      'Không có gì ăn à? Tui sắp ngất đói!',
      'Đói quá... Tui cần thức ăn ngay bây giờ!'
    ],
    sanity: [
      'Đầu óc tui rối loạn quá... Giúp tui!',
      'Tui không thể suy nghĩ được nữa...',
      'Stress quá! Tui cần được dỗ dành ngay!',
      'Tâm trạng tui tệ lắm... Chăm sóc tui đi...'
    ]
  },
  danger: {
    health: [
      'Tui đang không khỏe lắm... Chăm sóc tui nhé.',
      'Sức khỏe tui đang yếu dần. Cần giúp đỡ!',
      'Tui cảm thấy mệt mỏi... Giúp tui hồi phục nhé.'
    ],
    hunger: [
      'Bụng tui đói rồi! Cho tui ăn với.',
      'Tui cần thức ăn ngay! Đói quá!',
      'Lâu rồi không ăn gì... Cho tui ăn đi.'
    ],
    sanity: [
      'Tui đang stress... Dỗ dành tui một chút.',
      'Tâm trạng tui không tốt. Chăm sóc tui nhé.',
      'Đầu óc tui hơi rối... Giúp tui bình tĩnh lại.'
    ]
  },
  warning: {
    health: [
      'Tui hơi mệt... Chăm sóc thêm sẽ tốt hơn.',
      'Sức khỏe tui cần được cải thiện một chút.',
      'Tui vẫn ổn, nhưng cần chăm sóc thêm.'
    ],
    hunger: [
      'Tui hơi đói rồi. Một món ăn nhẹ nhé?',
      'Bụng tui bắt đầu đói... Cho tui ăn nhé.',
      'Tui muốn ăn gì đó... Có gì không?'
    ],
    sanity: [
      'Tui cần được dỗ dành một chút.',
      'Tâm trạng tui cần cải thiện thêm.',
      'Chăm sóc tui một chút sẽ tốt hơn.'
    ]
  },
  normal: {
    health: [
      'Tui đang khỏe! Nhưng chăm sóc thêm càng tốt.',
      'Sức khỏe tui ổn định. Cảm ơn đã chăm sóc!',
      'Tui cảm thấy khá tốt hôm nay!'
    ],
    hunger: [
      'Tui no rồi, nhưng món gì ngon thì tui vẫn ăn!',
      'Bụng tui đầy đủ. Cảm ơn đã cho ăn!',
      'Tui đã no, nhưng snack thì luôn được!'
    ],
    sanity: [
      'Tâm trạng tui tốt! Cảm ơn đã quan tâm.',
      'Tui đang vui vẻ! Mọi thứ đều ổn.',
      'Tui cảm thấy bình yên và hạnh phúc!'
    ]
  },
  excellent: {
    health: [
      'Tui khỏe như vâm! Năng lượng tràn đầy!',
      'Sức khỏe tui tuyệt vời! Tui có thể làm mọi thứ!',
      'Tui cảm thấy mạnh mẽ và tràn đầy sức sống!'
    ],
    hunger: [
      'Tui no căng bụng! Ngon lắm!',
      'Bụng tui đầy ắp! Cảm ơn đã cho ăn ngon!',
      'Tui no nê rồi! Hạnh phúc quá!'
    ],
    sanity: [
      'Tui vui như Tết! Mọi thứ đều tuyệt vời!',
      'Tâm trạng tui tuyệt đỉnh! Yêu đời quá!',
      'Tui hạnh phúc lắm! Cảm ơn đã yêu thương tui!'
    ]
  }
};

// Track recent messages to avoid repeats
let recentMessages = [];
const MAX_RECENT_MESSAGES = 5;

const getPetReaction = (status = {}, biologicalClock = {}) => {
  // Calculate regular status first
  const weakest = getWeakestPetStatus(status);
  const level = getPetStatusLevel(weakest.value);
  const timeLabel = getVietnameseTimeLabel();
  const pickBiologicalClockMessage = (messages = []) => {
    const message = messages[Math.floor(Math.random() * messages.length)];
    return typeof message === 'function' ? message({ timeLabel }) : message;
  };

  // Priority 1: Biological clock warnings (only for messages, not for visual state)
  if (biologicalClock.isHungry && biologicalClock.currentMealTime) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES[biologicalClock.currentMealTime];
    const message = pickBiologicalClockMessage(messages);
    return {
      level,  // Use actual status level, not forced 'critical'
      weakest,
      message
    };
  }

  if (biologicalClock.isSleepy) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES.bedtime;
    const message = pickBiologicalClockMessage(messages);
    return {
      level,  // Use actual status level, not forced 'critical'
      weakest,
      message
    };
  }

  // Priority 2: Regular status-based messages
  const messages = PET_MESSAGES[level]?.[weakest.key] || [];

  if (messages.length === 0) {
    return {
      level,
      weakest,
      message: 'Tui đang ở đây nè!'
    };
  }

  // Filter out recent messages to avoid repeats
  const availableMessages = messages.filter(msg => !recentMessages.includes(msg));
  const messagePool = availableMessages.length > 0 ? availableMessages : messages;

  // Pick random message
  const message = messagePool[Math.floor(Math.random() * messagePool.length)];

  // Update recent messages
  recentMessages.push(message);
  if (recentMessages.length > MAX_RECENT_MESSAGES) {
    recentMessages.shift();
  }

  return {
    level,
    weakest,
    message
  };
};

const PET_CHARACTER_STATES = {
  stable: 'stable',
  needsCare: 'needs-care',
  critical: 'critical',
  excellent: 'excellent',
  sleeping: 'sleeping'
};

const PET_CHARACTER_EFFECTS = {
  idle: 'idle',
  wobble: 'wobble',
  hop: 'hop',
  wave: 'wave',
  squash: 'squash'
};

const PET_CHARACTER_EFFECT_DURATIONS = {
  idle: 'default',
  wobble: '1.15s',
  hop: '0.95s',
  wave: '1.2s',
  squash: '1.25s',
  sleepBreathe: '2s',
  needsCareTilt: '3.3s'
};

const PET_CHARACTER_DEBUG_PRESETS = [
  {
    label: 'Stable idle',
    state: PET_CHARACTER_STATES.stable,
    effect: PET_CHARACTER_EFFECTS.idle,
    speed: PET_CHARACTER_EFFECT_DURATIONS.idle
  },
  {
    label: 'Stable wave',
    state: PET_CHARACTER_STATES.stable,
    effect: PET_CHARACTER_EFFECTS.wave,
    speed: PET_CHARACTER_EFFECT_DURATIONS.wave
  },
  {
    label: 'Stable hop',
    state: PET_CHARACTER_STATES.stable,
    effect: PET_CHARACTER_EFFECTS.hop,
    speed: PET_CHARACTER_EFFECT_DURATIONS.hop
  },
  {
    label: 'Needs care idle',
    state: PET_CHARACTER_STATES.needsCare,
    effect: PET_CHARACTER_EFFECTS.idle,
    speed: PET_CHARACTER_EFFECT_DURATIONS.needsCareTilt
  },
  {
    label: 'Critical wobble',
    state: PET_CHARACTER_STATES.critical,
    effect: PET_CHARACTER_EFFECTS.wobble,
    speed: PET_CHARACTER_EFFECT_DURATIONS.wobble
  },
  {
    label: 'Excellent hop',
    state: PET_CHARACTER_STATES.excellent,
    effect: PET_CHARACTER_EFFECTS.hop,
    speed: PET_CHARACTER_EFFECT_DURATIONS.hop
  },
  {
    label: 'Meal squash',
    state: PET_CHARACTER_STATES.stable,
    effect: PET_CHARACTER_EFFECTS.squash,
    speed: PET_CHARACTER_EFFECT_DURATIONS.squash
  },
  {
    label: 'Sleeping idle',
    state: PET_CHARACTER_STATES.sleeping,
    effect: PET_CHARACTER_EFFECTS.idle,
    speed: PET_CHARACTER_EFFECT_DURATIONS.sleepBreathe
  }
];

const getBasePetCharacterState = (reactionLevel) => {
  if (reactionLevel === 'critical') return PET_CHARACTER_STATES.critical;
  if (reactionLevel === 'danger' || reactionLevel === 'warning') return PET_CHARACTER_STATES.needsCare;
  if (reactionLevel === 'excellent') return PET_CHARACTER_STATES.excellent;
  return PET_CHARACTER_STATES.stable;
};

const getPetCharacterPresentation = ({
  reactionLevel,
  biologicalClock = {},
  isSleeping,
  isAwakening,
  hasItemFeedback,
  thoughtBubbleVisible,
  entryWaveActive
}) => {
  const baseState = getBasePetCharacterState(reactionLevel);

  if (isSleeping) {
    return {
      state: PET_CHARACTER_STATES.sleeping,
      effect: PET_CHARACTER_EFFECTS.idle
    };
  }

  if (isAwakening) {
    return {
      state: PET_CHARACTER_STATES.stable,
      effect: PET_CHARACTER_EFFECTS.idle
    };
  }

  if (hasItemFeedback) {
    return {
      state: PET_CHARACTER_STATES.stable,
      effect: PET_CHARACTER_EFFECTS.hop
    };
  }

  if (reactionLevel === 'critical') {
    return {
      state: PET_CHARACTER_STATES.critical,
      effect: PET_CHARACTER_EFFECTS.wobble
    };
  }

  if (biologicalClock.isSleepy) {
    return {
      state: baseState,
      effect: PET_CHARACTER_EFFECTS.wave
    };
  }

  if (biologicalClock.isHungry && biologicalClock.currentMealTime) {
    return {
      state: baseState,
      effect: PET_CHARACTER_EFFECTS.squash
    };
  }

  if (reactionLevel === 'excellent') {
    return {
      state: PET_CHARACTER_STATES.excellent,
      effect: PET_CHARACTER_EFFECTS.hop
    };
  }

  if (baseState === PET_CHARACTER_STATES.stable && (thoughtBubbleVisible || entryWaveActive)) {
    return {
      state: PET_CHARACTER_STATES.stable,
      effect: PET_CHARACTER_EFFECTS.wave
    };
  }

  return {
    state: baseState,
    effect: PET_CHARACTER_EFFECTS.idle
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

const getPetItemUsePreview = (category, status = {}, itemShape = null, itemName = null) => {
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

  // Bed item is always usable (for sleep animation)
  const isBedItem = itemShape === 'bed' || itemShape === 'mat' || (itemName && itemName.toLowerCase() === 'bed');
  const canUse = isBedItem || (category === 'food'
    ? currentStatus.hunger < 100 || currentStatus.health < 100
    : currentStatus.health < 100 || currentStatus.sanity < 100);

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
      console.log('🔧 Normalizing:', name, '→ shape:', shape, '(from item.shape:', item.shape, ', DEFAULT:', DEFAULT_PET_SHAPES[name.toLowerCase()], ')');
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

const PetInfoDropdown = ({ expanded, onToggle, rows, isDataLoaded }) => {
  const [animatingKeys, setAnimatingKeys] = useState(new Map());
  const prevValuesRef = useRef({});
  const [displayValues, setDisplayValues] = useState({});
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Initialize display values immediately when data is loaded
    if (isDataLoaded && !isInitializedRef.current) {
      const initialValues = {};
      rows.forEach(({ key, value }) => {
        if (PET_STATUS_KEYS.includes(key)) {
          initialValues[key] = value;
          prevValuesRef.current[key] = value;
        }
      });
      setDisplayValues(initialValues);
      isInitializedRef.current = true;
      return;
    }

    const newAnimatingKeys = new Map();
    const pendingValues = {};
    
    rows.forEach(({ key, value }) => {
      if (!PET_STATUS_KEYS.includes(key)) return;
      const currentDisplayValue = displayValues[key] ?? prevValuesRef.current[key];
      
      if (value !== currentDisplayValue) {
        // Store animation type: 'increase' or 'decrease'
        newAnimatingKeys.set(key, value > currentDisplayValue ? 'increase' : 'decrease');
        pendingValues[key] = value;
      }
    });

    if (newAnimatingKeys.size > 0) {
      // Delay animation to wait for food/care effect to complete (3000ms)
      const delayTimeout = setTimeout(() => {
        setAnimatingKeys(newAnimatingKeys);
        // Update display values at the same time animation starts
        setDisplayValues(prev => ({ ...prev, ...pendingValues }));
        Object.keys(pendingValues).forEach(key => {
          prevValuesRef.current[key] = pendingValues[key];
        });
        
        // Clear animation state after animation completes (600ms)
        setTimeout(() => {
          setAnimatingKeys(new Map());
        }, 600);
      }, 3000);

      return () => clearTimeout(delayTimeout);
    }
  }, [rows, isDataLoaded]);

  return (
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
        {isDataLoaded && rows.filter(({ key }) => PET_STATUS_KEYS.includes(key)).map(({ key, label, value, Icon }) => {
          const animationType = animatingKeys.get(key);
          const isAnimating = animationType !== undefined;
          const isIncrease = animationType === 'increase';
          const isDecrease = animationType === 'decrease';
          const displayValue = displayValues[key] ?? value;
          return (
            <div 
              key={key} 
              className={`pet-info-item pet-info-item--stat ${
                isIncrease ? 'pet-info-item--animating-increase' : 
                isDecrease ? 'pet-info-item--animating-decrease' : ''
              }`}
              aria-label={`${label} ${displayValue}%`}
            >
              <Icon className="pet-info-item__icon" aria-hidden="true" />
              <span className="pet-info-item__label">{displayValue}%</span>
              {isIncrease && (
                <span className="pet-info-item__sparkle pet-info-item__sparkle--increase" aria-hidden="true">+</span>
              )}
              {isDecrease && (
                <span className="pet-info-item__sparkle pet-info-item__sparkle--decrease" aria-hidden="true">-</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PET_CAMERA_SAVE_TARGETS = [
  {
    key: 'gallery',
    label: 'Gallery',
    description: 'Show this pet photo in the gallery tab.',
    Icon: LuGalleryHorizontal
  },
  {
    key: 'album',
    label: 'Album',
    description: 'Save this pet photo as a photo album entry.',
    Icon: LuImage
  }
];

const createPetCameraDefaultTitle = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `Pet photo ${day}/${month} ${hours}:${minutes}`;
};

const PetCameraSaveModal = ({
  isOpen,
  photo,
  title,
  target,
  isSaving,
  error,
  onTitleChange,
  onTargetChange,
  onClose,
  onSave
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div className="pet-camera-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="pet-camera-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-camera-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="pet-camera-modal__close"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close pet photo save modal"
        >
          <LuX aria-hidden="true" />
        </button>

        <div className="pet-camera-modal__preview">
          <img src={photo.preview} alt="Captured pet preview" />
        </div>

        <form className="pet-camera-modal__form" onSubmit={onSave}>
          <h2 id="pet-camera-modal-title" className="pet-camera-modal__title">Save Pet Photo</h2>

          <label className="pet-camera-modal__field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Pet photo title"
              disabled={isSaving}
              maxLength={120}
              autoFocus
            />
          </label>

          <div className="pet-camera-modal__targets" role="radiogroup" aria-label="Save destination">
            {PET_CAMERA_SAVE_TARGETS.map(({ key, label, description, Icon }) => {
              const isSelected = target === key;

              return (
                <button
                  key={key}
                  type="button"
                  className={`pet-camera-modal__target ${isSelected ? 'pet-camera-modal__target--selected' : ''}`}
                  onClick={() => onTargetChange(key)}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSaving}
                >
                  <Icon className="pet-camera-modal__target-icon" aria-hidden="true" />
                  <span className="pet-camera-modal__target-copy">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="pet-camera-modal__error" role="alert">{error}</p>
          )}

          <div className="pet-camera-modal__actions">
            <button type="button" className="pet-camera-modal__secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="pet-camera-modal__primary" disabled={isSaving || !title.trim()}>
              <LuCheck aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PetPage = ({ onBack }) => {
  const navigate = useNavigate();
  const { data: characterDataState, loading: characterLoading } = useCharacterData(characterData);
  const petSaveQueueRef = useRef(Promise.resolve());
  const statusSaveQueueRef = useRef(Promise.resolve());
  const petPhotoSaveQueueRef = useRef(Promise.resolve());
  const foodEffectTimeoutsRef = useRef(new Set());
  const careEffectTimeoutsRef = useRef(new Set());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('food');
  const [tabPage, setTabPage] = useState(0);
  const [timePeriod, setTimePeriod] = useState(getTimePeriod());
  const [biologicalClock, setBiologicalClock] = useState({
    lastBreakfast: null,
    lastLunch: null,
    lastDinner: null,
    lastSleep: null,
    isHungry: false,
    isSleepy: false,
    currentMealTime: null
  });
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [moodFloatBatch, setMoodFloatBatch] = useState([]);
  const [moodFloatVisible, setMoodFloatVisible] = useState(false);
  const moodFloatTimerRef = useRef(null);
  const [thoughtBubbleVisible, setThoughtBubbleVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const bubbleTimerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const [activityItems, setActivityItems] = useState([]);
  const [moodItems, setMoodItems] = useState(() => normalizeMoodItems());
  const [currentActivityName, setCurrentActivityName] = useState('');
  const [currentMoodName, setCurrentMoodName] = useState('');
  const [currentLocationName, setCurrentLocationName] = useState('Home');
  const [locationHistory, setLocationHistory] = useState([]);
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
  const isSavingActivity = false;
  const isSavingMood = false;
  const [isUpdateLocationModalOpen, setIsUpdateLocationModalOpen] = useState(false);
  const isSavingLocation = false;
  const [isSleeping, setIsSleeping] = useState(false);
  const [isAwakening, setIsAwakening] = useState(false);
  const [isPetReady, setIsPetReady] = useState(false);
  const sleepTimerRef = useRef(null);
  const entryWaveStartedRef = useRef(false);
  const [petEntryWaveActive, setPetEntryWaveActive] = useState(false);
  const [isCharacterDebugOpen, setIsCharacterDebugOpen] = useState(false);
  const [debugCharacterPresentation, setDebugCharacterPresentation] = useState(null);
  const cameraPoseTimerRef = useRef(null);
  const cameraPickerFallbackTimerRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isCameraPoseActive, setIsCameraPoseActive] = useState(false);
  const [isPetCameraControlVisible, setIsPetCameraControlVisible] = useState(false);
  const [cameraPhase, setCameraPhase] = useState('idle'); // 'idle', 'raising', 'capturing', 'flash', 'lowering'
  const [capturedPetPhoto, setCapturedPetPhoto] = useState(null);
  const [petPhotoTitle, setPetPhotoTitle] = useState('');
  const [petPhotoTarget, setPetPhotoTarget] = useState('gallery');
  const [isPetPhotoModalOpen, setIsPetPhotoModalOpen] = useState(false);
  const [isSavingPetPhoto, setIsSavingPetPhoto] = useState(false);
  const [petPhotoSaveError, setPetPhotoSaveError] = useState('');
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
  const items = useMemo(() => {
    let itemList = activeTab === 'activity'
      ? activityItems
      : activeTab === 'moods'
        ? moodItems
        : PET_ITEM_CATEGORIES.includes(activeTab)
          ? petItems[activeTab]
          : (TAB_ITEMS[activeTab] ?? TAB_ITEMS.food);

    // When sleeping, move Bed item to the top of Care tab
    if (isSleeping && activeTab === 'care' && Array.isArray(itemList)) {
      const bedIndex = itemList.findIndex(item =>
        item.name && item.name.toLowerCase() === 'bed'
      );
      if (bedIndex > 0) {
        const newList = [...itemList];
        const [bedItem] = newList.splice(bedIndex, 1);
        newList.unshift(bedItem);
        return newList;
      }
    }

    // Move current activity to the top
    if (activeTab === 'activity' && currentActivityName && Array.isArray(itemList)) {
      const currentIndex = itemList.findIndex(item =>
        item.name && item.name === currentActivityName
      );
      if (currentIndex > 0) {
        const newList = [...itemList];
        const [currentItem] = newList.splice(currentIndex, 1);
        newList.unshift(currentItem);
        return newList;
      }
    }

    // Move current mood to the top
    if (activeTab === 'moods' && currentMoodName && Array.isArray(itemList)) {
      const currentIndex = itemList.findIndex(item =>
        item.name && item.name === currentMoodName
      );
      if (currentIndex > 0) {
        const newList = [...itemList];
        const [currentItem] = newList.splice(currentIndex, 1);
        newList.unshift(currentItem);
        return newList;
      }
    }

    return itemList;
  }, [activeTab, activityItems, moodItems, petItems, isSleeping, currentActivityName, currentMoodName]);
  const petStatusRows = useMemo(() => createPetStatusRows(petStatus), [petStatus]);
  const petReaction = useMemo(() => {
    const reaction = getPetReaction(petStatus, biologicalClock);
    console.log('🐱 Pet Status:', petStatus);
    console.log('🐱 Biological Clock:', biologicalClock);
    console.log('🐱 Pet Reaction Level:', reaction.level);
    console.log('🐱 Weakest Stat:', reaction.weakest);
    return reaction;
  }, [petStatus, biologicalClock]);
  const hasPetItemFeedback = foodEffects.length > 0 || careEffects.length > 0 || isFoodUseAnimating || isCareUseAnimating;
  const petCharacterPresentation = useMemo(() => getPetCharacterPresentation({
    reactionLevel: petReaction.level,
    biologicalClock,
    isSleeping,
    isAwakening,
    hasItemFeedback: hasPetItemFeedback,
    thoughtBubbleVisible,
    entryWaveActive: petEntryWaveActive
  }), [
    biologicalClock,
    hasPetItemFeedback,
    isAwakening,
    isSleeping,
    petEntryWaveActive,
    petReaction.level,
    thoughtBubbleVisible
  ]);
  const activePetCharacterPresentation = debugCharacterPresentation || petCharacterPresentation;
  const activePetCharacterSpeed = debugCharacterPresentation?.speed
    || PET_CHARACTER_EFFECT_DURATIONS[activePetCharacterPresentation.effect]
    || PET_CHARACTER_EFFECT_DURATIONS.idle;
  const isPetCharacterDebugEnabled = import.meta.env.MODE !== 'production'
    || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const TABS_PER_PAGE = 4;
  const totalPages = Math.ceil(TABS.length / TABS_PER_PAGE);
  const startIndex = tabPage * TABS_PER_PAGE;
  const endIndex = startIndex + TABS_PER_PAGE;
  const visibleTabs = TABS.slice(startIndex, endIndex);
  const hiddenTabSlots = Math.max(0, TABS_PER_PAGE - visibleTabs.length);
  const canGoPrev = tabPage > 0;
  const canGoNext = tabPage < totalPages - 1;

  useEffect(() => {
    const activeTabIndex = TABS.findIndex(tab => tab.key === activeTab);
    if (activeTabIndex !== -1) {
      const activeTabPage = Math.floor(activeTabIndex / TABS_PER_PAGE);
      if (activeTabPage !== tabPage) {
        setTabPage(activeTabPage);
      }
    }
  }, [activeTab, tabPage]);

  const handlePrevPage = () => {
    if (canGoPrev) {
      const nextPage = tabPage - 1;
      setTabPage(nextPage);
      setActiveTab(TABS[nextPage * TABS_PER_PAGE]?.key || TABS[0].key);
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      const nextPage = tabPage + 1;
      setTabPage(nextPage);
      setActiveTab(TABS[nextPage * TABS_PER_PAGE]?.key || TABS[TABS.length - 1].key);
    }
  };

  const petCharacterClassName = [
    'pet-character',
    'pet-character--pet',
    `pet-character--${activePetCharacterPresentation.state}`,
    `pet-character--effect-${activePetCharacterPresentation.effect}`,
    isCameraPoseActive ? 'pet-character--camera-active' : '',
    cameraPhase === 'raising' ? 'pet-character--camera-raising' : '',
    cameraPhase === 'capturing' ? 'pet-character--camera-capturing' : '',
    cameraPhase === 'flash' ? 'pet-character--camera-flash' : '',
    cameraPhase === 'lowering' ? 'pet-character--camera-lowering' : ''
  ].filter(Boolean).join(' ');
  const petCharacterShadowClassName = [
    'pet-character__shadow',
    `pet-character__shadow--effect-${activePetCharacterPresentation.effect}`,
    isCameraPoseActive ? 'pet-character__shadow--camera-active' : ''
  ].filter(Boolean).join(' ');
  const selectedPetUsePreview = useMemo(() => (
    selectedPetUseItem
      ? getPetItemUsePreview(selectedPetUseItem.category, petStatus, selectedPetUseItem.item.shape, selectedPetUseItem.item.name)
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

  // Generate fixed star positions (only once)
  const starPositions = useMemo(() => (
    Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 60,
      delay: Math.random() * 3
    }))
  ), []);

useEffect(() => {
  if (!isPetReady || entryWaveStartedRef.current || isSleeping || isAwakening) return undefined;

  entryWaveStartedRef.current = true;
  const shouldWaveOnEntry = Math.random() < 0.65;
  if (!shouldWaveOnEntry) return undefined;

  setPetEntryWaveActive(true);
  const timeoutId = window.setTimeout(() => {
    setPetEntryWaveActive(false);
  }, 2600);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [isAwakening, isPetReady, isSleeping]);

// Load initial data from NocoDB
useEffect(() => {
  const loadInitialData = async () => {
    try {
      // Fetch pet data (food, care inventory, and status)
      const petData = await fetchPet();
      if (petData) {
        // Update pet items (food and care inventory)
        if (petData.food || petData.care) {
          setPetItems(prev => ({
            food: petData.food && petData.food.length > 0 ? petData.food : prev.food,
            care: petData.care && petData.care.length > 0
              ? petData.care.filter(item => item.name !== 'Cushion' && item.name !== 'Nap Mat') // Filter out old items
              : prev.care
          }));
        }

        // Apply elapsed-time decay before showing pet status.
        if (petData.status) {
          const decayedPet = calculatePetStatusDecay(petData.status, petData.lastStatusTickAt);

          setPetStatus(decayedPet.status);
          setLastStatusTickAt(decayedPet.lastStatusTickAt);

          if (decayedPet.shouldSave) {
            enqueuePetSave({
              status: decayedPet.status,
              lastStatusTickAt: decayedPet.lastStatusTickAt
            });
          }
        }
      }

      // Fetch status data (activities, moods, location)
      const statusData = await fetchStatus();
      if (statusData) {
        // Update activities
        if (statusData.doing && Array.isArray(statusData.doing)) {
          setActivityItems(statusData.doing);
          if (statusData.doing.length > 0) {
            const currentActivity = statusData.doing[0].name || '';
            setCurrentActivityName(currentActivity);

            // Check if current activity is sleep-related
            if (currentActivity.toLowerCase().includes('ngủ')) {
              const now = new Date();
              const hour = now.getHours();

              // If it's sleep time (22:00-5:00), set sleeping state
              if (hour >= 22 || hour < 5) {
                setIsSleeping(true);
              } else if (hour >= 5 && hour < 22) {
                // If it's wake time but activity is still sleep, show awakening
                setIsSleeping(true);
                setIsAwakening(true);
              }
            }
          }
        }

        // Update moods
        if (statusData.mood && Array.isArray(statusData.mood)) {
          setMoodItems(statusData.mood);
          if (statusData.mood.length > 0) {
            setCurrentMoodName(statusData.mood[0].name || '');
          }
        }

        // Update location
        if (statusData.location && Array.isArray(statusData.location)) {
          if (statusData.location.length > 0) {
            setCurrentLocationName(statusData.location[0]);
          }
          setLocationHistory(statusData.location);
        }

        // Update biological clock
        if (statusData.biologicalClock) {
          setBiologicalClock(prev => ({
            ...prev,
            ...statusData.biologicalClock
          }));
        }
      }

      // Mark data as loaded
      setIsDataLoaded(true);

      // Wait a bit for state to settle, then show pet
      setTimeout(() => {
        setIsPetReady(true);
      }, 100);
    } catch (error) {
      console.error('❌ Error loading pet page data:', error);
      // Even on error, mark as loaded to show UI
      setIsDataLoaded(true);
      setIsPetReady(true);
    }
  };

  loadInitialData();
}, []);

// Auto-expand dropdown when data is loaded
useEffect(() => {
  if (isDataLoaded) {
    let expandTimeout;
    // Use requestAnimationFrame to ensure data is rendered before expanding
    const rafId = requestAnimationFrame(() => {
      expandTimeout = setTimeout(() => {
        setInfoExpanded(true);
      }, 50);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (expandTimeout) {
        clearTimeout(expandTimeout);
      }
    };
  }
}, [isDataLoaded]);

// Page Visibility API - detect when user is viewing the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Smart thought bubble with status-based timing
  useEffect(() => {
    // Don't show bubble when sleeping or awakening
    if (isSleeping || isAwakening) {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
      setThoughtBubbleVisible(false);
      return;
    }

    if (!isPageVisible) {
      // Clear any pending timers when page is hidden
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = null;
      }
      setThoughtBubbleVisible(false);
      return;
    }

    let hideTimeoutId;
    const playDurationMs = PET_THOUGHT_BUBBLE_OPTIONS.playDurationSeconds * 1000;

    const scheduleNextBubble = () => {
      // Clear any existing timer
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }

      // Get timing config based on pet status level
      const timing = PET_THOUGHT_BUBBLE_OPTIONS.timing[petReaction.level] || PET_THOUGHT_BUBBLE_OPTIONS.timing.stable;
      
      // Random delay within range
      const delaySeconds = timing.minDelay + Math.random() * (timing.maxDelay - timing.minDelay);
      const delayMs = delaySeconds * 1000;

      // Check if enough time passed since last interaction
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      const cooldownMs = PET_THOUGHT_BUBBLE_OPTIONS.interactionCooldownSeconds * 1000;
      const additionalDelay = Math.max(0, cooldownMs - timeSinceInteraction);

      bubbleTimerRef.current = setTimeout(() => {
        // Random chance to show bubble (not always)
        if (Math.random() < timing.showChance) {
          setThoughtBubbleVisible(true);
          hideTimeoutId = setTimeout(() => {
            setThoughtBubbleVisible(false);
            scheduleNextBubble(); // Schedule next bubble after hiding
          }, playDurationMs);
        } else {
          // Skip this cycle, schedule next
          scheduleNextBubble();
        }
      }, delayMs + additionalDelay);
    };

    // Initial delay before first bubble
    const initialDelayMs = PET_THOUGHT_BUBBLE_OPTIONS.initialDelaySeconds * 1000;
    bubbleTimerRef.current = setTimeout(() => {
      scheduleNextBubble();
    }, initialDelayMs);

    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId);
      }
    };
  }, [isPageVisible, petReaction.level, isSleeping, isAwakening]);

  // Smart mood float with timing (similar to thought bubble)
  useEffect(() => {
    if (!isPageVisible || !currentMoodName) {
      // Clear any pending timers when page is hidden or no mood set
      if (moodFloatTimerRef.current) {
        clearTimeout(moodFloatTimerRef.current);
        moodFloatTimerRef.current = null;
      }
      setMoodFloatVisible(false);
      return;
    }

    let hideTimeoutId;
    const playDurationMs = PET_MOOD_FLOAT_OPTIONS.animationSeconds * 1000;
    const totalBatchDuration = playDurationMs + (PET_MOOD_FLOAT_OPTIONS.itemsPerRun - 1) * PET_MOOD_FLOAT_OPTIONS.itemDelaySeconds * 1000;

    const scheduleNextMoodFloat = () => {
      // Clear any existing timer
      if (moodFloatTimerRef.current) {
        clearTimeout(moodFloatTimerRef.current);
      }

      // Get timing config
      const timing = PET_MOOD_FLOAT_OPTIONS.timing;

      // Random delay within range
      const delaySeconds = timing.minDelay + Math.random() * (timing.maxDelay - timing.minDelay);
      const delayMs = delaySeconds * 1000;

      // Check if enough time passed since last interaction
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      const cooldownMs = PET_MOOD_FLOAT_OPTIONS.interactionCooldownSeconds * 1000;
      const additionalDelay = Math.max(0, cooldownMs - timeSinceInteraction);

      moodFloatTimerRef.current = setTimeout(() => {
        // Random chance to show mood float (not always)
        if (Math.random() < timing.showChance) {
          // Create new batch
          setMoodFloatBatch(createMoodFloatBatch());
          setMoodFloatVisible(true);

          hideTimeoutId = setTimeout(() => {
            setMoodFloatVisible(false);
            scheduleNextMoodFloat(); // Schedule next mood float after hiding
          }, totalBatchDuration);
        } else {
          // Skip this cycle, schedule next
          scheduleNextMoodFloat();
        }
      }, delayMs + additionalDelay);
    };

    // Initial delay before first mood float
    const initialDelayMs = PET_MOOD_FLOAT_OPTIONS.initialDelaySeconds * 1000;
    moodFloatTimerRef.current = setTimeout(() => {
      scheduleNextMoodFloat();
    }, initialDelayMs);

    return () => {
      if (moodFloatTimerRef.current) {
        clearTimeout(moodFloatTimerRef.current);
      }
      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId);
      }
    };
  }, [isPageVisible, currentMoodName]);

  // Biological clock monitoring
  useEffect(() => {
    const checkBiologicalClock = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Check meal times
      const mealTime = getMealTime(hour, minute);
      if (mealTime) {
        const mealKey = `last${mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}`;
        setBiologicalClock(prev => {
          const wasEaten = wasMealEatenToday(prev[mealKey]);
          if (!wasEaten) {
            return {
              ...prev,
              isHungry: true,
              currentMealTime: mealTime
            };
          }
          return prev;
        });
      }

      // Check bedtime
      if (isBedtime(hour)) {
        setBiologicalClock(prev => {
          const sleptTonight = wasMealEatenToday(prev.lastSleep);
          if (!sleptTonight) {
            return {
              ...prev,
              isSleepy: true
            };
          }
          return prev;
        });
      } else {
        // Reset sleepy state in the morning
        if (hour >= 5) {
          setBiologicalClock(prev => {
            if (prev.isSleepy) {
              return {
                ...prev,
                isSleepy: false
              };
            }
            return prev;
          });
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkBiologicalClock, 60000);
    checkBiologicalClock(); // Initial check

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array - only runs once on mount

  // Status penalty system for biological clock
  useEffect(() => {
    let penaltyIntervalId;

    if (biologicalClock.isHungry || biologicalClock.isSleepy) {
      penaltyIntervalId = setInterval(() => {
        setPetStatus(prev => {
          const updates = {};

          // Hunger penalty
          if (biologicalClock.isHungry) {
            updates.hunger = Math.max(0, prev.hunger - 1);
          }

          // Sanity penalty
          if (biologicalClock.isSleepy) {
            updates.sanity = Math.max(0, prev.sanity - 1);
          }

          // Save to NocoDB
          if (Object.keys(updates).length > 0) {
            enqueuePetSave({ status: updates });
          }

          return { ...prev, ...updates };
        });
      }, 300000); // Every 5 minutes
    }

    return () => {
      if (penaltyIntervalId) {
        clearInterval(penaltyIntervalId);
      }
    };
  }, [biologicalClock.isHungry, biologicalClock.isSleepy]);

  // Update time period every minute
  useEffect(() => {
    const updateTimePeriod = () => {
      setTimePeriod(getTimePeriod());
    };

    // Update every minute
    const intervalId = setInterval(updateTimePeriod, 60000);

    return () => clearInterval(intervalId);
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
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    if (cameraPoseTimerRef.current) {
      window.clearTimeout(cameraPoseTimerRef.current);
    }
    if (cameraPickerFallbackTimerRef.current) {
      window.clearTimeout(cameraPickerFallbackTimerRef.current);
    }
  }, []);

  useEffect(() => () => {
    if (capturedPetPhoto?.preview) {
      URL.revokeObjectURL(capturedPetPhoto.preview);
    }
  }, [capturedPetPhoto]);

  // Auto wake up at 5 AM - show awakening effect
  useEffect(() => {
    if (!isSleeping) return;

    const checkWakeTime = () => {
      const now = new Date();
      const hour = now.getHours();

      // Show awakening effect at 5 AM
      if (hour >= 5 && hour < 22) {
        console.log('☀️ Morning! Time to wake up at', hour, ':00');
        setIsAwakening(true);
        // Don't auto-wake, wait for user tap
      }
    };

    // Check immediately
    checkWakeTime();

    // Check every minute
    const intervalId = setInterval(checkWakeTime, 60000);

    return () => clearInterval(intervalId);
  }, [isSleeping]);

  // Auto sleep when activity is "Đi ngủ"
  useEffect(() => {
    if (currentActivityName && currentActivityName.toLowerCase().includes('ngủ')) {
      if (!isSleeping && !isAwakening) {
        console.log('💤 Activity is sleep-related, auto sleeping');
        setIsSleeping(true);
      }
    } else {
      // If activity changed to non-sleep and was awakening, complete wake up
      if (isAwakening) {
        console.log('✨ Activity changed, completing wake up');
        setIsSleeping(false);
        setIsAwakening(false);
      }
    }
  }, [currentActivityName, isSleeping, isAwakening]);

  const handleBack = () => {
    console.log('🔙 Back button clicked');
    if (onBack) {
      console.log('🔙 Using onBack callback');
      onBack();
      return;
    }
    try {
      console.log('🔙 Navigating to /');
      navigate('/');
    } catch (err) {
      console.error('🔙 Navigate failed, using window.location:', err);
      window.location.replace('/');
    }
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

    const preview = getPetItemUsePreview(category, petStatus, item.shape, item.name);
    if (!preview.canUse) return;

    setSelectedPetUseItem({ item, category });
  };

    const handleConfirmUsePetItem = () => {
    lastInteractionRef.current = Date.now(); // Track interaction for bubble timing
    if (!selectedPetUseItem || !selectedPetUsePreview?.canUse) return;
    if (selectedPetUseItem.category === 'food' && isFoodUseAnimating) return;
    if (selectedPetUseItem.category === 'care' && isCareUseAnimating) return;

    console.log('✅ Confirming use of:', selectedPetUseItem.item.name, 'shape:', selectedPetUseItem.item.shape);

    const nextStatus = selectedPetUsePreview.nextStatus;
    const nextTickAt = new Date().toISOString();
    const usedPetItem = selectedPetUseItem;

    setPetStatus(nextStatus);
    setLastStatusTickAt(nextTickAt);
    setSelectedPetUseItem(null);

    // Check if feeding during meal time
    if (usedPetItem.category === 'food' && biologicalClock.isHungry && biologicalClock.currentMealTime) {
      const mealKey = `last${biologicalClock.currentMealTime.charAt(0).toUpperCase() + biologicalClock.currentMealTime.slice(1)}`;

      const updatedBiologicalClock = {
        ...biologicalClock,
        [mealKey]: Date.now(),
        isHungry: false,
        currentMealTime: null
      };

      setBiologicalClock(updatedBiologicalClock);

      // Save to NocoDB
      saveStatus({
        biologicalClock: updatedBiologicalClock
      }).catch(err => console.error('Failed to save biological clock:', err));
    }

    // Check if resting during bedtime (using mat or bed items)
    const isBedItem = usedPetItem.item.shape === 'bed' || usedPetItem.item.shape === 'mat' ||
                      (usedPetItem.item.name && usedPetItem.item.name.toLowerCase() === 'bed');
    console.log('🔍 Used item:', usedPetItem.item.name, 'shape:', usedPetItem.item.shape);
    console.log('🛏️ Is bed item?', isBedItem);

    if (usedPetItem.category === 'care' && isBedItem) {
      console.log('🛏️ Starting sleep - will wake at 5 AM');
      // Start sleeping animation (will wake at 5 AM automatically)
      setIsSleeping(true);

      // Auto-set activity to "Đi ngủ" if exists
      const sleepActivity = activityItems.find(item =>
        item.name && item.name.toLowerCase().includes('ngủ')
      );
      if (sleepActivity) {
        console.log('💤 Setting activity to:', sleepActivity.name);
        const oldActivityName = currentActivityName;
        setCurrentActivityName(sleepActivity.name);
        enqueueStatusSave({
          doing: {
            name: sleepActivity.name,
            icon: sleepActivity.icon
          }
        }, {
          label: 'sleep activity',
          changes: [
            { fieldType: 'doing', oldValue: oldActivityName, newValue: sleepActivity.name }
          ]
        });
      }

      if (biologicalClock.isSleepy) {
        const updatedBiologicalClock = {
          ...biologicalClock,
          lastSleep: Date.now(),
          isSleepy: false
        };

        setBiologicalClock(updatedBiologicalClock);

        // Save to NocoDB
        saveStatus({
          biologicalClock: updatedBiologicalClock
        }).catch(err => console.error('Failed to save biological clock:', err));
      }
    }

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

  const refreshStatusConsumers = () => {
    try { clearNocoDBCache(); } catch { }
    try { window.dispatchEvent(new Event('meo:refresh')); } catch { }
  };

  const savePetStatusChangesJournal = async (changes) => {
    const changedFields = changes.filter(({ oldValue, newValue }) => {
      const oldText = String(oldValue || '').trim();
      const newText = String(newValue || '').trim();
      return oldText !== newText;
    });

    if (changedFields.length === 0) {
      return;
    }

    try {
      await saveStatusChangesJournal(changedFields, CHARACTER_ID);
    } catch (error) {
      console.warn('⚠️ Failed to save pet status changes journal:', error);
    }
  };

  const enqueueStatusSave = (statusData, options = {}) => {
    const { changes = [], label = 'status' } = options;

    statusSaveQueueRef.current = statusSaveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const result = await saveStatus(statusData);
        if (!result.success) {
          console.warn(`⚠️ Background ${label} sync failed:`, result.message);
          return;
        }

        await savePetStatusChangesJournal(changes);
        refreshStatusConsumers();
      })
      .catch((error) => {
        console.warn(`⚠️ Background ${label} sync failed:`, error);
      });
  };

  const handleChooseActivityConfirm = (activity) => {
    lastInteractionRef.current = Date.now(); // Track interaction for bubble timing
    const oldActivityName = currentActivityName;

    setCurrentActivityName(activity.name);
    setActivityItems(prev => {
      const filtered = prev.filter(item => item.name !== activity.name);
      return [activity, ...filtered];
    });
    setIsChooseActivityModalOpen(false);

    enqueueStatusSave({
      doing: {
        name: activity.name,
        icon: activity.icon
      }
    }, {
      label: 'activity',
      changes: [
        { fieldType: 'doing', oldValue: oldActivityName, newValue: activity.name }
      ]
    });
  };

  const handleChooseActivityUpdate = (activity) => {
    // Close choose modal and open update icon modal
    setIsChooseActivityModalOpen(false);
    setActivityToUpdate(activity);
    setIsUpdateIconModalOpen(true);
  };

  const handleUpdateIcon = (updatedActivity) => {
    setActivityItems(prev => {
      const filtered = prev.filter(item => item.name !== updatedActivity.name);
      return [updatedActivity, ...filtered];
    });
    setIsUpdateIconModalOpen(false);
    setActivityToUpdate(null);

    enqueueStatusSave({
      doing: {
        name: updatedActivity.name,
        icon: updatedActivity.icon
      }
    }, {
      label: 'activity icon'
    });
  };

  const handleAddActivity = (newActivity, setAsCurrent) => {
    const oldActivityName = currentActivityName;
    const existingActivity = activityItems.find(
      item => item.name.toLowerCase() === newActivity.name.toLowerCase()
    );
    const normalizedActivity = {
      name: newActivity.name,
      icon: newActivity.icon,
      shape: getActivityShape(newActivity.name)
    };

    if (existingActivity) {
      setActivityItems(prev => {
        const filtered = prev.filter(
          item => item.name.toLowerCase() !== newActivity.name.toLowerCase()
        );
        return [normalizedActivity, ...filtered];
      });
    } else {
      setActivityItems(prev => [normalizedActivity, ...prev]);
    }

    if (setAsCurrent) {
      setCurrentActivityName(newActivity.name);
    }

    setIsAddActivityModalOpen(false);

    enqueueStatusSave({
      doing: {
        name: newActivity.name,
        icon: newActivity.icon
      }
    }, {
      label: 'activity',
      changes: setAsCurrent
        ? [{ fieldType: 'doing', oldValue: oldActivityName, newValue: newActivity.name }]
        : []
    });
  };

  const handleChooseMoodConfirm = (mood) => {
    lastInteractionRef.current = Date.now(); // Track interaction for bubble timing
    const oldMoodName = currentMoodName;

    setCurrentMoodName(mood.name);
    setMoodItems(prev => {
      const filtered = prev.filter(item => item.name !== mood.name);
      return [mood, ...filtered];
    });
    setIsChooseMoodModalOpen(false);

    enqueueStatusSave({
      mood: {
        name: mood.name,
        icon: mood.icon
      }
    }, {
      label: 'mood',
      changes: [
        { fieldType: 'mood', oldValue: oldMoodName, newValue: mood.name }
      ]
    });
  };

  const handleChooseMoodUpdate = (mood) => {
    setIsChooseMoodModalOpen(false);
    setMoodToUpdate(mood);
    setIsUpdateMoodIconModalOpen(true);
  };

  const handleUpdateMoodIcon = (updatedMood) => {
    setMoodItems(prev => {
      const filtered = prev.filter(item => item.name !== updatedMood.name);
      return [{ ...updatedMood, shape: getMoodShape(updatedMood.name) }, ...filtered];
    });
    setIsUpdateMoodIconModalOpen(false);
    setMoodToUpdate(null);

    enqueueStatusSave({
      mood: {
        name: updatedMood.name,
        icon: updatedMood.icon
      }
    }, {
      label: 'mood icon'
    });
  };

  const handleAddMood = (newMood, setAsCurrent) => {
    const moodName = String(newMood?.name || '').trim();
    if (!moodName) return;

    const oldMoodName = currentMoodName;
    const existingMood = moodItems.find(
      item => item.name.toLowerCase() === moodName.toLowerCase()
    );
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

    enqueueStatusSave({
      mood: {
        name: moodName,
        icon: newMood.icon || ''
      }
    }, {
      label: 'mood',
      changes: setAsCurrent
        ? [{ fieldType: 'mood', oldValue: oldMoodName, newValue: moodName }]
        : []
    });
  };

  const handleMoodCardClick = (mood) => {
    setSelectedMood(mood);
    setIsConfirmMoodModalOpen(true);
  };

  const handleConfirmSetCurrentMood = (newIcon, updateIconOnly = false) => {
    if (!selectedMood) return;

    const iconToSave = newIcon !== undefined ? newIcon : selectedMood.icon;
    const oldMoodName = currentMoodName;
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

    enqueueStatusSave({
      mood: {
        name: selectedMood.name,
        icon: iconToSave
      }
    }, {
      label: 'mood',
      changes: !updateIconOnly
        ? [{ fieldType: 'mood', oldValue: oldMoodName, newValue: selectedMood.name }]
        : []
    });
  };

  const handleActivityCardClick = (activity) => {
    setSelectedActivity(activity);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSetCurrent = (newIcon, updateIconOnly = false) => {
    if (!selectedActivity) return;

    const iconToSave = newIcon !== undefined ? newIcon : selectedActivity.icon;
    const oldActivityName = currentActivityName;
    const updatedActivity = {
      ...selectedActivity,
      icon: iconToSave
    };

    if (!updateIconOnly) {
      setCurrentActivityName(selectedActivity.name);
    }

    setActivityItems(prev => {
      const filtered = prev.filter(item => item.name !== selectedActivity.name);
      return [updatedActivity, ...filtered];
    });

    setIsConfirmModalOpen(false);
    setSelectedActivity(null);

    enqueueStatusSave({
      doing: {
        name: selectedActivity.name,
        icon: iconToSave
      }
    }, {
      label: 'activity',
      changes: !updateIconOnly
        ? [{ fieldType: 'doing', oldValue: oldActivityName, newValue: selectedActivity.name }]
        : []
    });
  };

  const handleUpdateLocation = (newLocation) => {
    const oldLocationName = currentLocationName;

    setCurrentLocationName(newLocation);
    setLocationHistory(prev => {
      const filtered = prev.filter(loc => loc.toLowerCase() !== newLocation.toLowerCase());
      return [newLocation, ...filtered];
    });
    setIsUpdateLocationModalOpen(false);

    enqueueStatusSave({
      location: newLocation
    }, {
      label: 'location',
      changes: [
        { fieldType: 'location', oldValue: oldLocationName, newValue: newLocation }
      ]
    });
  };

  const handleWakeUpTap = () => {
    if (!isAwakening) return;

    console.log('👆 User tapped to wake up pet');
    setIsSleeping(false);
    setIsAwakening(false);

    // Clear sleep activity if exists
    const sleepActivity = activityItems.find(item =>
      item.name && item.name.toLowerCase().includes('ngủ')
    );
    if (sleepActivity && currentActivityName === sleepActivity.name) {
      // Find first non-sleep activity or clear current activity
      const nonSleepActivity = activityItems.find(item =>
        item.name && !item.name.toLowerCase().includes('ngủ')
      );
      if (nonSleepActivity) {
        const oldActivityName = currentActivityName;
        setCurrentActivityName(nonSleepActivity.name);
        enqueueStatusSave({
          doing: {
            name: nonSleepActivity.name,
            icon: nonSleepActivity.icon
          }
        }, {
          label: 'wake activity',
          changes: [
            { fieldType: 'doing', oldValue: oldActivityName, newValue: nonSleepActivity.name }
          ]
        });
      }
    }
  };

  const resetCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const lowerPetCameraPose = () => {
    setIsPetCameraControlVisible(false);

    if (cameraPoseTimerRef.current) {
      window.clearTimeout(cameraPoseTimerRef.current);
      cameraPoseTimerRef.current = null;
    }
    if (cameraPickerFallbackTimerRef.current) {
      window.clearTimeout(cameraPickerFallbackTimerRef.current);
      cameraPickerFallbackTimerRef.current = null;
    }

    if (!isCameraPoseActive && cameraPhase === 'idle') {
      resetCameraInput();
      return;
    }

    setCameraPhase('lowering');
    setIsCameraPoseActive(true);

    cameraPoseTimerRef.current = window.setTimeout(() => {
      setCameraPhase('idle');
      setIsCameraPoseActive(false);
      cameraPoseTimerRef.current = null;
      resetCameraInput();
    }, PET_CAMERA_LOWER_DURATION_MS);
  };

  const handleClosePetPhotoModal = () => {
    if (isSavingPetPhoto) return;

    setIsPetPhotoModalOpen(false);
    setCapturedPetPhoto(null);
    setPetPhotoTitle('');
    setPetPhotoTarget('gallery');
    setPetPhotoSaveError('');
    lowerPetCameraPose();
  };

  const dispatchPetPhotoOptimisticEvent = (eventName, detail) => {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch { }
  };

  const enqueuePetPhotoSave = ({ target, title, file, optimisticId }) => {
    petPhotoSaveQueueRef.current = petPhotoSaveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const result = target === 'album'
          ? await savePhotoAlbum({
            description: title,
            imageFiles: [file]
          })
          : await uploadProfileGalleryImages(null, [file], title, title);

        if (!result.success) {
          throw new Error(result.message || 'Could not save this pet photo.');
        }

        try { clearNocoDBCache(); } catch { }
        dispatchPetPhotoOptimisticEvent('pet-photo:optimistic-complete', { target, optimisticId });
        try {
          window.dispatchEvent(new CustomEvent(target === 'album' ? 'photoalbum:refresh' : 'gallery:refresh', {
            detail: { optimisticId }
          }));
        } catch { }
      })
      .catch((error) => {
        console.error('❌ Background pet camera photo save failed:', error);
        dispatchPetPhotoOptimisticEvent('pet-photo:optimistic-failed', { target, optimisticId });
        window.alert?.('Could not save this pet photo. Please try again.');
      });
  };

  const handleSavePetPhoto = async (event) => {
    event.preventDefault();

    if (!capturedPetPhoto?.file || isSavingPetPhoto) return;

    const title = petPhotoTitle.trim();
    if (!title) {
      setPetPhotoSaveError('Please enter a title before saving.');
      return;
    }

    const savePayload = {
      target: petPhotoTarget,
      title,
      file: capturedPetPhoto.file,
      optimisticId: `pet-photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      optimisticPreviewUrl: URL.createObjectURL(capturedPetPhoto.file),
      createdAt: new Date().toISOString()
    };

    setPetPhotoSaveError('');
    setIsPetPhotoModalOpen(false);
    setCapturedPetPhoto(null);
    setPetPhotoTitle('');
    setPetPhotoTarget('gallery');
    setActiveTab(savePayload.target === 'album' ? 'album' : 'gallery');
    lowerPetCameraPose();

    window.setTimeout(() => {
      dispatchPetPhotoOptimisticEvent('pet-photo:optimistic', savePayload);
    }, 0);
    enqueuePetPhotoSave(savePayload);
  };

  const isPetCameraBaseDisabled = isSleeping || isAwakening || isPetPhotoModalOpen || isSavingPetPhoto;
  const isPetCameraReady = cameraPhase === 'capturing';
  const isPetCameraBusy = cameraPhase !== 'idle';
  const isPetCameraControlDisabled = !isPetCameraControlVisible || isPetCameraBaseDisabled || (isPetCameraBusy && !isPetCameraReady);
  const isPetCameraInputDisabled = !isPetCameraControlVisible || isPetCameraBaseDisabled || !isPetCameraReady;

  const handlePetCharacterCameraToggle = () => {
    lastInteractionRef.current = Date.now();

    if (cameraPhase === 'flash' || isPetPhotoModalOpen || isSavingPetPhoto) return;

    if (isPetCameraControlVisible || isCameraPoseActive || cameraPhase !== 'idle') {
      lowerPetCameraPose();
      return;
    }

    if (isSleeping || isAwakening) return;

    setIsPetCameraControlVisible(true);
  };

  const handlePetCharacterCameraKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handlePetCharacterCameraToggle();
  };

  const handleCameraPose = (event) => {
    if (event?.target === cameraInputRef.current) return;

    if (!isPetCameraControlVisible || isPetCameraBaseDisabled || isPetCameraBusy) {
      event?.preventDefault();
      return;
    }

    if (cameraPoseTimerRef.current) {
      window.clearTimeout(cameraPoseTimerRef.current);
      cameraPoseTimerRef.current = null;
    }

    resetCameraInput();
    setIsPetCameraControlVisible(true);
    setCameraPhase('raising');
    setIsCameraPoseActive(true);

    cameraPoseTimerRef.current = window.setTimeout(() => {
      setCameraPhase('capturing');
    }, PET_CAMERA_RAISE_DURATION_MS);

    cameraPickerFallbackTimerRef.current = window.setTimeout(() => {
      if (!cameraInputRef.current?.files?.length) {
        setCameraPhase('idle');
        setIsCameraPoseActive(false);
        setIsPetCameraControlVisible(false);
        cameraPickerFallbackTimerRef.current = null;
      }
    }, PET_CAMERA_RAISE_DURATION_MS + PET_CAMERA_READY_TIMEOUT_MS);
  };

  const handleCameraKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();

    if (isPetCameraReady && cameraInputRef.current) {
      cameraInputRef.current.click();
      return;
    }

    handleCameraPose(event);
  };

  const handleCameraCapture = (event) => {
    if (cameraPickerFallbackTimerRef.current) {
      window.clearTimeout(cameraPickerFallbackTimerRef.current);
      cameraPickerFallbackTimerRef.current = null;
    }

    const file = event.target.files?.[0];
    if (!file) {
      lowerPetCameraPose();
      return;
    }

    // Phase 3: Flash effect immediately
    setCameraPhase('flash');

    // Let flash finish, then keep the camera raised while the save modal is open.
    cameraPoseTimerRef.current = window.setTimeout(() => {
      setCameraPhase('capturing');
      cameraPoseTimerRef.current = null;
      resetCameraInput();
      setCapturedPetPhoto({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file)
      });
      setPetPhotoTitle(createPetCameraDefaultTitle());
      setPetPhotoTarget('gallery');
      setPetPhotoSaveError('');
      setIsPetPhotoModalOpen(true);
      console.log('📸 Photo captured:', file.name);
    }, PET_CAMERA_FLASH_DURATION_MS + PET_CAMERA_POST_FLASH_HOLD_MS);
  };

  return (
    <main className="pet-page">
      {!isPetReady ? (
        <LoadingDialog />
      ) : (
        <>
        <section className="pet-phone" aria-label="Virtual pet preview">
        <div className="pet-topbar">
          <button type="button" className="pet-round-button" onClick={handleBack} aria-label="Back">
            <LuChevronLeft className="pet-topbar-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pet-nameplate"
            onClick={() => setIsUpdateLocationModalOpen(true)}
            aria-label={`Méo, current location ${currentLocationName}. Click to change location`}
          >
            <span className="pet-nameplate__flip" aria-hidden="true">
              <span className="pet-nameplate__face pet-nameplate__face--front">Méo</span>
              <span className="pet-nameplate__face pet-nameplate__face--back">{currentLocationName}</span>
            </span>
        </button>
          <PetInfoDropdown 
            expanded={infoExpanded} 
            onToggle={() => setInfoExpanded(v => !v)} 
            rows={petStatusRows} 
            isDataLoaded={isDataLoaded}
          />
        </div>

        <div className={`pet-stage pet-stage--${petReaction.level} pet-stage--${timePeriod}`}>
          {/* Sun */}
          <div className="stage-sun" aria-hidden="true"></div>

          {/* Moon with craters */}
          <div className="stage-moon" aria-hidden="true">
            <div className="stage-moon-craters">
              <div className="stage-moon-crater stage-moon-crater--1"></div>
              <div className="stage-moon-crater stage-moon-crater--2"></div>
              <div className="stage-moon-crater stage-moon-crater--3"></div>
              <div className="stage-moon-crater stage-moon-crater--4"></div>
            </div>
          </div>

          {/* Stars */}
          <div className="stage-stars" aria-hidden="true">
            {starPositions.map((star, i) => (
              <div
                key={i}
                className="stage-star"
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  animationDelay: `${star.delay}s`
                }}
              />
            ))}
          </div>

          {/* Ground line */}
          <div className="stage-ground" aria-hidden="true"></div>
          <span
            className={`pet-stage-camera-flash-screen ${cameraPhase === 'flash' ? 'pet-stage-camera-flash-screen--active' : ''}`}
            aria-hidden="true"
          />

          {isPetCharacterDebugEnabled && (
            <div className={`pet-character-debug ${isCharacterDebugOpen ? 'pet-character-debug--open' : ''}`}>
              <button
                type="button"
                className="pet-character-debug__toggle"
                onClick={() => setIsCharacterDebugOpen(value => !value)}
                aria-expanded={isCharacterDebugOpen}
                aria-controls="pet-character-debug-panel"
              >
                Debug
              </button>
              {isCharacterDebugOpen && (
                <div id="pet-character-debug-panel" className="pet-character-debug__panel">
                  <div className="pet-character-debug__current">
                    <span>State: {activePetCharacterPresentation.state}</span>
                    <span>Effect: {activePetCharacterPresentation.effect}</span>
                    <span>Speed: {activePetCharacterSpeed}</span>
                  </div>
                  <button
                    type="button"
                    className={`pet-character-debug__option ${!debugCharacterPresentation ? 'pet-character-debug__option--active' : ''}`}
                    onClick={() => setDebugCharacterPresentation(null)}
                  >
                    <span>Live priority</span>
                    <small>{petCharacterPresentation.state} + {petCharacterPresentation.effect}</small>
                  </button>
                  {PET_CHARACTER_DEBUG_PRESETS.map((preset) => {
                    const isActive = debugCharacterPresentation?.label === preset.label;

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        className={`pet-character-debug__option ${isActive ? 'pet-character-debug__option--active' : ''}`}
                        onClick={() => setDebugCharacterPresentation(preset)}
                      >
                        <span>{preset.label}</span>
                        <small>{preset.state} + {preset.effect} - {preset.speed}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Awakening overlay - tap to wake */}
          {isAwakening && (
            <div
              className="pet-awakening-overlay"
              onClick={handleWakeUpTap}
              role="button"
              tabIndex={0}
              aria-label="Tap to wake up pet"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleWakeUpTap();
                }
              }}
            >
              <div className="pet-awakening-prompt">
                <div className="pet-awakening-zzz" aria-hidden="true">
                  <span className="pet-awakening-z pet-awakening-z--1">Z</span>
                  <span className="pet-awakening-z pet-awakening-z--2">Z</span>
                  <span className="pet-awakening-z pet-awakening-z--3">Z</span>
                </div>
                <p className="pet-awakening-text">Tap để đánh thức Méo dậy!</p>
              </div>
            </div>
          )}

          <div className={`pet-bubble pet-bubble--${petReaction.level} ${thoughtBubbleVisible ? 'pet-bubble--visible' : ''}`} aria-hidden={!thoughtBubbleVisible}>
            <p>{petReaction.message}</p>
          </div>

          <div className="pet-stage-indicators" aria-label="Pet context">
            {moodFloatVisible && moodFloatBatch.map((moodFloatItem, index) => (
              <div key={moodFloatItem.id} className="pet-mood-float pet-mood-float--visible" style={moodFloatStyles[index]} aria-label={`Current mood ${currentMoodItem?.name || PET_CURRENT_MOOD.label}`}>
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

          <span className={petCharacterShadowClassName} aria-hidden="true" />

          <div
            className={petCharacterClassName}
            role="button"
            tabIndex={isSleeping || isAwakening || isPetPhotoModalOpen ? -1 : 0}
            aria-label={isPetCameraControlVisible || isCameraPoseActive ? 'Hide pet camera control' : 'Show pet camera control'}
            aria-pressed={isPetCameraControlVisible || isCameraPoseActive}
            onClick={handlePetCharacterCameraToggle}
            onKeyDown={handlePetCharacterCameraKeyDown}
          >
            <span className="pet-character__head">
              <span className="pet-character__eye pet-character__eye--left" />
              <span className="pet-character__eye pet-character__eye--right" />
              <span className="pet-character__mouth" />
            </span>
            <span className="pet-character__neck" />
            <span className="pet-character__body" />
            <span className="pet-character__arm pet-character__arm--left" />
            <span className="pet-character__arm pet-character__arm--right" />
            <span className="pet-character__leg pet-character__leg--left" />
            <span className="pet-character__leg pet-character__leg--right" />
            <span className="pet-character__camera" aria-hidden="true">
              <span className="pet-character__camera-hold-arm pet-character__camera-hold-arm--left" />
              <span className="pet-character__camera-hold-arm pet-character__camera-hold-arm--right" />
              <span className="pet-character__camera-grip pet-character__camera-grip--left" />
              <span className="pet-character__camera-grip pet-character__camera-grip--right" />
              <span className="pet-character__camera-lens" />
              <span className="pet-character__camera-flash" />
            </span>

            {/* ZZZ particles when sleeping (hide when awakening overlay is shown) */}
            {isSleeping && !isAwakening && (
              <div className="pet-sleep-zzz" aria-hidden="true">
                <span className="pet-sleep-z pet-sleep-z--1">Z</span>
                <span className="pet-sleep-z pet-sleep-z--2">Z</span>
                <span className="pet-sleep-z pet-sleep-z--3">Z</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`pet-camera-action-overlay ${isPetCameraControlVisible ? 'pet-camera-action-overlay--visible' : ''}`}
          aria-hidden={!isPetCameraControlVisible}
        >
          <div className="pet-camera-action-overlay__backdrop" aria-hidden="true" />
          <div className="pet-camera-action-overlay__controls">
            <label
              className={`pet-stage-camera-button ${isPetCameraControlVisible ? 'pet-stage-camera-button--visible' : ''} ${isCameraPoseActive ? 'pet-stage-camera-button--active' : ''} ${isPetCameraReady ? 'pet-stage-camera-button--ready' : ''} ${isPetCameraControlDisabled ? 'pet-stage-camera-button--disabled' : ''}`}
              onClick={handleCameraPose}
              onKeyDown={handleCameraKeyDown}
              aria-label={isPetCameraReady ? 'Open camera to take a pet photo' : 'Raise pet camera'}
              aria-disabled={isPetCameraControlDisabled}
              aria-hidden={!isPetCameraControlVisible}
              aria-pressed={isCameraPoseActive}
              role="button"
              tabIndex={isPetCameraControlDisabled ? -1 : 0}
            >
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                disabled={isPetCameraInputDisabled}
                className="pet-stage-camera-button__input"
                aria-hidden="true"
                tabIndex={-1}
              />
              <LuCamera className="pet-stage-camera-button__icon" aria-hidden="true" />
            </label>
            <button
              type="button"
              className="pet-stage-camera-cancel-button"
              onClick={lowerPetCameraPose}
              aria-label="Close camera controls"
              tabIndex={isPetCameraControlVisible ? 0 : -1}
            >
              <LuX aria-hidden="true" />
            </button>
          </div>
        </div>

        <section className="pet-bottom-sheet" aria-label="Pet item inventory preview">
          <nav className="pet-tabs" aria-label="Pet inventory categories">
            <button
              type="button"
              className="pet-tab-nav pet-tab-nav--prev"
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              aria-label="Previous tabs"
            >
              <LuChevronLeft className="pet-tab-nav-icon" aria-hidden="true" />
            </button>
            {visibleTabs.map(({ key, label, Icon }) => (
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
            {Array.from({ length: hiddenTabSlots }).map((_, index) => (
              <span
                key={`pet-tab-placeholder-${index}`}
                className="pet-tab-placeholder"
                aria-hidden="true"
              />
            ))}
            <button
              type="button"
              className="pet-tab-nav pet-tab-nav--next"
              onClick={handleNextPage}
              disabled={!canGoNext}
              aria-label="Next tabs"
            >
              <LuChevronLeft className="pet-tab-nav-icon pet-tab-nav-icon--next" aria-hidden="true" />
            </button>
          </nav>

          <div className="pet-sheet-scroll">
            {activeTab === 'status' ? (
              <PetStatusPanel
                rows={petStatusRows}
              />
            ) : activeTab === 'album' ? (
              <div className="pet-media-panel pet-media-panel--album">
                <LanguageProvider initialLang="VI">
                  <PhotoAlbumTab isActive={activeTab === 'album'} />
                </LanguageProvider>
              </div>
            ) : activeTab === 'gallery' ? (
              <div className="pet-media-panel pet-media-panel--gallery">
                <LanguageProvider initialLang="VI">
                  <GalleryTab isActive={activeTab === 'gallery'} />
                </LanguageProvider>
              </div>
            ) : activeTab === 'journal' ? (
              <div className="pet-media-panel pet-media-panel--journal">
                <CharacterProvider data={characterDataState}>
                  <LanguageProvider initialLang="VI">
                    <JournalTab isActive={activeTab === 'journal'} />
                  </LanguageProvider>
                </CharacterProvider>
              </div>
            ) : activeTab === 'history' ? (
              <div className="pet-media-panel pet-media-panel--history">
                <CharacterProvider data={characterDataState}>
                  <LanguageProvider initialLang="VI">
                    <HistoryTab isActive={activeTab === 'history'} />
                  </LanguageProvider>
                </CharacterProvider>
              </div>
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
                  console.log('🔍 Item:', item.name, 'shape:', item.shape);
                  const petUsePreview = PET_ITEM_CATEGORIES.includes(activeTab)
                    ? getPetItemUsePreview(activeTab, petStatus, item.shape, item.name)
                    : null;
                  console.log('📊 Preview for', item.name, ':', petUsePreview);
                  const isFoodLocked = activeTab === 'food' && (isFoodUseAnimating || isSleeping);
                  const isCareLocked = activeTab === 'care' && (isCareUseAnimating || isSleeping);
                  const isPetItemDisabled = Boolean(petUsePreview && (!petUsePreview.canUse || isSavingPet || isFoodLocked || isCareLocked));
                  const disabledReason = isSleeping
                    ? 'Pet đang ngủ, đợi sáng mai nhé! 💤'
                    : isFoodLocked
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

      <PetCameraSaveModal
        isOpen={isPetPhotoModalOpen}
        photo={capturedPetPhoto}
        title={petPhotoTitle}
        target={petPhotoTarget}
        isSaving={isSavingPetPhoto}
        error={petPhotoSaveError}
        onTitleChange={setPetPhotoTitle}
        onTargetChange={setPetPhotoTarget}
        onClose={handleClosePetPhotoModal}
        onSave={handleSavePetPhoto}
      />

      <UpdateLocationModal
        isOpen={isUpdateLocationModalOpen}
        onClose={() => setIsUpdateLocationModalOpen(false)}
        onSave={handleUpdateLocation}
        currentLocation={currentLocationName}
        locationHistory={locationHistory}
        isLoading={isSavingLocation}
      />
        </>
      )}
    </main>
  );
};

export default PetPage;
