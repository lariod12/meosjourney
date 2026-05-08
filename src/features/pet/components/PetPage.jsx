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
  // Smart timing based on pet status level (5-20s range for active feel)
  timing: {
    critical: { minDelay: 5, maxDelay: 8, showChance: 0.95 },   // Most urgent - very frequent
    danger: { minDelay: 8, maxDelay: 12, showChance: 0.90 },    // High urgency
    warning: { minDelay: 12, maxDelay: 16, showChance: 0.85 },  // Medium urgency
    normal: { minDelay: 16, maxDelay: 20, showChance: 0.80 },   // Active feel
    excellent: { minDelay: 18, maxDelay: 25, showChance: 0.75 } // Still active, slightly relaxed
  },
  initialDelaySeconds: 5, // Wait before first bubble (reduced for faster start)
  interactionCooldownSeconds: 8 // Cooldown after user interaction (reduced)
};

const BIOLOGICAL_CLOCK_MESSAGES = {
  breakfast: [
    "Tui đói rồi! Đến giờ ăn sáng rồi!",
    "8 giờ sáng rồi, tui cần ăn sáng!",
    "Bụng tui sôi ùng ục! Giờ ăn sáng đây!"
  ],
  lunch: [
    "Tui đói bụng! Đến giờ ăn trưa rồi!",
    "11 giờ rồi, tui cần ăn trưa!",
    "Trưa rồi mà chưa ăn, tui đói quá!"
  ],
  dinner: [
    "Tui đói lắm! Đến giờ ăn tối rồi!",
    "6 giờ chiều rồi, tui cần ăn tối!",
    "Tối rồi mà chưa ăn, tui sắp xỉu!"
  ],
  bedtime: [
    "Tui buồn ngủ quá! Đến giờ ngủ rồi!",
    "10 giờ tối rồi, tui cần nghỉ ngơi!",
    "Tui mệt lắm, để tui ngủ đi!"
  ]
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

  // Priority 1: Biological clock warnings (only for messages, not for visual state)
  if (biologicalClock.isHungry && biologicalClock.currentMealTime) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES[biologicalClock.currentMealTime];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return {
      level,  // Use actual status level, not forced 'critical'
      weakest,
      message
    };
  }

  if (biologicalClock.isSleepy) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES.bedtime;
    const message = messages[Math.floor(Math.random() * messages.length)];
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
const PetPage = ({ onBack }) => {
  const petSaveQueueRef = useRef(Promise.resolve());
  const foodEffectTimeoutsRef = useRef(new Set());
  const careEffectTimeoutsRef = useRef(new Set());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('food');
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
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [isUpdateLocationModalOpen, setIsUpdateLocationModalOpen] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const sleepTimerRef = useRef(null);
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

    return itemList;
  }, [activeTab, activityItems, moodItems, petItems, isSleeping]);
  const petStatusRows = useMemo(() => createPetStatusRows(petStatus), [petStatus]);
  const petReaction = useMemo(() => {
    const reaction = getPetReaction(petStatus, biologicalClock);
    console.log('🐱 Pet Status:', petStatus);
    console.log('🐱 Biological Clock:', biologicalClock);
    console.log('🐱 Pet Reaction Level:', reaction.level);
    console.log('🐱 Weakest Stat:', reaction.weakest);
    return reaction;
  }, [petStatus, biologicalClock]);
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

        // Update pet status (health, hunger, sanity)
        if (petData.status) {
          setPetStatus(prev => ({
            health: petData.status.health ?? prev.health,
            hunger: petData.status.hunger ?? prev.hunger,
            sanity: petData.status.sanity ?? prev.sanity
          }));
        }

        // Update last status tick timestamp
        if (petData.lastStatusTickAt) {
          setLastStatusTickAt(petData.lastStatusTickAt);
        }
      }

      // Fetch status data (activities, moods, location)
      const statusData = await fetchStatus();
      if (statusData) {
        // Update activities
        if (statusData.doing && Array.isArray(statusData.doing)) {
          setActivityItems(statusData.doing);
          if (statusData.doing.length > 0) {
            setCurrentActivityName(statusData.doing[0].name || '');
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
    } catch (error) {
      console.error('❌ Error loading pet page data:', error);
      // Even on error, mark as loaded to show UI
      setIsDataLoaded(true);
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
    // Don't show bubble when sleeping
    if (isSleeping) {
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
  }, [isPageVisible, petReaction.level, isSleeping]);

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
            enqueuePetSave(updates);
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
  }, []);

  // Auto wake up at 5 AM
  useEffect(() => {
    if (!isSleeping) return;

    const checkWakeTime = () => {
      const now = new Date();
      const hour = now.getHours();

      // Wake up at 5 AM
      if (hour >= 5 && hour < 22) {
        console.log('☀️ Morning! Waking up at', hour, ':00');
        setIsSleeping(false);
      }
    };

    // Check immediately
    checkWakeTime();

    // Check every minute
    const intervalId = setInterval(checkWakeTime, 60000);

    return () => clearInterval(intervalId);
  }, [isSleeping]);

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
        setCurrentActivityName(sleepActivity.name);
        // Save to NocoDB
        saveStatus({
          doing: sleepActivity.name
        }).catch(err => console.error('Failed to save sleep activity:', err));
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

    const handleChooseActivityConfirm = async (activity) => {
    lastInteractionRef.current = Date.now(); // Track interaction for bubble timing
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
    lastInteractionRef.current = Date.now(); // Track interaction for bubble timing
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

  const handleUpdateLocation = async (newLocation) => {
    if (isSavingLocation) return;

    setIsSavingLocation(true);

    try {
      const result = await saveStatus({
        location: newLocation
      });

      if (result.success) {
        setCurrentLocationName(newLocation);
        // Update location history by prepending new location
        setLocationHistory(prev => {
          const filtered = prev.filter(loc => loc.toLowerCase() !== newLocation.toLowerCase());
          return [newLocation, ...filtered];
        });
        setIsUpdateLocationModalOpen(false);
      } else {
        console.error('Failed to update location:', result.message);
        alert('Failed to update location. Please try again.');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <main className="pet-page">
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

          <div className={`pet-character pet-character--pet pet-character--${petReaction.level} ${isSleeping ? 'pet-character--sleeping' : ''}`} role="img" aria-label="Meo box-head character">
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
            <span className="pet-character__shadow" />

            {/* ZZZ particles when sleeping */}
            {isSleeping && (
              <div className="pet-sleep-zzz" aria-hidden="true">
                <span className="pet-sleep-z pet-sleep-z--1">Z</span>
                <span className="pet-sleep-z pet-sleep-z--2">Z</span>
                <span className="pet-sleep-z pet-sleep-z--3">Z</span>
              </div>
            )}
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

      <UpdateLocationModal
        isOpen={isUpdateLocationModalOpen}
        onClose={() => setIsUpdateLocationModalOpen(false)}
        onSave={handleUpdateLocation}
        currentLocation={currentLocationName}
        locationHistory={locationHistory}
        isLoading={isSavingLocation}
      />
    </main>
  );
};

export default PetPage;
