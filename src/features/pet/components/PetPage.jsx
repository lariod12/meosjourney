import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  LuHammer, LuBed, LuTrainFront, LuSunset, LuWaves, LuLaptop, LuPlus, LuSearch, LuCamera, LuCameraOff,
  LuImage, LuGalleryHorizontal, LuX, LuCheck
} from 'react-icons/lu';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import MosquitoDebugPanel from './MosquitoDebugPanel';
import { LanguageProvider, CharacterProvider } from '../../../contexts';
import { characterData } from '../../../data/characterData';
import { useCharacterData } from '../../../hooks/useCharacterData';
import {
  CHARACTER_ID,
  clearNocoDBCache,
  fetchPet,
  fetchPetEvents,
  fetchStatus,
  savePet,
  savePetEvents,
  saveStatus,
  savePhotoAlbum,
  uploadProfileGalleryImages
} from '../../../services';
import { calculateThermometerFill, getCurrentWeatherWithRain } from '../../../services/weather/openMeteo';
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

const IS_PRODUCTION_MODE = import.meta.env.MODE === 'production';

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

const STAGE_TEMPERATURES = {
  dawn: { value: 18, fill: 34, label: 'Cool dawn' },
  morning: { value: 24, fill: 54, label: 'Soft morning' },
  noon: { value: 32, fill: 86, label: 'Hot noon' },
  afternoon: { value: 29, fill: 74, label: 'Warm afternoon' },
  dusk: { value: 25, fill: 58, label: 'Mild dusk' },
  evening: { value: 22, fill: 46, label: 'Calm evening' },
  night: { value: 19, fill: 36, label: 'Cool night' },
  midnight: { value: 17, fill: 28, label: 'Cold midnight' }
};

const STAGE_TIME_PERIODS = [
  { key: 'dawn', label: 'Dawn', description: '05:00 - 07:00' },
  { key: 'morning', label: 'Morning', description: '07:00 - 11:00' },
  { key: 'noon', label: 'Noon', description: '11:00 - 14:00' },
  { key: 'afternoon', label: 'Afternoon', description: '14:00 - 17:00' },
  { key: 'dusk', label: 'Dusk', description: '17:00 - 19:00' },
  { key: 'evening', label: 'Evening', description: '19:00 - 21:00' },
  { key: 'night', label: 'Night', description: '21:00 - 23:00' },
  { key: 'midnight', label: 'Midnight', description: '23:00 - 05:00' }
];

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

const VIETNAM_TIMEZONE_OFFSET_MINUTES = 7 * 60;

const formatVietnamTimestamp = (date = new Date()) => {
  const vietnamDate = new Date(date.getTime() + VIETNAM_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  return `${vietnamDate.toISOString().replace('Z', '')}+07:00`;
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
const STAGE_TIME_DEBUG_STORAGE_KEY = 'meo-stage-time-debug-v1';
const STAGE_TIME_DEBUG_AUTO_VALUE = 'auto';
const STAGE_RAIN_DEBUG_STORAGE_KEY = 'meo-stage-rain-debug-v2';
const STAGE_RAIN_DEBUG_AUTO_VALUE = 'auto';
const STAGE_RAIN_DEBUG_NONE_VALUE = 'none';
const STAGE_RAIN_DEFAULT_VARIANT = 'light';
const STAGE_RAIN_VARIANTS = [
  { key: 'drizzle', label: 'Mưa phùn', description: 'Fine, quiet, sparse' },
  { key: 'light', label: 'Mưa nhẹ', description: 'Soft layered rain' },
  { key: 'heavy', label: 'Mưa nặng hạt', description: 'Dense, fast, dramatic' }
];
const STAGE_RAIN_VARIANT_CONFIGS = {
  drizzle: { count: 88, seed: 11, opacity: [0.25, 0.62], duration: [0.8, 1.6], delay: [0, 1.8], height: [18, 32], width: [1, 2], depth: [1, 6], drift: [-3, 3], top: [-96, -24], blur: [0.1, 0.85] },
  light: { count: 116, seed: 29, opacity: [0.32, 0.76], duration: [0.5, 1.2], delay: [0, 1.4], height: [22, 42], width: [1, 3], depth: [1, 7], drift: [-3, 3], top: [-92, -20], blur: [0, 0.52] },
  heavy: { count: 168, seed: 47, opacity: [0.42, 0.92], duration: [0.25, 0.7], delay: [0, 0.9], height: [32, 62], width: [1, 4], depth: [1, 8], drift: [-4, 4], top: [-100, -28], blur: [0, 0.32] }
};
const STAGE_RAIN_MOBILE_DROP_LIMITS = {
  drizzle: 28,
  light: 36,
  heavy: 48
};
const STAGE_RAIN_MOBILE_QUERY = '(max-width: 768px), (hover: none) and (pointer: coarse)';
const createStageRainNoise = (index, seed, offset = 0) => {
  const value = Math.sin((index + 1) * (seed + 17.17 + offset) * 91.345);
  return value - Math.floor(value);
};
const pickStageRainRange = ([min, max], noise) => min + (max - min) * noise;
const createStageRainDrops = (variantKey, config) => (
  Array.from({ length: config.count }, (_, index) => {
    const depthNoise = createStageRainNoise(index, config.seed, 5);
    const depth = Math.round(pickStageRainRange(config.depth, depthNoise));
    const top = pickStageRainRange(config.top, createStageRainNoise(index, config.seed, 2));

    return {
      id: `${variantKey}-${index}`,
      left: `${Math.round(pickStageRainRange([-4, 104], createStageRainNoise(index, config.seed, 1)))}%`,
      top: `${Math.round(top)}%`,
      endTop: `${Math.round(102 + Math.abs(top) * 0.22 + createStageRainNoise(index, config.seed, 3) * 18)}%`,
      opacity: pickStageRainRange(config.opacity, createStageRainNoise(index, config.seed, 4)).toFixed(2),
      duration: `${pickStageRainRange(config.duration, createStageRainNoise(index, config.seed, 6)).toFixed(2)}s`,
      delay: `-${pickStageRainRange(config.delay, createStageRainNoise(index, config.seed, 7)).toFixed(2)}s`,
      height: `${Math.round(pickStageRainRange(config.height, createStageRainNoise(index, config.seed, 8)) * (0.78 + depth * 0.08))}px`,
      width: `${Math.round(pickStageRainRange(config.width, createStageRainNoise(index, config.seed, 9)))}px`,
      z: depth,
      drift: `${Math.round(pickStageRainRange(config.drift, createStageRainNoise(index, config.seed, 10)) * (0.8 + depth * 0.08))}px`,
      blur: `${pickStageRainRange(config.blur, createStageRainNoise(index, config.seed, 11)).toFixed(2)}px`,
      scale: (0.78 + depth * 0.12).toFixed(2)
    };
  })
);
const STAGE_RAIN_DROPS_BY_VARIANT = Object.fromEntries(
  Object.entries(STAGE_RAIN_VARIANT_CONFIGS).map(([variantKey, config]) => [
    variantKey,
    createStageRainDrops(variantKey, config)
  ])
);
const PET_STATUS_DECAY_CHUNK_MS = 60 * 60 * 1000;
const PET_STATUS_SYNC_MIN_MS = 10 * 1000;
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
const PET_CAMERA_REFUSAL_MESSAGES = {
  critical: 'Tui không thể chụp ảnh lúc này... tui đang cạn kiệt sức rồi.',
  sleeping: 'Tui đang ngủ rồi... để tui nghỉ ngơi thêm chút nha.'
};

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

const clampPetStatusValue = (value, options = {}) => {
  const { round = true } = options;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  const clampedValue = Math.min(100, Math.max(0, numberValue));
  return round ? Math.round(clampedValue) : Number(clampedValue.toFixed(2));
};

const clampPetStatus = (status = {}) => ({
  health: clampPetStatusValue(status.health ?? DEFAULT_PET_STATUS.health, { round: false }),
  hunger: clampPetStatusValue(status.hunger ?? DEFAULT_PET_STATUS.hunger, { round: false }),
  sanity: clampPetStatusValue(status.sanity ?? DEFAULT_PET_STATUS.sanity, { round: false })
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

const PET_CHARACTER_POSITION_STORAGE_KEY = 'meo-pet-character-position-debug';
const PET_DEBUG_CSS_SNAPSHOT_STORAGE_KEY = 'meo-pet-debug-css-snapshot';
const PET_CHARACTER_POSITION_DEFAULTS = {
  bottom: 44,
  shadowGap: -8,
  cameraArmX: -10,
  cameraArmTop: 20,
  cameraArmWidth: 22,
  cameraArmHeight: 52,
  cameraArmRotate: 6
};
const PET_CHARACTER_POSITION_LIMITS = {
  bottom: { min: 20, max: 120 },
  shadowGap: { min: -28, max: 24 },
  cameraArmX: { min: -24, max: 12 },
  cameraArmTop: { min: 8, max: 38 },
  cameraArmWidth: { min: 12, max: 36 },
  cameraArmHeight: { min: 34, max: 76 },
  cameraArmRotate: { min: -20, max: 20 }
};

const PET_CHARACTER_POSITION_CONTROLS = [
  { key: 'bottom', label: 'Pet bottom', unit: 'px' },
  { key: 'shadowGap', label: 'Shadow gap', unit: 'px' },
  { key: 'cameraArmX', label: 'Camera arm X', unit: 'px' },
  { key: 'cameraArmTop', label: 'Camera arm top', unit: 'px' },
  { key: 'cameraArmWidth', label: 'Camera arm width', unit: 'px' },
  { key: 'cameraArmHeight', label: 'Camera arm height', unit: 'px' },
  { key: 'cameraArmRotate', label: 'Camera arm rotate', unit: 'deg' }
];

const PET_CHARACTER_BASE_WIDTH = 168;
const PET_CHARACTER_BASE_HEIGHT = 210;
const PET_CLICK_AREA_DEBUG_STORAGE_KEY = 'meo-pet-click-area-debug-v2';
const PET_CLICK_AREA_DEBUG_DEFAULTS = {
  visible: false,
  x: 0,
  y: 8,
  width: 34,
  height: 84
};
const PET_CLICK_AREA_DEBUG_LIMITS = {
  x: { min: -80, max: 80 },
  y: { min: -70, max: 90 },
  width: { min: 0, max: 140 },
  height: { min: 20, max: 140 }
};
const PET_CLICK_AREA_DEBUG_CONTROLS = [
  { key: 'x', label: 'Click area X', unit: '%', step: 0.5 },
  { key: 'y', label: 'Click area Y', unit: '%', step: 0.5 },
  { key: 'width', label: 'Click area width', unit: '%', step: 0.5 },
  { key: 'height', label: 'Click area height', unit: '%', step: 0.5 }
];

const STAGE_THERMOMETER_POSITION_STORAGE_KEY = 'meo-stage-thermometer-position-debug-v2';
const STAGE_THERMOMETER_POSITION_DEFAULTS = {
  x: 0,
  y: 0,
  size: 54
};
const STAGE_THERMOMETER_POSITION_LIMITS = {
  x: { min: -120, max: 520 },
  y: { min: -320, max: 320 },
  size: { min: 45, max: 220 }
};
const STAGE_THERMOMETER_POSITION_CONTROLS = [
  { key: 'x', label: 'Thermo X', unit: 'px' },
  { key: 'y', label: 'Thermo Y', unit: 'px' },
  { key: 'size', label: 'Thermo size', unit: '%' }
];

const MOSQUITO_DEBUG_CONFIG_STORAGE_KEY = 'mosquito-debug-config-shape-lab-v3';
const MOSQUITO_EVENT_EVENING_START_HOUR = 18;
const MOSQUITO_EVENT_EVENING_END_HOUR = 23;
const MOSQUITO_EVENT_NIGHT_START_HOUR = 0;
const MOSQUITO_EVENT_NIGHT_END_HOUR = 3;
const MOSQUITO_EVENT_MIN_WAVES = 3;
const MOSQUITO_EVENT_MAX_WAVES = 5;
const MOSQUITO_WING_FLAP_DURATION_MS = 25;
const MOSQUITO_BITE_START_DELAY_MS = 420;
const MOSQUITO_BITE_TICK_MS = 1250;
const MOSQUITO_BITE_DAMAGE = 1;
const MOSQUITO_KILL_MIN_ANIMATION_MS = 1400;
const MOSQUITO_KILL_MAX_ANIMATION_MS = 2600;
const MOSQUITO_KILL_FALL_SPEED_PX_PER_SEC = 620;
const MOSQUITO_DEBUG_CONFIG_DEFAULTS = {
  isEnabled: true,
  stageTopPercent: 51,
  stageBottomPercent: 86,
  stageLeftPercent: 0,
  stageRightPercent: 100,
  showBoundaries: false,
  showPaths: false,
  spawnIntervalMinMs: 1000,
  spawnIntervalMaxMs: 2000,
  eventWavesMin: 1,
  eventWavesMax: 3,
  mosquitoesPerSpawnMin: 3,
  mosquitoesPerSpawnMax: 5,
  maxMosquitoes: 5,
  flightSpeedMinPxPerSec: 45,
  flightSpeedMaxPxPerSec: 199,
  holdDurationMinMs: 3000,
  holdDurationMaxMs: 7000,
  biteEffectFontSizePx: 21,
  biteEffectFloatHeightPx: 96,
  sizePercent: 30,
  bodyBuzzDurationMs: 315,
  bodyBuzzX: 1,
  bodyBuzzY: 1,
  bodyBuzzRotateDeg: 2,
  curveAmountPercent: 10
};

const clampMosquitoNumber = (value, fallback, min, max) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
};

const normalizeMosquitoDebugConfig = (config = {}) => {
  const next = {
    ...MOSQUITO_DEBUG_CONFIG_DEFAULTS,
    isEnabled: typeof config.isEnabled === 'boolean'
      ? config.isEnabled
      : MOSQUITO_DEBUG_CONFIG_DEFAULTS.isEnabled,
    showBoundaries: typeof config.showBoundaries === 'boolean'
      ? config.showBoundaries
      : MOSQUITO_DEBUG_CONFIG_DEFAULTS.showBoundaries,
    showPaths: typeof config.showPaths === 'boolean'
      ? config.showPaths
      : MOSQUITO_DEBUG_CONFIG_DEFAULTS.showPaths,
    stageTopPercent: clampMosquitoNumber(config.stageTopPercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.stageTopPercent, 0, 100),
    stageBottomPercent: clampMosquitoNumber(config.stageBottomPercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.stageBottomPercent, 0, 100),
    stageLeftPercent: clampMosquitoNumber(config.stageLeftPercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.stageLeftPercent, 0, 100),
    stageRightPercent: clampMosquitoNumber(config.stageRightPercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.stageRightPercent, 0, 100),
    spawnIntervalMinMs: clampMosquitoNumber(config.spawnIntervalMinMs, MOSQUITO_DEBUG_CONFIG_DEFAULTS.spawnIntervalMinMs, 500, 10000),
    spawnIntervalMaxMs: clampMosquitoNumber(config.spawnIntervalMaxMs, MOSQUITO_DEBUG_CONFIG_DEFAULTS.spawnIntervalMaxMs, 500, 10000),
    eventWavesMin: clampMosquitoNumber(config.eventWavesMin, MOSQUITO_DEBUG_CONFIG_DEFAULTS.eventWavesMin, 1, 20),
    eventWavesMax: clampMosquitoNumber(config.eventWavesMax, MOSQUITO_DEBUG_CONFIG_DEFAULTS.eventWavesMax, 1, 20),
    mosquitoesPerSpawnMin: clampMosquitoNumber(config.mosquitoesPerSpawnMin, MOSQUITO_DEBUG_CONFIG_DEFAULTS.mosquitoesPerSpawnMin, 1, 20),
    mosquitoesPerSpawnMax: clampMosquitoNumber(config.mosquitoesPerSpawnMax, MOSQUITO_DEBUG_CONFIG_DEFAULTS.mosquitoesPerSpawnMax, 1, 20),
    maxMosquitoes: clampMosquitoNumber(config.maxMosquitoes, MOSQUITO_DEBUG_CONFIG_DEFAULTS.maxMosquitoes, 1, 50),
    flightSpeedMinPxPerSec: clampMosquitoNumber(config.flightSpeedMinPxPerSec, MOSQUITO_DEBUG_CONFIG_DEFAULTS.flightSpeedMinPxPerSec, 10, 240),
    flightSpeedMaxPxPerSec: clampMosquitoNumber(config.flightSpeedMaxPxPerSec, MOSQUITO_DEBUG_CONFIG_DEFAULTS.flightSpeedMaxPxPerSec, 10, 240),
    holdDurationMinMs: clampMosquitoNumber(config.holdDurationMinMs, MOSQUITO_DEBUG_CONFIG_DEFAULTS.holdDurationMinMs, 0, 15000),
    holdDurationMaxMs: clampMosquitoNumber(config.holdDurationMaxMs, MOSQUITO_DEBUG_CONFIG_DEFAULTS.holdDurationMaxMs, 0, 15000),
    biteEffectFontSizePx: clampMosquitoNumber(config.biteEffectFontSizePx, MOSQUITO_DEBUG_CONFIG_DEFAULTS.biteEffectFontSizePx, 12, 80),
    biteEffectFloatHeightPx: clampMosquitoNumber(config.biteEffectFloatHeightPx, MOSQUITO_DEBUG_CONFIG_DEFAULTS.biteEffectFloatHeightPx, 24, 240),
    sizePercent: clampMosquitoNumber(config.sizePercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.sizePercent, 1, 220),
    bodyBuzzDurationMs: clampMosquitoNumber(config.bodyBuzzDurationMs, MOSQUITO_DEBUG_CONFIG_DEFAULTS.bodyBuzzDurationMs, 35, 1000),
    bodyBuzzX: clampMosquitoNumber(config.bodyBuzzX, MOSQUITO_DEBUG_CONFIG_DEFAULTS.bodyBuzzX, 0, 8),
    bodyBuzzY: clampMosquitoNumber(config.bodyBuzzY, MOSQUITO_DEBUG_CONFIG_DEFAULTS.bodyBuzzY, 0, 8),
    bodyBuzzRotateDeg: clampMosquitoNumber(config.bodyBuzzRotateDeg, MOSQUITO_DEBUG_CONFIG_DEFAULTS.bodyBuzzRotateDeg, 0, 20),
    curveAmountPercent: clampMosquitoNumber(config.curveAmountPercent, MOSQUITO_DEBUG_CONFIG_DEFAULTS.curveAmountPercent, 10, 90)
  };

  if (next.stageTopPercent > next.stageBottomPercent) {
    next.stageBottomPercent = next.stageTopPercent;
  }
  if (next.stageLeftPercent > next.stageRightPercent) {
    next.stageRightPercent = next.stageLeftPercent;
  }
  if (next.spawnIntervalMinMs > next.spawnIntervalMaxMs) {
    next.spawnIntervalMaxMs = next.spawnIntervalMinMs;
  }
  if (next.eventWavesMin > next.eventWavesMax) {
    next.eventWavesMax = next.eventWavesMin;
  }
  if (next.mosquitoesPerSpawnMin > next.mosquitoesPerSpawnMax) {
    next.mosquitoesPerSpawnMax = next.mosquitoesPerSpawnMin;
  }
  if (next.flightSpeedMinPxPerSec > next.flightSpeedMaxPxPerSec) {
    next.flightSpeedMaxPxPerSec = next.flightSpeedMinPxPerSec;
  }
  if (next.holdDurationMinMs > next.holdDurationMaxMs) {
    next.holdDurationMaxMs = next.holdDurationMinMs;
  }

  return next;
};

const getMosquitoEventDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isMosquitoEventWindow = (date = new Date()) => {
  const hour = date.getHours();
  return (
    (hour >= MOSQUITO_EVENT_EVENING_START_HOUR && hour <= MOSQUITO_EVENT_EVENING_END_HOUR) ||
    (hour >= MOSQUITO_EVENT_NIGHT_START_HOUR && hour <= MOSQUITO_EVENT_NIGHT_END_HOUR)
  );
};

const getMosquitoCompletedDateKey = (completedAt) => {
  if (!completedAt) return null;

  if (typeof completedAt === 'string') {
    const dateMatch = completedAt.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
  }

  const completedDate = completedAt instanceof Date ? completedAt : new Date(completedAt);
  if (Number.isNaN(completedDate.getTime())) {
    return null;
  }

  return getMosquitoEventDateKey(completedDate);
};

const isMosquitoEventClearedToday = (events = {}) => (
  getMosquitoCompletedDateKey(events?.mosquito?.completedAt) === getMosquitoEventDateKey()
);

const clampMosquitoRouteValue = (value, min, max) => Math.min(max, Math.max(min, value));

const formatMosquitoPathNumber = (value) => Number(value.toFixed(1));

const clampCharacterPositionValue = (key, value) => {
  const limits = PET_CHARACTER_POSITION_LIMITS[key];
  const numericValue = Number(value);

  if (!limits || !Number.isFinite(numericValue)) {
    return PET_CHARACTER_POSITION_DEFAULTS[key];
  }

  return Math.round(Math.min(limits.max, Math.max(limits.min, numericValue)));
};

const clampPetClickAreaDebugValue = (key, value) => {
  const limits = PET_CLICK_AREA_DEBUG_LIMITS[key];
  const numericValue = Number(value);

  if (!limits || !Number.isFinite(numericValue)) {
    return PET_CLICK_AREA_DEBUG_DEFAULTS[key];
  }

  return Math.round(Math.min(limits.max, Math.max(limits.min, numericValue)) * 10) / 10;
};

const formatPetClickAreaPercent = (value) => `${Number(value).toFixed(1).replace(/\.0$/, '')}%`;

const getPetClickAreaPixelBounds = (clickArea = PET_CLICK_AREA_DEBUG_DEFAULTS) => ({
  x: (clickArea.x / 100) * PET_CHARACTER_BASE_WIDTH,
  y: (clickArea.y / 100) * PET_CHARACTER_BASE_HEIGHT,
  width: (clickArea.width / 100) * PET_CHARACTER_BASE_WIDTH,
  height: (clickArea.height / 100) * PET_CHARACTER_BASE_HEIGHT
});

const clampThermometerPositionValue = (key, value) => {
  const limits = STAGE_THERMOMETER_POSITION_LIMITS[key];
  const numericValue = Number(value);

  if (!limits || !Number.isFinite(numericValue)) {
    return STAGE_THERMOMETER_POSITION_DEFAULTS[key];
  }

  return Math.round(Math.min(limits.max, Math.max(limits.min, numericValue)));
};

const normalizeStageRainVariant = (variant, fallback = STAGE_RAIN_DEFAULT_VARIANT) => (
  STAGE_RAIN_DROPS_BY_VARIANT[variant] ? variant : fallback
);

const normalizeStageRainDebugVariant = (variant) => {
  if (variant === STAGE_RAIN_DEBUG_AUTO_VALUE || variant === STAGE_RAIN_DEBUG_NONE_VALUE) {
    return variant;
  }

  return normalizeStageRainVariant(variant, STAGE_RAIN_DEBUG_AUTO_VALUE);
};

const normalizeStageTimeDebugPeriod = (period) => {
  if (period === STAGE_TIME_DEBUG_AUTO_VALUE) {
    return period;
  }

  return STAGE_TEMPERATURES[period] ? period : STAGE_TIME_DEBUG_AUTO_VALUE;
};

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
  const nextTickAt = formatVietnamTimestamp(now);
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
  const chunks = Math.max(0, elapsedMs / PET_STATUS_DECAY_CHUNK_MS);

  if (elapsedMs <= 0) {
    return {
      status: nextStatus,
      lastStatusTickAt,
      chunks,
      shouldSave: false
    };
  }

  nextStatus.hunger = clampPetStatusValue(
    nextStatus.hunger - (PET_STATUS_DECAY.hunger * chunks),
    { round: false }
  );
  nextStatus.sanity = clampPetStatusValue(
    nextStatus.sanity - (PET_STATUS_DECAY.sanity * chunks),
    { round: false }
  );

  if (nextStatus.hunger < 30 || nextStatus.sanity < 30) {
    nextStatus.health = clampPetStatusValue(
      nextStatus.health - (PET_STATUS_DECAY.health * chunks),
      { round: false }
    );
  }

  const roundedCurrentStatus = clampPetStatus(status);
  const roundedStatusChanged = PET_STATUS_KEYS.some((key) => (
    clampPetStatusValue(roundedCurrentStatus[key]) !== clampPetStatusValue(nextStatus[key])
  ));

  return {
    status: nextStatus,
    lastStatusTickAt: nextTickAt,
    chunks,
    shouldSave: elapsedMs >= PET_STATUS_SYNC_MIN_MS && roundedStatusChanged
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

const PetStageMosquitoBiteEffect = ({ effect, onDone }) => {
  const fontSizePx = effect.fontSizePx ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.biteEffectFontSizePx;
  const floatHeightPx = effect.floatHeightPx ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.biteEffectFloatHeightPx;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      onDone(effect.id);
    }, 1100);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [effect.id, onDone]);

  return (
    <div
      className="pet-mosquito-bite-effect"
      style={{
        left: `${effect.x}px`,
        top: `${effect.y}px`,
        '--mosquito-bite-font-size': `${fontSizePx}px`,
        '--mosquito-bite-float-height': `${floatHeightPx}px`,
        '--mosquito-bite-float-mid-height': `${Math.round(floatHeightPx * 0.58)}px`
      }}
      aria-hidden="true"
      onAnimationEnd={() => onDone(effect.id)}
    >
      -1
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
      const shouldDelayForItemEffect = Array.from(newAnimatingKeys.values()).some((type) => type === 'increase');
      const animationDelayMs = shouldDelayForItemEffect ? 3000 : 0;
      const delayTimeout = setTimeout(() => {
        setAnimatingKeys(newAnimatingKeys);
        setDisplayValues(prev => ({ ...prev, ...pendingValues }));
        Object.keys(pendingValues).forEach(key => {
          prevValuesRef.current[key] = pendingValues[key];
        });
        
        // Clear animation state after animation completes (600ms)
        setTimeout(() => {
          setAnimatingKeys(new Map());
        }, 600);
      }, animationDelayMs);

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

const MEO_BOX_CHARACTER_CONFIG = {
  eyeRx: 46,
  eyeRy: 61,
  eyeX: 3,
  eyeY: 0,
  eyeSpacing: 1,
  eyeStroke: 6,
  mouthStroke: 8,
  mouthScale: 1,
  mouthX: 10,
  mouthY: 13,
  headScaleX: 1.16,
  headScaleY: 1.06,
  headStroke: 12,
  earStroke: 12,
  pantsHeight: 34,
  seamY: 39,
  seamLength: 40,
  leftShoulderX: 0,
  leftShoulderY: 0,
  rightShoulderX: 0,
  rightShoulderY: 0,
  leftHandX: -9,
  leftHandY: -32,
  rightHandX: 8,
  rightHandY: -34,
  leftArmCurve1X: 0,
  leftArmCurve1Y: 0,
  leftArmCurve2X: 5,
  leftArmCurve2Y: -76,
  rightArmCurve1X: -3,
  rightArmCurve1Y: -23,
  rightArmCurve2X: -1,
  rightArmCurve2Y: -55,
  leftEarScale: 0.96,
  leftEarY: 0,
  rightEarScale: 0.88,
  rightEarY: -4
};

const MEO_BOX_STABLE_MOUTH_PATH = 'M449 409 C474 392 487 421 458 424 C489 431 475 467 445 453';
const MEO_BOX_FACE_PRESETS = {
  [PET_CHARACTER_STATES.stable]: {
    eyes: {
      mode: 'open',
      useDebugEyeConfig: true,
      left: { rx: 44, ry: 58, cx: 369, cy: 335, pupilCx: 379, pupilCy: 340 },
      right: { rx: 44, ry: 58, cx: 531, cy: 335, pupilCx: 521, pupilCy: 340 }
    },
    mouth: { d: MEO_BOX_STABLE_MOUTH_PATH, fill: 'none' }
  },
  [PET_CHARACTER_STATES.needsCare]: {
    eyes: {
      mode: 'open',
      left: { rx: 28, ry: 33, cx: 374, cy: 356, pupilCx: 380, pupilCy: 367, pupilR: 12 },
      right: { rx: 28, ry: 33, cx: 526, cy: 356, pupilCx: 518, pupilCy: 367, pupilR: 12 }
    },
    brows: {
      left: {
        start: [338, 335],
        control: [363, 342],
        end: [393, 317]
      },
      right: {
        start: [511.80158851617875, 317.2441562416585],
        control: [538, 341],
        end: [559.1984114838212, 332.7558437583415]
      }
    },
    mouth: { d: 'M435 462 Q450 441 465 462', fill: 'none' }
  },
  [PET_CHARACTER_STATES.critical]: {
    eyes: {
      mode: 'open',
      left: { rx: 43, ry: 56, cx: 368, cy: 344, pupilCx: 368, pupilCy: 344, hidePupil: true },
      right: { rx: 43, ry: 56, cx: 532, cy: 344, pupilCx: 532, pupilCy: 344, hidePupil: true }
    },
    brows: {
      left: {
        start: [337, 291],
        control: [370, 319],
        end: [400, 289]
      },
      right: {
        start: [500, 289],
        control: [530, 319],
        end: [563, 291]
      }
    },
    mouth: { d: 'M417 467 Q450 423 486 467 Q450 448 417 467 Z', fill: '#ffffff' }
  },
  [PET_CHARACTER_STATES.excellent]: {
    eyes: {
      mode: 'closed',
      left: 'M333 354 Q368 304 403 354',
      right: 'M497 354 Q532 304 567 354'
    },
    mouth: { d: 'M416 398 H484 Q478 463 450 464 Q422 463 416 398 Z', fill: '#ffffff' }
  },
  [PET_CHARACTER_STATES.sleeping]: {
    eyes: {
      mode: 'closed',
      left: 'M333 360 Q368 392 403 360',
      right: 'M497 360 Q532 392 567 360'
    },
    mouth: { d: MEO_BOX_STABLE_MOUTH_PATH, fill: 'none' },
    zzz: true
  }
};

const buildBrowPath = ({ start, control, end }) => (
  `M${start[0]} ${start[1]} Q${control[0]} ${control[1]} ${end[0]} ${end[1]}`
);

const MeoBoxPetCharacter = ({ state = PET_CHARACTER_STATES.stable }) => {
  const config = MEO_BOX_CHARACTER_CONFIG;
  const facePreset = MEO_BOX_FACE_PRESETS[state] || MEO_BOX_FACE_PRESETS[PET_CHARACTER_STATES.stable];
  const usesOpenEyes = facePreset.eyes.mode === 'open';
  const getOpenEyePreset = (side) => {
    const eye = facePreset.eyes[side];
    if (!facePreset.eyes.useDebugEyeConfig) return eye;

    const direction = side === 'left' ? -1 : 1;
    const eyeOffset = config.eyeX + config.eyeSpacing * direction;

    return {
      ...eye,
      cx: eye.cx + eyeOffset,
      cy: eye.cy + config.eyeY,
      rx: config.eyeRx,
      ry: config.eyeRy,
      pupilCx: eye.pupilCx + eyeOffset,
      pupilCy: eye.pupilCy + config.eyeY
    };
  };
  const headTransform = [
    'translate(450 350)',
    `scale(${config.headScaleX} ${config.headScaleY})`,
    'translate(-450 -350)'
  ].join(' ');
  const mouthTransform = [
    `translate(${config.mouthX} ${config.mouthY})`,
    'translate(462 430)',
    `scale(${config.mouthScale})`,
    'translate(-462 -430)'
  ].join(' ');
  const pantsHeightOffset = config.pantsHeight;
  const pantsPath = `M334 786 Q392 816 450 816 Q508 817 566 786 L${587} ${867 + pantsHeightOffset} Q526 ${888 + pantsHeightOffset} 458 ${878 + pantsHeightOffset} Q444 ${876 + pantsHeightOffset} 430 ${878 + pantsHeightOffset} Q365 ${888 + pantsHeightOffset} 313 ${867 + pantsHeightOffset} Z`;
  const seamStartY = 818 + config.seamY;
  const seamMidY = seamStartY + (config.seamLength / 2);
  const seamEndY = seamStartY + config.seamLength;
  const seamPath = `M450 ${seamStartY} Q451 ${seamMidY} 450 ${seamEndY}`;
  const leftShoulderX = 362 + config.leftShoulderX;
  const leftShoulderY = 544 + config.leftShoulderY;
  const leftHandX = 301 + config.leftHandX;
  const leftHandY = 795 + config.leftHandY;
  const leftCurve1X = 335 + config.leftArmCurve1X;
  const leftCurve1Y = 633 + config.leftArmCurve1Y;
  const leftCurve2X = 318 + config.leftArmCurve2X;
  const leftCurve2Y = 706 + config.leftArmCurve2Y;
  const rightShoulderX = 538 + config.rightShoulderX;
  const rightShoulderY = 544 + config.rightShoulderY;
  const rightHandX = 599 + config.rightHandX;
  const rightHandY = 795 + config.rightHandY;
  const rightCurve1X = 565 + config.rightArmCurve1X;
  const rightCurve1Y = 633 + config.rightArmCurve1Y;
  const rightCurve2X = 582 + config.rightArmCurve2X;
  const rightCurve2Y = 706 + config.rightArmCurve2Y;
  const leftEarTransform = [
    'translate(254 285)',
    `scale(${config.leftEarScale})`,
    'translate(-254 -285)',
    `translate(0 ${config.leftEarY})`
  ].join(' ');
  const rightEarTransform = [
    'translate(646 285)',
    `scale(${config.rightEarScale})`,
    'translate(-646 -285)',
    `translate(0 ${config.rightEarY})`
  ].join(' ');

  return (
    <svg
      className="pet-box-character"
      viewBox="0 0 900 1120"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
    <defs>
      <linearGradient
        id="petBoxBodyShade"
        x1="315"
        y1="510"
        x2="585"
        y2="780"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#d4d4d4" />
        <stop offset="0.6" stopColor="#bababa" />
        <stop offset="1" stopColor="#979797" />
      </linearGradient>
      <linearGradient
        id="petBoxPantsShade"
        x1="310"
        y1="750"
        x2="590"
        y2="850"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#8e8e8e" />
        <stop offset="1" stopColor="#686868" />
      </linearGradient>
      <filter id="petBoxRoughen">
        <feTurbulence
          baseFrequency="0.012"
          numOctaves="2"
          seed="7"
          type="fractalNoise"
        />
        <feDisplacementMap in="SourceGraphic" scale="1.8" />
      </filter>
    </defs>

    <g className="pet-box-character__figure">
      <g className="pet-box-character__legs" filter="url(#petBoxRoughen)">
        <path
          className="pet-box-character__line-heavy"
          d="M374 829 L374 1004 Q370 1030 351 1032"
        />
        <path
          className="pet-box-character__line-heavy"
          d="M526 829 L526 1004 Q530 1030 549 1032"
        />
      </g>

      <g className="pet-box-character__body" filter="url(#petBoxRoughen)">
        <path
          className="pet-box-character__body-fill pet-box-character__line-heavy"
          d="M377 528 L523 528 L566 786 Q526 810 455 811 Q383 812 334 786 Z"
        />
        <path
          className="pet-box-character__pants-fill pet-box-character__line-heavy"
          d={pantsPath}
        />
        <path className="pet-box-character__line" d="M336 789 Q412 823 564 789" />
        <path className="pet-box-character__pants-seam" d={seamPath} />
      </g>

      <g className="pet-box-character__arms" filter="url(#petBoxRoughen)">
        <g className="pet-box-character__arm-wrap pet-box-character__arm-wrap--left">
          <path
            className="pet-box-character__line-heavy"
            d={`M${leftShoulderX} ${leftShoulderY} C${leftCurve1X} ${leftCurve1Y} ${leftCurve2X} ${leftCurve2Y} ${leftHandX} ${leftHandY}`}
          />
          <circle className="pet-box-character__fill-ink" cx={leftHandX - 3} cy={leftHandY + 20} r="23" />
        </g>
        <g className="pet-box-character__arm-wrap pet-box-character__arm-wrap--right">
          <path
            className="pet-box-character__line-heavy"
            d={`M${rightShoulderX} ${rightShoulderY} C${rightCurve1X} ${rightCurve1Y} ${rightCurve2X} ${rightCurve2Y} ${rightHandX} ${rightHandY}`}
          />
          <circle className="pet-box-character__fill-ink" cx={rightHandX + 3} cy={rightHandY + 20} r="23" />
        </g>
      </g>

      <g className="pet-box-character__head-parts">
        <g className="pet-box-character__ears" filter="url(#petBoxRoughen)" transform={headTransform}>
          <g transform={leftEarTransform}>
            <path
              className="pet-box-character__ear-fill"
              d="M254 205 C174 216 165 220 170 243 C176 270 225 333 263 365 Z"
            />
            <path
              className="pet-box-character__head-line"
              d="M254 205 C174 216 165 220 170 243 C176 270 225 333 263 365"
              style={{ strokeWidth: config.earStroke }}
            />
            <path className="pet-box-character__line" d="M254 249 L211 257 L264 327" />
          </g>
          <g transform={rightEarTransform}>
            <path
              className="pet-box-character__ear-fill"
              d="M646 205 C726 216 735 220 730 243 C724 270 675 333 637 365 Z"
            />
            <path
              className="pet-box-character__head-line"
              d="M646 205 C726 216 735 220 730 243 C724 270 675 333 637 365"
              style={{ strokeWidth: config.earStroke }}
            />
            <path className="pet-box-character__line" d="M646 249 L689 257 L636 327" />
          </g>
        </g>

        <g className="pet-box-character__head" filter="url(#petBoxRoughen)" transform={headTransform}>
          <path
            className="pet-box-character__box-fill pet-box-character__head-line"
            d="M250 214 H650 L640 518 Q640 538 620 539 H280 Q260 538 260 518 Z"
            style={{ strokeWidth: config.headStroke }}
          />
          <path
            className="pet-box-character__box-fill pet-box-character__head-line"
            d="M250 214 L315 158 H585 L650 214 Z"
            style={{ strokeWidth: config.headStroke }}
          />
          <path
            className="pet-box-character__head-line"
            d="M250 214 H650"
            style={{ strokeWidth: config.headStroke }}
          />
        </g>

        <g className="pet-box-character__face" transform={headTransform}>
          {usesOpenEyes ? (
            <>
              {['left', 'right'].map((side) => {
                const eye = getOpenEyePreset(side);
                return (
                  <g
                    className={`pet-box-character__eye-group pet-box-character__eye-group--${side}`}
                    key={side}
                  >
                    <ellipse
                      className="pet-box-character__eye-line"
                      cx={eye.cx}
                      cy={eye.cy}
                      rx={eye.rx}
                      ry={eye.ry}
                      style={{ strokeWidth: config.eyeStroke }}
                    />
                    {!eye.hidePupil && (
                      <circle
                        className="pet-box-character__fill-ink"
                        cx={eye.pupilCx}
                        cy={eye.pupilCy}
                        r={eye.pupilR || 15}
                      />
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            <g className="pet-box-character__sleep-eyes" aria-hidden="true">
              <path className="pet-box-character__sleep-eye" d={facePreset.eyes.left} style={{ opacity: 1 }} />
              <path className="pet-box-character__sleep-eye" d={facePreset.eyes.right} style={{ opacity: 1 }} />
            </g>
          )}
          {facePreset.brows && (
            <g className="pet-box-character__expression-eyes" aria-hidden="true">
              <path className="pet-box-character__expression-line" d={buildBrowPath(facePreset.brows.left)} />
              <path className="pet-box-character__expression-line" d={buildBrowPath(facePreset.brows.right)} />
            </g>
          )}
          <g className="pet-box-character__mouth" transform={mouthTransform}>
            <path
              className="pet-box-character__mouth-line"
              d={facePreset.mouth.d}
              style={{ strokeWidth: config.mouthStroke, fill: facePreset.mouth.fill }}
            />
          </g>
          <path className="pet-box-character__whisker" d="M556 412 Q575 407 589 405" />
          <path className="pet-box-character__whisker" d="M558 432 Q580 436 593 445" />
        </g>
        <g className="pet-box-character__sleep-zzz" aria-hidden="true">
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--1" x="626" y="156">Z</text>
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--2" x="658" y="126">Z</text>
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--3" x="688" y="98">Z</text>
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--4" x="634" y="152">Z</text>
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--5" x="666" y="122">Z</text>
          <text className="pet-box-character__sleep-z pet-box-character__sleep-z--6" x="696" y="94">Z</text>
        </g>
      </g>
    </g>
    </svg>
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
  const mosquitoBiteSaveTimerRef = useRef(null);
  const mosquitoBitePendingSaveRef = useRef(null);
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
  const [debugCssStatus, setDebugCssStatus] = useState('');
  const [debugAwakeningMode, setDebugAwakeningMode] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return 'auto';
    }

    try {
      const saved = localStorage.getItem('pet-debug-awakening-mode');
      return saved === 'sleep' || saved === 'awakening' ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [debugStageTimePeriod, setDebugStageTimePeriod] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return STAGE_TIME_DEBUG_AUTO_VALUE;
    }

    try {
      return normalizeStageTimeDebugPeriod(localStorage.getItem(STAGE_TIME_DEBUG_STORAGE_KEY));
    } catch {
      return STAGE_TIME_DEBUG_AUTO_VALUE;
    }
  });
  const [debugStageRainVariant, setDebugStageRainVariant] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return STAGE_RAIN_DEBUG_AUTO_VALUE;
    }

    try {
      return normalizeStageRainDebugVariant(localStorage.getItem(STAGE_RAIN_DEBUG_STORAGE_KEY));
    } catch {
      return STAGE_RAIN_DEBUG_AUTO_VALUE;
    }
  });
  const [weatherRainVariant, setWeatherRainVariant] = useState(null); // Auto rain from weather API
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [debugCharacterPosition, setDebugCharacterPosition] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return { ...PET_CHARACTER_POSITION_DEFAULTS };
    }

    try {
      const savedPosition = JSON.parse(localStorage.getItem(PET_CHARACTER_POSITION_STORAGE_KEY));

      return {
        bottom: clampCharacterPositionValue('bottom', savedPosition?.bottom),
        shadowGap: clampCharacterPositionValue('shadowGap', savedPosition?.shadowGap),
        cameraArmX: clampCharacterPositionValue('cameraArmX', savedPosition?.cameraArmX),
        cameraArmTop: clampCharacterPositionValue('cameraArmTop', savedPosition?.cameraArmTop),
        cameraArmWidth: clampCharacterPositionValue('cameraArmWidth', savedPosition?.cameraArmWidth),
        cameraArmHeight: clampCharacterPositionValue('cameraArmHeight', savedPosition?.cameraArmHeight),
        cameraArmRotate: clampCharacterPositionValue('cameraArmRotate', savedPosition?.cameraArmRotate)
      };
    } catch {
      return { ...PET_CHARACTER_POSITION_DEFAULTS };
    }
  });
  const [debugThermometerPosition, setDebugThermometerPosition] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return { ...STAGE_THERMOMETER_POSITION_DEFAULTS };
    }

    try {
      const savedPosition = JSON.parse(localStorage.getItem(STAGE_THERMOMETER_POSITION_STORAGE_KEY));

      return {
        x: clampThermometerPositionValue('x', savedPosition?.x),
        y: clampThermometerPositionValue('y', savedPosition?.y),
        size: clampThermometerPositionValue('size', savedPosition?.size)
      };
    } catch {
      return { ...STAGE_THERMOMETER_POSITION_DEFAULTS };
    }
  });
  const [debugPetClickArea, setDebugPetClickArea] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return { ...PET_CLICK_AREA_DEBUG_DEFAULTS };
    }

    try {
      const savedClickArea = JSON.parse(localStorage.getItem(PET_CLICK_AREA_DEBUG_STORAGE_KEY));

      return {
        visible: savedClickArea?.visible === true,
        x: clampPetClickAreaDebugValue('x', savedClickArea?.x),
        y: clampPetClickAreaDebugValue('y', savedClickArea?.y),
        width: clampPetClickAreaDebugValue('width', savedClickArea?.width),
        height: clampPetClickAreaDebugValue('height', savedClickArea?.height)
      };
    } catch {
      return { ...PET_CLICK_AREA_DEBUG_DEFAULTS };
    }
  });
  const cameraPoseTimerRef = useRef(null);
  const cameraPickerFallbackTimerRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isCameraPoseActive, setIsCameraPoseActive] = useState(false);
  const [isPetCameraControlVisible, setIsPetCameraControlVisible] = useState(false);
  const [isPetCameraRefusalVisible, setIsPetCameraRefusalVisible] = useState(false);
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
  const [realTemperature, setRealTemperature] = useState(null);
  const [temperatureError, setTemperatureError] = useState(null);
  const [mosquitoes, setMosquitoes] = useState([]);
  const petStageRef = useRef(null);
  const mosquitoTimerRef = useRef(null);
  const mosquitoMotionTimersRef = useRef([]);
  const mosquitoesRef = useRef([]);
  const mosquitoEventActiveRef = useRef(false);
  const mosquitoEventTotalWavesRef = useRef(0);
  const mosquitoEventSpawnedWavesRef = useRef(0);
  const [mosquitoEventWaveInfo, setMosquitoEventWaveInfo] = useState({ total: 0, spawned: 0 });
  const [isMosquitoDebugOpen, setIsMosquitoDebugOpen] = useState(false);
  const [mosquitoDebugConfig, setMosquitoDebugConfig] = useState(() => {
    if (IS_PRODUCTION_MODE) {
      return { ...MOSQUITO_DEBUG_CONFIG_DEFAULTS };
    }

    try {
      const saved = localStorage.getItem(MOSQUITO_DEBUG_CONFIG_STORAGE_KEY);
      return saved
        ? normalizeMosquitoDebugConfig(JSON.parse(saved))
        : { ...MOSQUITO_DEBUG_CONFIG_DEFAULTS };
    } catch {
      return { ...MOSQUITO_DEBUG_CONFIG_DEFAULTS };
    }
  });
  const mosquitoDebugConfigRef = useRef(mosquitoDebugConfig);
  const [mosquitoEventTick, setMosquitoEventTick] = useState(0);
  const [petEvents, setPetEvents] = useState({});
  const petEventsRef = useRef({});
  const [isMosquitoEventCompletedToday, setIsMosquitoEventCompletedToday] = useState(false);
  const [isMosquitoEventForced, setIsMosquitoEventForced] = useState(false);
  const mosquitoEventCompletedRef = useRef(isMosquitoEventCompletedToday);
  const [petStatus, setPetStatus] = useState(() => ({
    health: DEFAULT_PET_STATUS.health,
    hunger: DEFAULT_PET_STATUS.hunger,
    sanity: DEFAULT_PET_STATUS.sanity
  }));
  const [lastStatusTickAt, setLastStatusTickAt] = useState(null);
  const petStatusRef = useRef(petStatus);
  const lastStatusTickAtRef = useRef(lastStatusTickAt);
  const [petItemModalCategory, setPetItemModalCategory] = useState(null);
  const [selectedPetUseItem, setSelectedPetUseItem] = useState(null);
  const [foodEffects, setFoodEffects] = useState([]);
  const [isFoodUseAnimating, setIsFoodUseAnimating] = useState(false);
  const [careEffects, setCareEffects] = useState([]);
  const [isCareUseAnimating, setIsCareUseAnimating] = useState(false);
  const [mosquitoBiteEffects, setMosquitoBiteEffects] = useState([]);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isMobileRainReduced, setIsMobileRainReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(STAGE_RAIN_MOBILE_QUERY).matches;
  });
  const isPetCharacterDebugEnabled = !IS_PRODUCTION_MODE;
  const debugAwakeningModeActive = isPetCharacterDebugEnabled ? debugAwakeningMode : 'auto';
  const activeIsSleeping = debugAwakeningModeActive === 'sleep' || debugAwakeningModeActive === 'awakening' || isSleeping;
  const activeIsAwakening = debugAwakeningModeActive === 'awakening' || isAwakening;
  const items = useMemo(() => {
    let itemList = activeTab === 'activity'
      ? activityItems
      : activeTab === 'moods'
        ? moodItems
        : PET_ITEM_CATEGORIES.includes(activeTab)
          ? petItems[activeTab]
          : (TAB_ITEMS[activeTab] ?? TAB_ITEMS.food);

    // When sleeping, move Bed item to the top of Care tab
    if (activeIsSleeping && activeTab === 'care' && Array.isArray(itemList)) {
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
  }, [activeIsSleeping, activeTab, activityItems, moodItems, petItems, currentActivityName, currentMoodName]);
  const petStatusRows = useMemo(() => createPetStatusRows(petStatus), [petStatus]);
  const petReaction = useMemo(() => {
    return getPetReaction(petStatus, biologicalClock);
  }, [petStatus, biologicalClock]);
  const hasPetItemFeedback = foodEffects.length > 0 || careEffects.length > 0 || isFoodUseAnimating || isCareUseAnimating;
  const petCharacterPresentation = useMemo(() => getPetCharacterPresentation({
    reactionLevel: petReaction.level,
    biologicalClock,
    isSleeping: activeIsSleeping,
    isAwakening: activeIsAwakening,
    hasItemFeedback: hasPetItemFeedback,
    thoughtBubbleVisible,
    entryWaveActive: petEntryWaveActive
  }), [
    biologicalClock,
    hasPetItemFeedback,
    activeIsAwakening,
    activeIsSleeping,
    petEntryWaveActive,
    petReaction.level,
    thoughtBubbleVisible
  ]);
  const activePetCharacterPresentation = debugCharacterPresentation || petCharacterPresentation;
  const activePetCharacterSpeed = debugCharacterPresentation?.speed
    || PET_CHARACTER_EFFECT_DURATIONS[activePetCharacterPresentation.effect]
    || PET_CHARACTER_EFFECT_DURATIONS.idle;

  const normalizedDebugStageTimePeriod = normalizeStageTimeDebugPeriod(debugStageTimePeriod);
  const activeTimePeriod = isPetCharacterDebugEnabled && normalizedDebugStageTimePeriod !== STAGE_TIME_DEBUG_AUTO_VALUE
    ? normalizedDebugStageTimePeriod
    : timePeriod;

  // Use real temperature if available, otherwise fallback to mock data
  const stageTemperature = realTemperature || (STAGE_TEMPERATURES[activeTimePeriod] || STAGE_TEMPERATURES.morning);

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(STAGE_RAIN_MOBILE_QUERY);
    const updateMobileRainMode = () => {
      setIsMobileRainReduced(mediaQuery.matches);
    };

    updateMobileRainMode();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMobileRainMode);
      return () => mediaQuery.removeEventListener('change', updateMobileRainMode);
    }

    mediaQuery.addListener(updateMobileRainMode);
    return () => mediaQuery.removeListener(updateMobileRainMode);
  }, []);

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
    cameraPhase === 'lowering' ? 'pet-character--camera-lowering' : '',
    isPetCharacterDebugEnabled && debugPetClickArea.visible ? 'pet-character--debug-click-area' : ''
  ].filter(Boolean).join(' ');
  const petCharacterShadowClassName = [
    'pet-character__shadow',
    `pet-character__shadow--${activePetCharacterPresentation.state}`,
    `pet-character__shadow--effect-${activePetCharacterPresentation.effect}`,
    isCameraPoseActive ? 'pet-character__shadow--camera-active' : ''
  ].filter(Boolean).join(' ');
  const normalizedDebugStageRainVariant = normalizeStageRainDebugVariant(debugStageRainVariant);
  const debugStageRainOverride = isPetCharacterDebugEnabled && normalizedDebugStageRainVariant !== STAGE_RAIN_DEBUG_AUTO_VALUE
    ? normalizedDebugStageRainVariant
    : null;
  const activeStageRainVariant = debugStageRainOverride === STAGE_RAIN_DEBUG_NONE_VALUE
    ? null
    : normalizeStageRainVariant(debugStageRainOverride || weatherRainVariant, null);
  const isRainWeatherActive = Boolean(activeStageRainVariant);
  const activeStageRainDrops = activeStageRainVariant
    ? STAGE_RAIN_DROPS_BY_VARIANT[activeStageRainVariant]
    : [];
  const visibleStageRainDrops = useMemo(() => {
    if (!isMobileRainReduced || !activeStageRainVariant) {
      return activeStageRainDrops;
    }

    const mobileLimit = STAGE_RAIN_MOBILE_DROP_LIMITS[activeStageRainVariant] || 36;
    const step = Math.max(1, Math.ceil(activeStageRainDrops.length / mobileLimit));

    return activeStageRainDrops.filter((_, index) => index % step === 0).slice(0, mobileLimit);
  }, [activeStageRainDrops, activeStageRainVariant, isMobileRainReduced]);
  const activeStageRainBackDrops = visibleStageRainDrops.filter((drop) => drop.z <= 3);
  const activeStageRainFrontDrops = visibleStageRainDrops.filter((drop) => drop.z > 3);

  // Split front drops into multiple zones scattered across stage
  const frontZoneCount = isMobileRainReduced ? 3 : 5; // Number of rain zones
  const frontDropsPerZone = Math.ceil(activeStageRainFrontDrops.length / frontZoneCount);
  const activeStageRainFrontZones = Array.from({ length: frontZoneCount }, (_, zoneIndex) => {
    const startIdx = zoneIndex * frontDropsPerZone;
    const endIdx = Math.min(startIdx + frontDropsPerZone, activeStageRainFrontDrops.length);
    const drops = activeStageRainFrontDrops.slice(startIdx, endIdx);

    // Deterministic position for each zone (spread evenly with overlap)
    const zoneLeft = (zoneIndex * 18) % 75; // 0%, 18%, 36%, 54%, 72%
    const zoneWidth = 25 + (zoneIndex * 7) % 30; // 25-55% varying widths

    // Create multiple vertical layers for each zone
    const layerCount = isMobileRainReduced ? 1 : 3; // Keep mobile rain light for responsive taps.
    const layers = Array.from({ length: layerCount }, (_, layerIndex) => {
      const topOffset = -150 + (layerIndex * 80); // -150px, -70px, 10px
      const bottomOffset = -20 + (layerIndex * 60); // -20px, 40px, 100px

      return {
        top: `${topOffset}px`,
        bottom: `${bottomOffset}px`,
        opacity: 0.78 - (layerIndex * 0.15) // Fade out as we go down
      };
    });

    return {
      drops,
      left: `${zoneLeft}%`,
      width: `${zoneWidth}%`,
      layers
    };
  }).filter(zone => zone.drops.length > 0);

  const activeStageRainOption = STAGE_RAIN_VARIANTS.find((variant) => variant.key === activeStageRainVariant);
  const activeStageRainLabel = activeStageRainOption?.label || (isWeatherLoading ? 'Đang kiểm tra thời tiết' : 'Không mưa');
  const petStageStyle = isPetCharacterDebugEnabled
    ? {
      '--pet-character-bottom': `${debugCharacterPosition.bottom}px`,
      '--pet-shadow-gap': `${debugCharacterPosition.shadowGap}px`,
      '--pet-camera-arm-x': `${debugCharacterPosition.cameraArmX}px`,
      '--pet-camera-arm-top': `${debugCharacterPosition.cameraArmTop}px`,
      '--pet-camera-arm-width': `${debugCharacterPosition.cameraArmWidth}px`,
      '--pet-camera-arm-height': `${debugCharacterPosition.cameraArmHeight}px`,
      '--pet-camera-arm-rotate': `${debugCharacterPosition.cameraArmRotate}deg`,
      '--pet-click-area-x': formatPetClickAreaPercent(debugPetClickArea.x),
      '--pet-click-area-y': formatPetClickAreaPercent(debugPetClickArea.y),
      '--pet-click-area-width': formatPetClickAreaPercent(debugPetClickArea.width),
      '--pet-click-area-height': formatPetClickAreaPercent(debugPetClickArea.height)
    }
    : undefined;
  const stageThermometerStyle = {
    '--stage-thermometer-fill': `${stageTemperature.fill}%`,
    '--stage-thermometer-x': `${debugThermometerPosition.x}px`,
    '--stage-thermometer-y': `${debugThermometerPosition.y}px`,
    '--stage-thermometer-scale': debugThermometerPosition.size / 100
  };
  const petDebugCssSnippet = useMemo(() => [
    '.pet-stage {',
    `  --pet-character-bottom: ${debugCharacterPosition.bottom}px;`,
    `  --pet-shadow-gap: ${debugCharacterPosition.shadowGap}px;`,
    `  --pet-camera-arm-x: ${debugCharacterPosition.cameraArmX}px;`,
    `  --pet-camera-arm-top: ${debugCharacterPosition.cameraArmTop}px;`,
    `  --pet-camera-arm-width: ${debugCharacterPosition.cameraArmWidth}px;`,
    `  --pet-camera-arm-height: ${debugCharacterPosition.cameraArmHeight}px;`,
    `  --pet-camera-arm-rotate: ${debugCharacterPosition.cameraArmRotate}deg;`,
    `  --pet-click-area-x: ${formatPetClickAreaPercent(debugPetClickArea.x)};`,
    `  --pet-click-area-y: ${formatPetClickAreaPercent(debugPetClickArea.y)};`,
    `  --pet-click-area-width: ${formatPetClickAreaPercent(debugPetClickArea.width)};`,
    `  --pet-click-area-height: ${formatPetClickAreaPercent(debugPetClickArea.height)};`,
    `  --stage-thermometer-x: ${debugThermometerPosition.x}px;`,
    `  --stage-thermometer-y: ${debugThermometerPosition.y}px;`,
    `  --stage-thermometer-scale: ${debugThermometerPosition.size / 100};`,
    '}'
  ].join('\n'), [debugCharacterPosition, debugPetClickArea, debugThermometerPosition]);

  const updateDebugStageTimePeriod = (period) => {
    if (IS_PRODUCTION_MODE) {
      return;
    }

    const nextPeriod = normalizeStageTimeDebugPeriod(period);
    setDebugStageTimePeriod(nextPeriod);

    try {
      localStorage.setItem(STAGE_TIME_DEBUG_STORAGE_KEY, nextPeriod);
    } catch { }
  };

  const updateDebugStageRainVariant = (variant) => {
    if (IS_PRODUCTION_MODE) {
      return;
    }

    const nextVariant = normalizeStageRainDebugVariant(variant);
    setDebugStageRainVariant(nextVariant);

    try {
      localStorage.setItem(STAGE_RAIN_DEBUG_STORAGE_KEY, nextVariant);
    } catch { }
  };

  const updateDebugCharacterPosition = (key, value) => {
    setDebugCharacterPosition((currentPosition) => {
      const nextPosition = {
        ...currentPosition,
        [key]: clampCharacterPositionValue(key, value)
      };

      try {
        localStorage.setItem(PET_CHARACTER_POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
      } catch { }

      return nextPosition;
    });
  };

  const resetDebugCharacterPosition = () => {
    setDebugCharacterPosition({ ...PET_CHARACTER_POSITION_DEFAULTS });

    try {
      localStorage.removeItem(PET_CHARACTER_POSITION_STORAGE_KEY);
    } catch { }
  };

  const updateDebugThermometerPosition = (key, value) => {
    setDebugThermometerPosition((currentPosition) => {
      const nextPosition = {
        ...currentPosition,
        [key]: clampThermometerPositionValue(key, value)
      };

      try {
        localStorage.setItem(STAGE_THERMOMETER_POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
      } catch { }

      return nextPosition;
    });
  };

  const resetDebugThermometerPosition = () => {
    setDebugThermometerPosition({ ...STAGE_THERMOMETER_POSITION_DEFAULTS });

    try {
      localStorage.removeItem(STAGE_THERMOMETER_POSITION_STORAGE_KEY);
    } catch { }
  };

  const updateDebugAwakeningMode = (mode) => {
    if (IS_PRODUCTION_MODE) {
      return;
    }

    const validMode = mode === 'sleep' || mode === 'awakening' ? mode : 'auto';
    setDebugAwakeningMode(validMode);
    setDebugCharacterPresentation(null);

    try {
      localStorage.setItem('pet-debug-awakening-mode', validMode);
    } catch { }

    // Apply state immediately
    if (validMode === 'auto') {
      // Reset to normal behavior - let other effects handle state
      setIsSleeping(false);
      setIsAwakening(false);
    } else if (validMode === 'sleep') {
      setIsSleeping(true);
      setIsAwakening(false);
    } else if (validMode === 'awakening') {
      setIsSleeping(true);
      setIsAwakening(true);
    }
  };

  const saveDebugPetClickArea = (nextClickArea) => {
    try {
      localStorage.setItem(PET_CLICK_AREA_DEBUG_STORAGE_KEY, JSON.stringify(nextClickArea));
    } catch { }
  };

  const updateDebugPetClickArea = (key, value) => {
    setDebugPetClickArea((currentClickArea) => {
      const nextClickArea = {
        ...currentClickArea,
        [key]: key === 'visible'
          ? Boolean(value)
          : clampPetClickAreaDebugValue(key, value)
      };

      saveDebugPetClickArea(nextClickArea);

      return nextClickArea;
    });
  };

  const resetDebugPetClickArea = () => {
    const nextClickArea = {
      ...PET_CLICK_AREA_DEBUG_DEFAULTS,
      visible: debugPetClickArea.visible
    };

    setDebugPetClickArea(nextClickArea);
    saveDebugPetClickArea(nextClickArea);
  };

  const savePetDebugCssSnapshot = () => {
    try {
      localStorage.setItem(PET_DEBUG_CSS_SNAPSHOT_STORAGE_KEY, petDebugCssSnippet);
      setDebugCssStatus('CSS saved');
    } catch {
      setDebugCssStatus('Save failed');
    }
  };

  const copyPetDebugCssSnapshot = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(petDebugCssSnippet);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = petDebugCssSnippet;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setDebugCssStatus('CSS copied');
    } catch {
      setDebugCssStatus('Copy failed');
    }
  };

  const updateMosquitoDebugConfig = (key, value) => {
    setMosquitoDebugConfig((current) => {
      const next = normalizeMosquitoDebugConfig({ ...current, [key]: value });
      if (key === 'mosquitoesPerSpawnMin' && value > next.mosquitoesPerSpawnMax) {
        next.mosquitoesPerSpawnMax = value;
      }
      if (key === 'mosquitoesPerSpawnMax' && value < next.mosquitoesPerSpawnMin) {
        next.mosquitoesPerSpawnMin = value;
      }
      if (key === 'spawnIntervalMinMs' && value > next.spawnIntervalMaxMs) {
        next.spawnIntervalMaxMs = value;
      }
      if (key === 'spawnIntervalMaxMs' && value < next.spawnIntervalMinMs) {
        next.spawnIntervalMinMs = value;
      }
      if (key === 'flightSpeedMinPxPerSec' && value > next.flightSpeedMaxPxPerSec) {
        next.flightSpeedMaxPxPerSec = value;
      }
      if (key === 'flightSpeedMaxPxPerSec' && value < next.flightSpeedMinPxPerSec) {
        next.flightSpeedMinPxPerSec = value;
      }
      if (key === 'holdDurationMinMs' && value > next.holdDurationMaxMs) {
        next.holdDurationMaxMs = value;
      }
      if (key === 'holdDurationMaxMs' && value < next.holdDurationMinMs) {
        next.holdDurationMinMs = value;
      }
      if (key === 'stageTopPercent' && value > next.stageBottomPercent) {
        next.stageBottomPercent = value;
      }
      if (key === 'stageBottomPercent' && value < next.stageTopPercent) {
        next.stageTopPercent = value;
      }
      if (key === 'stageLeftPercent' && value > next.stageRightPercent) {
        next.stageRightPercent = value;
      }
      if (key === 'stageRightPercent' && value < next.stageLeftPercent) {
        next.stageLeftPercent = value;
      }
      mosquitoDebugConfigRef.current = next;
      try {
        localStorage.setItem(MOSQUITO_DEBUG_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  const resetMosquitoDebugConfig = () => {
    const defaults = { ...MOSQUITO_DEBUG_CONFIG_DEFAULTS };
    mosquitoDebugConfigRef.current = defaults;
    setMosquitoDebugConfig(defaults);
    try {
      localStorage.removeItem(MOSQUITO_DEBUG_CONFIG_STORAGE_KEY);
    } catch { }
  };

  const syncMosquitoes = useCallback((updater) => {
    setMosquitoes((current) => {
      const next = updater(current);
      mosquitoesRef.current = next;
      return next;
    });
  }, []);

  const clearMosquitoMotionTimers = useCallback(() => {
    mosquitoMotionTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    mosquitoMotionTimersRef.current = [];
  }, []);

  const clearMosquitoSpawnTimer = useCallback(() => {
    if (mosquitoTimerRef.current) {
      clearTimeout(mosquitoTimerRef.current);
      mosquitoTimerRef.current = null;
    }
  }, []);

  const resetMosquitoEventRun = useCallback(() => {
    mosquitoEventActiveRef.current = false;
    mosquitoEventTotalWavesRef.current = 0;
    mosquitoEventSpawnedWavesRef.current = 0;
    setMosquitoEventWaveInfo({ total: 0, spawned: 0 });
    clearMosquitoSpawnTimer();
    clearMosquitoMotionTimers();
    syncMosquitoes(() => []);
    setMosquitoBiteEffects([]);
  }, [clearMosquitoMotionTimers, clearMosquitoSpawnTimer, syncMosquitoes]);

  const savePetEventsInBackground = useCallback((events) => {
    petSaveQueueRef.current = petSaveQueueRef.current
      .catch(() => {})
      .then(async () => {
        const result = await savePetEvents(events);
        if (!result.success) {
          console.warn('⚠️ Pet events sync failed:', result.message);
        }
      })
      .catch((error) => {
        console.warn('⚠️ Pet events sync failed:', error);
      });
  }, []);

  const updateMosquitoEventRecord = useCallback((mosquitoUpdates) => {
    const { clearedDate: _legacyClearedDate, ...currentMosquitoEvent } = petEventsRef.current.mosquito || {};
    const { clearedDate: _ignoredClearedDate, ...cleanMosquitoUpdates } = mosquitoUpdates;
    const nextEvents = {
      ...petEventsRef.current,
      mosquito: {
        ...currentMosquitoEvent,
        ...cleanMosquitoUpdates
      }
    };

    petEventsRef.current = nextEvents;
    setPetEvents(nextEvents);
    mosquitoEventCompletedRef.current = isMosquitoEventClearedToday(nextEvents);
    setIsMosquitoEventCompletedToday(mosquitoEventCompletedRef.current);
    savePetEventsInBackground(nextEvents);
  }, [savePetEventsInBackground]);

  const completeMosquitoEventToday = useCallback(() => {
    updateMosquitoEventRecord({
      completedAt: formatVietnamTimestamp(),
      totalWaves: mosquitoEventTotalWavesRef.current,
      spawnedWaves: mosquitoEventSpawnedWavesRef.current
    });
    setIsMosquitoEventForced(false);
    resetMosquitoEventRun();
  }, [resetMosquitoEventRun, updateMosquitoEventRecord]);

  const startMosquitoEventNow = useCallback(() => {
    if (isMosquitoEventForced) {
      // Turn off forced mode
      updateMosquitoEventRecord({
        completedAt: null,
        totalWaves: null,
        spawnedWaves: null,
        forcedAt: null
      });
      setIsMosquitoEventForced(false);
      resetMosquitoEventRun();
      setMosquitoEventTick((tick) => tick + 1);
    } else {
      // Turn on forced mode
      if (mosquitoDebugConfigRef.current.isEnabled === false) {
        const nextConfig = { ...mosquitoDebugConfigRef.current, isEnabled: true };
        mosquitoDebugConfigRef.current = nextConfig;
        setMosquitoDebugConfig(nextConfig);
      }
      updateMosquitoEventRecord({
        completedAt: null,
        totalWaves: null,
        spawnedWaves: null,
        forcedAt: formatVietnamTimestamp()
      });
      mosquitoEventCompletedRef.current = false;
      setIsMosquitoEventCompletedToday(false);
      setIsMosquitoEventForced(true);
      resetMosquitoEventRun();
      setMosquitoEventTick((tick) => tick + 1);
    }
  }, [isMosquitoEventForced, resetMosquitoEventRun, updateMosquitoEventRecord]);

  const addMosquitoMotionTimer = useCallback((callback, delay) => {
    const timerId = setTimeout(() => {
      mosquitoMotionTimersRef.current = mosquitoMotionTimersRef.current.filter((id) => id !== timerId);
      callback();
    }, delay);
    mosquitoMotionTimersRef.current.push(timerId);
  }, []);

  const handleMosquitoBiteEffectDone = useCallback((effectId) => {
    setMosquitoBiteEffects((current) => current.filter((effect) => effect.id !== effectId));
  }, []);

  const queueMosquitoBitePetSave = useCallback((updates) => {
    mosquitoBitePendingSaveRef.current = updates;

    if (mosquitoBiteSaveTimerRef.current) {
      window.clearTimeout(mosquitoBiteSaveTimerRef.current);
    }

    mosquitoBiteSaveTimerRef.current = window.setTimeout(() => {
      const pendingUpdates = mosquitoBitePendingSaveRef.current;
      mosquitoBitePendingSaveRef.current = null;
      mosquitoBiteSaveTimerRef.current = null;

      if (!pendingUpdates) {
        return;
      }

      petSaveQueueRef.current = petSaveQueueRef.current
        .catch(() => {})
        .then(async () => {
          const result = await savePet(pendingUpdates);
          if (!result.success) {
            console.warn('⚠️ Mosquito bite pet sync failed:', result.message);
          }
        })
        .catch((error) => {
          console.warn('⚠️ Mosquito bite pet sync failed:', error);
        });
    }, 700);
  }, []);

  const applyMosquitoBite = useCallback((mosquito) => {
    const isStillResting = mosquitoesRef.current.some((item) => (
      item.id === mosquito.id && item.phase === 'resting-on-pet' && !item.isDying
    ));

    if (!isStillResting) {
      console.log('🦟 Bite skipped: mosquito not resting', mosquito.id);
      return;
    }

    if (clampPetStatusValue(petStatusRef.current.health) <= 0) {
      console.log('🦟 Bite skipped: health already 0');
      return;
    }

    const biteId = `mosquito-bite-${mosquito.id}-${Date.now()}-${Math.random()}`;
    console.log('🦟 Bite applied!', {
      biteId,
      position: { x: mosquito.restX, y: mosquito.restY },
      currentHealth: petStatusRef.current.health
    });
    const config = mosquitoDebugConfigRef.current;
    setMosquitoBiteEffects((current) => ([
      ...current,
      {
        id: biteId,
        x: mosquito.restX,
        y: mosquito.restY,
        fontSizePx: config.biteEffectFontSizePx,
        floatHeightPx: config.biteEffectFloatHeightPx
      }
    ]).slice(-1));

    const currentStatus = petStatusRef.current;
    const nextStatus = {
      ...currentStatus,
      health: clampPetStatusValue(currentStatus.health - MOSQUITO_BITE_DAMAGE, { round: false })
    };
    const nextTickAt = formatVietnamTimestamp();

    petStatusRef.current = nextStatus;
    lastStatusTickAtRef.current = nextTickAt;
    setPetStatus(nextStatus);
    setLastStatusTickAt(nextTickAt);
    queueMosquitoBitePetSave({
      status: nextStatus,
      lastStatusTickAt: nextTickAt
    });
  }, [queueMosquitoBitePetSave]);

  const handleMosquitoTap = useCallback((mosquitoId, event, options = {}) => {
    const { shouldStopEvent = true, sourceElement = null } = options;

    if (shouldStopEvent) {
      event.stopPropagation();
      event.preventDefault();
    }

    const mosquito = mosquitoesRef.current.find((item) => item.id === mosquitoId);
    if (!mosquito || mosquito.isDying) {
      return;
    }

    const mosquitoElement = sourceElement || event.currentTarget.closest('.pet-mosquito') || event.currentTarget;
    const mosquitoRect = mosquitoElement.getBoundingClientRect();
    const stageRect = petStageRef.current?.getBoundingClientRect();
    const config = mosquitoDebugConfigRef.current;
    const stageBoundaryBottom = stageRect
      ? stageRect.top + (stageRect.height * Math.max(config.stageTopPercent, config.stageBottomPercent)) / 100
      : 0;
    const fallTargetY = Math.max(window.innerHeight || 0, stageBoundaryBottom) + 100;
    const visibleFallDistancePx = Math.max(260, Math.ceil(fallTargetY - mosquitoRect.top + mosquitoRect.height + 12));
    const removeFallDistancePx = visibleFallDistancePx + 180;
    const animationDurationMs = Math.min(
      MOSQUITO_KILL_MAX_ANIMATION_MS,
      Math.max(MOSQUITO_KILL_MIN_ANIMATION_MS, Math.round((removeFallDistancePx / MOSQUITO_KILL_FALL_SPEED_PX_PER_SEC) * 1000))
    );
    const killLeft = stageRect ? mosquitoRect.left - stageRect.left : mosquito.restX - (mosquitoRect.width / 2);
    const killTop = stageRect ? mosquitoRect.top - stageRect.top : mosquito.restY - (mosquitoRect.height / 2);
    const fallbackHitX = mosquitoRect.width / 2;
    const fallbackHitY = mosquitoRect.height / 2;
    const hitX = Number.isFinite(event.clientX) ? event.clientX - mosquitoRect.left : fallbackHitX;
    const hitY = Number.isFinite(event.clientY) ? event.clientY - mosquitoRect.top : fallbackHitY;

    syncMosquitoes((current) => current.map((item) => (
      item.id === mosquitoId
        ? {
          ...item,
          isDying: true,
          killLeft,
          killTop,
          killHitX: Math.round(Math.min(Math.max(hitX, 0), mosquitoRect.width)),
          killHitY: Math.round(Math.min(Math.max(hitY, 0), mosquitoRect.height)),
          killAnimationDurationMs: animationDurationMs,
          killFallVisibleDistancePx: visibleFallDistancePx,
          killFallDistancePx: removeFallDistancePx,
          killFallMidDistancePx: Math.round(visibleFallDistancePx * 0.58)
        }
        : item
    )));

    addMosquitoMotionTimer(() => {
      syncMosquitoes((current) => current.filter((item) => item.id !== mosquitoId));
    }, animationDurationMs);
  }, [addMosquitoMotionTimer, syncMosquitoes]);

  const handlePetStagePointerDownCapture = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const stageElement = petStageRef.current;
    if (!stageElement) {
      return;
    }

    const ignoredTarget = event.target.closest?.(
      'button, input, select, textarea, a, [role="button"], .pet-character-debug, .mosquito-debug'
    );

    if (ignoredTarget && !ignoredTarget.classList?.contains('pet-character__hit-area')) {
      return;
    }

    const mosquitoElements = Array.from(stageElement.querySelectorAll('.pet-mosquito:not(.pet-mosquito--dying)'));
    for (let index = mosquitoElements.length - 1; index >= 0; index -= 1) {
      const mosquitoElement = mosquitoElements[index];
      const buzzElement = mosquitoElement.querySelector('.pet-mosquito__buzz');
      const hitRect = (buzzElement || mosquitoElement).getBoundingClientRect();
      const isInside = (
        event.clientX >= hitRect.left &&
        event.clientX <= hitRect.right &&
        event.clientY >= hitRect.top &&
        event.clientY <= hitRect.bottom
      );

      if (!isInside) {
        continue;
      }

      const mosquitoId = mosquitoElement.dataset.mosquitoId;
      if (mosquitoId) {
        handleMosquitoTap(mosquitoId, event, {
          shouldStopEvent: false,
          sourceElement: mosquitoElement
        });
      }
      return;
    }
  }, [handleMosquitoTap]);

  const getMosquitoFlightBounds = useCallback((config = mosquitoDebugConfigRef.current) => {
    const stageElement = petStageRef.current;
    const stageWidth = Math.max(1, stageElement?.clientWidth || window.innerWidth || 1);
    const stageHeight = Math.max(1, stageElement?.clientHeight || window.innerHeight || 1);
    const stageStyles = stageElement ? window.getComputedStyle(stageElement) : null;
    const rawCharacterScale = Number.parseFloat(stageStyles?.getPropertyValue('--pet-character-scale'));
    const characterScale = Number.isFinite(rawCharacterScale) ? rawCharacterScale : 1;
    const mosquitoScale = Math.max(0.01, Math.min(2.2, (config.sizePercent || 100) / 100));
    const mosquitoHalfWidthPx = Math.round(24 * mosquitoScale);
    const mosquitoHalfHeightPx = Math.round(21 * mosquitoScale);
    const mosquitoVisualOverflowPx = Math.round(10 * mosquitoScale);
    const rawLeft = (stageWidth * config.stageLeftPercent) / 100;
    const rawRight = (stageWidth * config.stageRightPercent) / 100;
    const rawTop = (stageHeight * config.stageTopPercent) / 100;
    const rawBottom = (stageHeight * config.stageBottomPercent) / 100;
    const boundaryLeft = Math.min(rawLeft, rawRight);
    const boundaryRight = Math.max(rawLeft, rawRight);
    const boundaryTop = Math.min(rawTop, rawBottom);
    const boundaryBottom = Math.max(rawTop, rawBottom);
    const leftEdge = boundaryLeft + mosquitoHalfWidthPx;
    const rightEdge = boundaryRight - mosquitoHalfWidthPx;
    const topEdge = boundaryTop + mosquitoHalfHeightPx;
    const bottomEdge = boundaryBottom - mosquitoHalfHeightPx;
    const right = Math.max(leftEdge, rightEdge);
    const bottom = Math.max(topEdge, bottomEdge);
    const outsideOffsetX = mosquitoHalfWidthPx + mosquitoVisualOverflowPx + 4;

    return {
      left: Math.min(leftEdge, right),
      right,
      top: Math.min(topEdge, bottom),
      bottom,
      entryLeft: boundaryLeft - outsideOffsetX,
      entryRight: boundaryRight + outsideOffsetX,
      pathLeft: boundaryLeft - outsideOffsetX,
      pathRight: boundaryRight + outsideOffsetX,
      pathTop: 0,
      pathBottom: stageHeight,
      stageWidth,
      stageHeight,
      characterScale
    };
  }, []);

  const createMosquitoPathD = useCallback((points, bounds) => {
    if (points.length < 2) {
      const point = points[0] || { x: bounds.left, y: bounds.top };
      return `M ${formatMosquitoPathNumber(point.x)} ${formatMosquitoPathNumber(point.y)}`;
    }

    const pathLeft = bounds.pathLeft ?? bounds.left;
    const pathRight = bounds.pathRight ?? bounds.right;
    const pathTop = bounds.pathTop ?? bounds.top;
    const pathBottom = bounds.pathBottom ?? bounds.bottom;
    const clampX = (value) => formatMosquitoPathNumber(clampMosquitoRouteValue(value, pathLeft, pathRight));
    const clampY = (value) => formatMosquitoPathNumber(clampMosquitoRouteValue(value, pathTop, pathBottom));
    const path = [`M ${clampX(points[0].x)} ${clampY(points[0].y)}`];
    const tension = 0.38;

    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] || points[index];
      const current = points[index];
      const next = points[index + 1];
      const afterNext = points[index + 2] || next;
      const controlOne = {
        x: current.x + (next.x - previous.x) * tension / 6,
        y: current.y + (next.y - previous.y) * tension / 6
      };
      const controlTwo = {
        x: next.x - (afterNext.x - current.x) * tension / 6,
        y: next.y - (afterNext.y - current.y) * tension / 6
      };

      path.push(
        `C ${clampX(controlOne.x)} ${clampY(controlOne.y)} ` +
        `${clampX(controlTwo.x)} ${clampY(controlTwo.y)} ` +
        `${clampX(next.x)} ${clampY(next.y)}`
      );
    }

    return path.join(' ');
  }, []);

  const createMosquitoRoute = useCallback((config, entrySide = (Math.random() < 0.5 ? 'left' : 'right'), seedY = null) => {
    const bounds = getMosquitoFlightBounds(config);
    const startY = seedY === null
      ? bounds.top + Math.random() * Math.max(0, bounds.bottom - bounds.top)
      : Math.min(bounds.bottom, Math.max(bounds.top, seedY));
    const startX = entrySide === 'left' ? bounds.entryLeft : bounds.entryRight;
    const approachDirection = entrySide === 'left' ? 1 : -1;
    const width = Math.max(1, bounds.right - bounds.left);
    const height = Math.max(1, bounds.bottom - bounds.top);
    const characterScale = Math.max(0.01, bounds.characterScale ?? 1);
    const clickAreaBounds = getPetClickAreaPixelBounds(debugPetClickArea);
    const clickAreaWidth = Math.max(0, clickAreaBounds.width);
    const clickAreaHeight = Math.max(1, clickAreaBounds.height);
    const visualClickAreaWidth = clickAreaWidth * characterScale;
    const visualClickAreaHeight = clickAreaHeight * characterScale;
    const petOriginX = bounds.stageWidth / 2;
    const petOriginY = bounds.stageHeight - debugCharacterPosition.bottom;
    const clickAreaLeft = petOriginX + (clickAreaBounds.x - (clickAreaWidth / 2)) * characterScale;
    const clickAreaTop = petOriginY - (PET_CHARACTER_BASE_HEIGHT * characterScale) + (clickAreaBounds.y * characterScale);
    const restX = clampMosquitoRouteValue(
      clickAreaWidth === 0 ? clickAreaLeft : clickAreaLeft + Math.random() * visualClickAreaWidth,
      bounds.pathLeft,
      bounds.pathRight
    );
    const restY = clampMosquitoRouteValue(
      clickAreaTop + Math.random() * visualClickAreaHeight,
      bounds.pathTop,
      bounds.pathBottom
    );
    const curveAmount = Math.max(0.1, Math.min(0.9, (config.curveAmountPercent || 56) / 100));
    const safeTop = bounds.top + Math.min(14, height * 0.12);
    const safeBottom = bounds.bottom - Math.min(14, height * 0.12);
    const approachSegmentCount = 4 + Math.floor(Math.random() * 3);
    const exitSegmentCount = 5 + Math.floor(Math.random() * 3);
    const waveCount = 1.15 + curveAmount * 2.25 + Math.random() * 0.75;
    const wavePhase = Math.random() * Math.PI * 2;
    const driftY = (Math.random() - 0.5) * height * (0.08 + curveAmount * 0.34);
    const amplitude = Math.min(height * (0.08 + curveAmount * 0.2), 8 + curveAmount * 28 + Math.random() * 12);
    const buildLegPoints = (from, to, segmentCount, phaseShift = 0, segmentDirection = approachDirection) => {
      const points = [{ x: from.x, y: from.y }];

      for (let index = 1; index < segmentCount; index += 1) {
        const progress = index / segmentCount;
        const progressJitter = (Math.random() - 0.5) * (0.22 / segmentCount);
        const baseX = from.x + (to.x - from.x) * progress;
        const baseY = from.y + (to.y - from.y) * progress;
        const legHeight = Math.max(1, Math.abs(to.y - from.y) + height * 0.42);
        const legAmplitude = Math.min(legHeight * (0.08 + curveAmount * 0.16), 7 + curveAmount * 22 + Math.random() * 8);
        const waveY = Math.sin((progress + phaseShift) * Math.PI * 2 * waveCount + wavePhase) * legAmplitude;
        const flutterY = Math.sin((progress + phaseShift) * Math.PI * 2 * (waveCount * 2.4) + wavePhase * 0.7) * legAmplitude * (0.1 + curveAmount * 0.2);
        const x = clampMosquitoRouteValue(
          baseX + segmentDirection * width * progressJitter,
          bounds.pathLeft,
          bounds.pathRight
        );
        const y = clampMosquitoRouteValue(
          baseY + driftY * progress * 0.3 + waveY + flutterY + (Math.random() - 0.5) * height * (0.02 + curveAmount * 0.06),
          bounds.pathTop,
          bounds.pathBottom
        );

        points.push({ x, y });
      }

      points.push({ x: to.x, y: to.y });

      return points;
    };

    const shouldReverseAfterRest = Math.random() < 0.5;
    const exitSide = shouldReverseAfterRest
      ? entrySide
      : (entrySide === 'left' ? 'right' : 'left');
    const exitX = exitSide === 'left' ? bounds.entryLeft : bounds.entryRight;
    const exitDirection = exitX >= restX ? 1 : -1;
    const exitY = clampMosquitoRouteValue(
      restY + driftY + Math.sin(Math.PI * 2 * waveCount + wavePhase) * amplitude * 0.35,
      safeTop,
      safeBottom
    );
    const approachPoints = buildLegPoints(
      { x: startX, y: startY },
      { x: restX, y: restY },
      approachSegmentCount
    );
    const exitPoints = buildLegPoints(
      { x: restX, y: restY },
      { x: exitX, y: exitY },
      exitSegmentCount,
      0.41,
      exitDirection
    );
    const approachPathD = createMosquitoPathD(approachPoints, bounds);
    const exitPathD = createMosquitoPathD(exitPoints, bounds);
    const getPointDistance = (points) => points.reduce((distance, point, index) => {
      const previous = points[index - 1];

      if (!previous) {
        return distance;
      }

      return distance + Math.hypot(point.x - previous.x, point.y - previous.y);
    }, 0);

    const getFlightTiltDeg = (from, to, segmentDirection) => {
      const pathRise = to.y - from.y;
      const pathRun = Math.max(1, Math.abs(to.x - from.x));

      return formatMosquitoPathNumber(
        clampMosquitoRouteValue(Math.atan2(pathRise, pathRun) * (180 / Math.PI) * segmentDirection, -32, 32)
      );
    };

    return {
      startX,
      startY,
      exitX,
      exitY,
      restX,
      restY,
      approachPathD,
      exitPathD,
      approachDistancePx: getPointDistance(approachPoints),
      exitDistancePx: getPointDistance(exitPoints),
      pathD: `${approachPathD} ${exitPathD}`,
      buzzDurationMs: config.bodyBuzzDurationMs,
      buzzX: config.bodyBuzzX,
      buzzY: config.bodyBuzzY,
      buzzRotateDeg: config.bodyBuzzRotateDeg,
      facingScaleX: approachDirection > 0 ? -1 : 1,
      exitFacingScaleX: exitDirection > 0 ? -1 : 1,
      flightTiltDeg: getFlightTiltDeg({ x: startX, y: startY }, { x: restX, y: restY }, approachDirection),
      exitFlightTiltDeg: getFlightTiltDeg({ x: restX, y: restY }, { x: exitX, y: exitY }, exitDirection),
      entrySide,
      exitSide,
      exitMode: shouldReverseAfterRest ? 'reverse' : 'continue'
    };
  }, [createMosquitoPathD, debugCharacterPosition.bottom, debugPetClickArea, getMosquitoFlightBounds]);

  const getRandomMosquitoFlightSpeed = useCallback((config = mosquitoDebugConfigRef.current) => {
    const configSpeedMin = config.flightSpeedMinPxPerSec ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.flightSpeedMinPxPerSec;
    const configSpeedMax = config.flightSpeedMaxPxPerSec ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.flightSpeedMaxPxPerSec;
    const speedMin = Math.min(configSpeedMin, configSpeedMax);
    const speedMax = Math.max(configSpeedMin, configSpeedMax);

    return Math.round(speedMin + Math.random() * Math.max(0, speedMax - speedMin));
  }, []);

  const getRandomMosquitoHoldDuration = useCallback((config = mosquitoDebugConfigRef.current) => {
    const configHoldMin = config.holdDurationMinMs ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.holdDurationMinMs;
    const configHoldMax = config.holdDurationMaxMs ?? MOSQUITO_DEBUG_CONFIG_DEFAULTS.holdDurationMaxMs;
    const holdMin = Math.min(configHoldMin, configHoldMax);
    const holdMax = Math.max(configHoldMin, configHoldMax);

    return Math.round(holdMin + Math.random() * Math.max(0, holdMax - holdMin));
  }, []);

  const createMosquitoMotionTiming = useCallback((config = mosquitoDebugConfigRef.current, route = {}) => {
    const flightSpeedPxPerSec = getRandomMosquitoFlightSpeed(config);
    const approachDistancePx = Math.max(1, route.approachDistancePx || 1);
    const exitDistancePx = Math.max(1, route.exitDistancePx || 1);
    const approachDurationMs = Math.max(450, Math.round((approachDistancePx / flightSpeedPxPerSec) * 1000));
    const exitDurationMs = Math.max(450, Math.round((exitDistancePx / flightSpeedPxPerSec) * 1000));

    return {
      flightDurationMs: approachDurationMs + exitDurationMs,
      flightSpeedPxPerSec,
      approachDurationMs,
      holdDurationMs: getRandomMosquitoHoldDuration(config),
      exitDurationMs
    };
  }, [getRandomMosquitoFlightSpeed, getRandomMosquitoHoldDuration]);

  const scheduleMosquitoLifecycle = useCallback((mosquito) => {
    addMosquitoMotionTimer(() => {
      syncMosquitoes((current) => current.map((item) => (
        item.id === mosquito.id && !item.isDying ? { ...item, phase: 'flying-to-pet' } : item
      )));
    }, 16);

    addMosquitoMotionTimer(() => {
      syncMosquitoes((current) => current.map((item) => (
        item.id === mosquito.id && !item.isDying ? { ...item, phase: 'resting-on-pet' } : item
      )));
    }, mosquito.approachDurationMs + 40);

    const biteTimers = [];
    for (
      let biteOffset = MOSQUITO_BITE_START_DELAY_MS;
      biteOffset < mosquito.holdDurationMs;
      biteOffset += MOSQUITO_BITE_TICK_MS
    ) {
      biteTimers.push(biteOffset);
      addMosquitoMotionTimer(() => {
        applyMosquitoBite(mosquito);
      }, mosquito.approachDurationMs + 40 + biteOffset);
    }
    console.log('🦟 Mosquito motion started:', {
      id: mosquito.id,
      holdDurationMs: mosquito.holdDurationMs,
      biteStartDelay: MOSQUITO_BITE_START_DELAY_MS,
      biteTickMs: MOSQUITO_BITE_TICK_MS,
      biteTimersScheduled: biteTimers.length,
      biteTimers
    });

    addMosquitoMotionTimer(() => {
      syncMosquitoes((current) => current.map((item) => (
        item.id === mosquito.id && !item.isDying ? { ...item, phase: 'flying-away' } : item
      )));
    }, mosquito.approachDurationMs + mosquito.holdDurationMs + 40);

    addMosquitoMotionTimer(() => {
      syncMosquitoes((current) => current.filter((item) => item.id !== mosquito.id));
    }, mosquito.approachDurationMs + mosquito.holdDurationMs + mosquito.exitDurationMs + 120);
  }, [addMosquitoMotionTimer, applyMosquitoBite, syncMosquitoes]);

  const spawnMosquitoWave = useCallback(() => {
    const config = mosquitoDebugConfigRef.current;
    const availableSlots = Math.max(0, config.maxMosquitoes - mosquitoesRef.current.length);

    if (
      !mosquitoEventActiveRef.current ||
      mosquitoEventCompletedRef.current ||
      mosquitoEventSpawnedWavesRef.current >= mosquitoEventTotalWavesRef.current ||
      availableSlots <= 0
    ) {
      return;
    }

    const spawnMin = Math.max(1, Math.min(config.mosquitoesPerSpawnMin, config.mosquitoesPerSpawnMax));
    const spawnMax = Math.max(spawnMin, Math.max(config.mosquitoesPerSpawnMin, config.mosquitoesPerSpawnMax));
    const mosquitoesThisSpawn = Math.min(
      availableSlots,
      spawnMin + Math.floor(Math.random() * (spawnMax - spawnMin + 1))
    );
    const newMosquitoes = Array.from({ length: mosquitoesThisSpawn }, () => {
      const mosquitoId = `mosquito-${Date.now()}-${Math.random()}`;
      const route = createMosquitoRoute(config);

      return {
        id: mosquitoId,
        ...route,
        ...createMosquitoMotionTiming(config, route),
        phase: 'spawning'
      };
    });

    if (!newMosquitoes.length) {
      return;
    }

    mosquitoEventSpawnedWavesRef.current += 1;
    setMosquitoEventWaveInfo({
      total: mosquitoEventTotalWavesRef.current,
      spawned: mosquitoEventSpawnedWavesRef.current
    });
    syncMosquitoes((current) => [...current, ...newMosquitoes].slice(0, config.maxMosquitoes));
    newMosquitoes.forEach(scheduleMosquitoLifecycle);
  }, [
    createMosquitoMotionTiming,
    createMosquitoRoute,
    scheduleMosquitoLifecycle,
    syncMosquitoes
  ]);

  const scheduleNextMosquitoWave = useCallback(() => {
    if (
      mosquitoTimerRef.current ||
      !mosquitoEventActiveRef.current ||
      mosquitoEventCompletedRef.current ||
      mosquitoEventSpawnedWavesRef.current >= mosquitoEventTotalWavesRef.current
    ) {
      return;
    }

    const config = mosquitoDebugConfigRef.current;
    const delay = config.spawnIntervalMinMs +
      Math.random() * Math.max(0, config.spawnIntervalMaxMs - config.spawnIntervalMinMs);

    mosquitoTimerRef.current = setTimeout(() => {
      mosquitoTimerRef.current = null;
      spawnMosquitoWave();
    }, delay);
  }, [spawnMosquitoWave]);

  const selectedPetUsePreview = useMemo(() => (
    selectedPetUseItem
      ? getPetItemUsePreview(selectedPetUseItem.category, petStatus, selectedPetUseItem.item.shape, selectedPetUseItem.item.name)
      : null
  ), [selectedPetUseItem, petStatus]);

  useEffect(() => {
    petStatusRef.current = petStatus;
  }, [petStatus]);

  useEffect(() => {
    lastStatusTickAtRef.current = lastStatusTickAt;
  }, [lastStatusTickAt]);

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
  const mosquitoEventStatus = useMemo(() => {
    if (isMosquitoEventCompletedToday && !isMosquitoEventForced) {
      return 'Completed today';
    }

    if (mosquitoEventActiveRef.current) {
      const spawnedWaves = mosquitoEventSpawnedWavesRef.current;
      const totalWaves = mosquitoEventTotalWavesRef.current || '?';
      return `${isMosquitoEventForced ? 'Forced' : 'Running'} ${spawnedWaves}/${totalWaves}`;
    }

    if (isMosquitoEventForced) {
      return 'Forced pending';
    }

    return isMosquitoEventWindow() ? 'Ready now' : 'Waiting for event window';
  }, [isMosquitoEventCompletedToday, isMosquitoEventForced, mosquitoEventTick, mosquitoes.length]);

  // Generate fixed star positions (only once)
  const starPositions = useMemo(() => (
    Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 60,
      delay: Math.random() * 3
    }))
  ), []);

useEffect(() => {
  if (!isPetReady || entryWaveStartedRef.current || activeIsSleeping || activeIsAwakening) return undefined;

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
}, [activeIsAwakening, activeIsSleeping, isPetReady]);

// Load initial data from NocoDB
useEffect(() => {
  const loadInitialData = async () => {
    try {
      setIsWeatherLoading(true);

      const petPromise = fetchPet().catch((error) => {
        console.warn('Failed to fetch pet data:', error);
        return null;
      });
      const petEventsPromise = fetchPetEvents().catch((error) => {
        console.warn('Failed to fetch pet events:', error);
        return null;
      });
      const weatherPromise = getCurrentWeatherWithRain().catch((error) => {
        console.warn('Failed to fetch real weather, using fallback:', error);
        return null;
      });
      const statusPromise = fetchStatus().catch((error) => {
        console.warn('Failed to fetch status data:', error);
        return null;
      });

      // Fetch pet data (food, care inventory, and status)
      const petData = await petPromise;
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

          petStatusRef.current = decayedPet.status;
          lastStatusTickAtRef.current = decayedPet.lastStatusTickAt;
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

      const loadedPetEvents = await petEventsPromise;
      if (loadedPetEvents) {
        const normalizedPetEvents = loadedPetEvents && typeof loadedPetEvents === 'object' ? loadedPetEvents : {};
        petEventsRef.current = normalizedPetEvents;
        setPetEvents(normalizedPetEvents);
        const mosquitoCompletedToday = isMosquitoEventClearedToday(normalizedPetEvents);
        mosquitoEventCompletedRef.current = mosquitoCompletedToday;
        setIsMosquitoEventCompletedToday(mosquitoCompletedToday);
      }

      // Fetch real weather from Open-Meteo API before showing the pet stage.
      const weatherData = await weatherPromise;
      if (weatherData) {
        setRealTemperature({
          value: Math.round(weatherData.temperature),
          fill: calculateThermometerFill(weatherData.temperature),
          unit: weatherData.unit,
          location: weatherData.location
        });
        setWeatherRainVariant(weatherData.rainVariant);
        setTemperatureError(null);
      } else {
        setWeatherRainVariant(null);
        setTemperatureError('Weather unavailable');
      }
      setIsWeatherLoading(false);

      // Fetch status data (activities, moods, location)
      const statusData = await statusPromise;
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
      setIsWeatherLoading(false);
      setIsDataLoaded(true);
      setIsPetReady(true);
    }
  };

  loadInitialData();
}, []);

// Refresh real weather every 3 minutes
useEffect(() => {
  if (!realTemperature) return undefined; // Only refresh if initial fetch succeeded

  const refreshWeather = async () => {
    try {
      const weatherData = await getCurrentWeatherWithRain({ allowCache: false });
      setRealTemperature({
        value: Math.round(weatherData.temperature),
        fill: calculateThermometerFill(weatherData.temperature),
        unit: weatherData.unit,
        location: weatherData.location
      });
      setWeatherRainVariant(weatherData.rainVariant);
      setTemperatureError(null);
    } catch (error) {
      console.warn('Failed to refresh weather:', error);
      // Keep existing weather on refresh failure
    }
  };

  const intervalId = setInterval(refreshWeather, 3 * 60 * 1000); // 3 minutes

  return () => clearInterval(intervalId);
}, [realTemperature]);

useEffect(() => {
  mosquitoDebugConfigRef.current = mosquitoDebugConfig;

  if (!mosquitoDebugConfig.isEnabled) {
    resetMosquitoEventRun();
    return;
  }

  const updatedMosquitoes = mosquitoesRef.current
    .slice(0, mosquitoDebugConfig.maxMosquitoes)
    .map((mosquito) => {
      const route = createMosquitoRoute(
        mosquitoDebugConfig,
        mosquito.entrySide,
        mosquito.phase === 'flying-away' ? mosquito.exitY : mosquito.startY
      );

      return {
        ...mosquito,
        ...route,
        ...createMosquitoMotionTiming(mosquitoDebugConfig, route),
        phase: 'spawning'
      };
    });

  mosquitoesRef.current = updatedMosquitoes;
  setMosquitoes(updatedMosquitoes);
  clearMosquitoMotionTimers();

  updatedMosquitoes.forEach(scheduleMosquitoLifecycle);
}, [
  clearMosquitoMotionTimers,
  createMosquitoMotionTiming,
  createMosquitoRoute,
  mosquitoDebugConfig,
  resetMosquitoEventRun,
  scheduleMosquitoLifecycle,
  syncMosquitoes
]);

// Mosquito daily event window
useEffect(() => {
  const intervalId = window.setInterval(() => {
    setMosquitoEventTick((tick) => tick + 1);
  }, 60 * 1000);

  return () => window.clearInterval(intervalId);
}, []);

useEffect(() => {
  if (isMosquitoEventForced) {
    return;
  }

  const completedToday = isMosquitoEventClearedToday(petEventsRef.current);
  mosquitoEventCompletedRef.current = completedToday;
  setIsMosquitoEventCompletedToday(completedToday);
}, [isMosquitoEventForced, mosquitoEventTick, petEvents]);

useEffect(() => {
  const shouldRunMosquitoEvent = (
    isPetReady &&
    isPageVisible &&
    mosquitoDebugConfig.isEnabled &&
    !isMosquitoEventCompletedToday &&
    (isMosquitoEventForced || isMosquitoEventWindow())
  );

  if (!shouldRunMosquitoEvent) {
    resetMosquitoEventRun();
    return undefined;
  }

  if (!mosquitoEventActiveRef.current) {
    mosquitoEventActiveRef.current = true;
    const config = mosquitoDebugConfigRef.current;
    mosquitoEventTotalWavesRef.current = randomBetween(config.eventWavesMin, config.eventWavesMax);
    mosquitoEventSpawnedWavesRef.current = 0;
    setMosquitoEventWaveInfo({
      total: mosquitoEventTotalWavesRef.current,
      spawned: 0
    });
    console.log('🦟 Mosquito event started:', {
      totalWaves: mosquitoEventTotalWavesRef.current,
      window: `${MOSQUITO_EVENT_EVENING_START_HOUR}:00-${MOSQUITO_EVENT_EVENING_END_HOUR}:59 & ${MOSQUITO_EVENT_NIGHT_START_HOUR}:00-${MOSQUITO_EVENT_NIGHT_END_HOUR}:59`
    });
  }

  if (mosquitoesRef.current.length === 0) {
    scheduleNextMosquitoWave();
  }

  return undefined;
}, [
  isMosquitoEventCompletedToday,
  isPageVisible,
  isPetReady,
  mosquitoDebugConfig.isEnabled,
  isMosquitoEventForced,
  mosquitoEventTick,
  resetMosquitoEventRun,
  scheduleNextMosquitoWave
]);

useEffect(() => {
  if (
    !mosquitoEventActiveRef.current ||
    isMosquitoEventCompletedToday ||
    !isPetReady ||
    !isPageVisible ||
    !mosquitoDebugConfig.isEnabled ||
    (!isMosquitoEventForced && !isMosquitoEventWindow()) ||
    mosquitoes.length > 0
  ) {
    return undefined;
  }

  if (
    mosquitoEventTotalWavesRef.current > 0 &&
    mosquitoEventSpawnedWavesRef.current >= mosquitoEventTotalWavesRef.current
  ) {
    completeMosquitoEventToday();
    return undefined;
  }

  scheduleNextMosquitoWave();
  return undefined;
}, [
  completeMosquitoEventToday,
  isMosquitoEventCompletedToday,
  isPageVisible,
  isPetReady,
  isMosquitoEventForced,
  mosquitoes.length,
  mosquitoDebugConfig.isEnabled,
  mosquitoEventTick,
  scheduleNextMosquitoWave
]);

useEffect(() => () => {
  if (mosquitoTimerRef.current) {
    clearTimeout(mosquitoTimerRef.current);
  }
  clearMosquitoMotionTimers();
}, [clearMosquitoMotionTimers]);

useEffect(() => {
  const handleResize = () => {
    const config = mosquitoDebugConfigRef.current;
    syncMosquitoes((current) => current.map((mosquito) => ({
      ...mosquito,
      ...createMosquitoRoute(
        config,
        mosquito.entrySide,
        mosquito.phase === 'flying-away' ? mosquito.exitY : mosquito.startY
      )
    })));
  };

  window.addEventListener('resize', handleResize);

  return () => window.removeEventListener('resize', handleResize);
}, [createMosquitoRoute, syncMosquitoes]);

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
    const syncElapsedPetStatus = () => {
      const decayedPet = calculatePetStatusDecay(
        petStatusRef.current,
        lastStatusTickAtRef.current
      );

      petStatusRef.current = decayedPet.status;
      lastStatusTickAtRef.current = decayedPet.lastStatusTickAt;
      setPetStatus(decayedPet.status);
      setLastStatusTickAt(decayedPet.lastStatusTickAt);

      if (decayedPet.shouldSave) {
        savePet({
          status: decayedPet.status,
          lastStatusTickAt: decayedPet.lastStatusTickAt
        }).catch((error) => {
          console.warn('⚠️ Pet status exit sync failed:', error);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        syncElapsedPetStatus();
      }

      setIsPageVisible(!document.hidden);
    };

    const handlePageHide = () => {
      syncElapsedPetStatus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Smart thought bubble with status-based timing
  useEffect(() => {
    // Don't show bubble when sleeping or awakening
    if (activeIsSleeping || activeIsAwakening) {
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
  }, [activeIsAwakening, activeIsSleeping, isPageVisible, petReaction.level]);

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
    if (mosquitoBiteSaveTimerRef.current) {
      window.clearTimeout(mosquitoBiteSaveTimerRef.current);
      mosquitoBiteSaveTimerRef.current = null;
      mosquitoBitePendingSaveRef.current = null;
    }
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
    const nextTickAt = formatVietnamTimestamp();
    const usedPetItem = selectedPetUseItem;

    petStatusRef.current = nextStatus;
    lastStatusTickAtRef.current = nextTickAt;
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
    if (!activeIsAwakening) return;

    console.log('👆 User tapped to wake up pet');
    if (debugAwakeningMode !== 'auto') {
      updateDebugAwakeningMode('auto');
      return;
    }

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

  const showCriticalPetCameraRefusal = () => {
    setIsPetCameraControlVisible(false);
    setIsPetCameraRefusalVisible(true);
    setCameraPhase('idle');
    setIsCameraPoseActive(false);
    resetCameraInput();

    if (cameraPoseTimerRef.current) {
      window.clearTimeout(cameraPoseTimerRef.current);
      cameraPoseTimerRef.current = null;
    }
    if (cameraPickerFallbackTimerRef.current) {
      window.clearTimeout(cameraPickerFallbackTimerRef.current);
      cameraPickerFallbackTimerRef.current = null;
    }
  };

  const lowerPetCameraPose = () => {
    setIsPetCameraControlVisible(false);
    setIsPetCameraRefusalVisible(false);

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

  const isPetCameraBaseDisabled = activeIsSleeping || activeIsAwakening || isPetPhotoModalOpen || isSavingPetPhoto;
  const isPetCameraReady = cameraPhase === 'capturing';
  const isPetCameraBusy = cameraPhase !== 'idle';
  const isPetCameraSleepBlocked = activeIsSleeping
    || activePetCharacterPresentation.state === PET_CHARACTER_STATES.sleeping;
  const isPetCameraCriticalBlocked = petReaction.level === 'critical'
    || activePetCharacterPresentation.state === PET_CHARACTER_STATES.critical;
  const isPetCameraRefusalBlocked = isPetCameraCriticalBlocked || isPetCameraSleepBlocked;
  const petCameraRefusalMessage = isPetCameraSleepBlocked
    ? PET_CAMERA_REFUSAL_MESSAGES.sleeping
    : PET_CAMERA_REFUSAL_MESSAGES.critical;
  const isPetCameraControlsVisible = isPetCameraControlVisible && !isPetCameraRefusalVisible && !isPetCameraRefusalBlocked;
  const isPetCameraControlDisabled = !isPetCameraControlsVisible || isPetCameraBaseDisabled || (isPetCameraBusy && !isPetCameraReady);
  const isPetCameraInputDisabled = !isPetCameraControlsVisible || isPetCameraBaseDisabled || !isPetCameraReady;
  const isPetCameraOverlayVisible = isPetCameraControlsVisible || isPetCameraRefusalVisible;
  const isPetClickBlockedByMosquito = mosquitoes.length > 0;

  const handlePetCharacterCameraToggle = () => {
    lastInteractionRef.current = Date.now();

    if (isPetClickBlockedByMosquito || cameraPhase === 'flash' || isPetPhotoModalOpen || isSavingPetPhoto) return;

    if (isPetCameraRefusalVisible) {
      lowerPetCameraPose();
      return;
    }

    if (isPetCameraRefusalBlocked && !activeIsAwakening) {
      showCriticalPetCameraRefusal();
      return;
    }

    if (isPetCameraControlVisible || isCameraPoseActive || cameraPhase !== 'idle') {
      lowerPetCameraPose();
      return;
    }

    if (activeIsSleeping || activeIsAwakening) return;

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

        <div
          ref={petStageRef}
          className={`pet-stage pet-stage--${petReaction.level} pet-stage--${activeTimePeriod} pet-stage--rain-${activeStageRainVariant || 'none'}${isRainWeatherActive ? ' pet-stage--rain-weather-active' : ''}${mosquitoes.some((mosquito) => mosquito.isDying) ? ' pet-stage--mosquito-dying' : ''}`}
          style={petStageStyle}
          onPointerDownCapture={handlePetStagePointerDownCapture}
        >
          {/* Sun */}
          <div className="stage-sun" aria-hidden="true"></div>
          <div className="stage-morning-rain-clouds" aria-hidden="true">
            <span className="stage-morning-rain-cloud stage-morning-rain-cloud--left"></span>
            <span className="stage-morning-rain-cloud stage-morning-rain-cloud--main"></span>
            <span className="stage-morning-rain-cloud stage-morning-rain-cloud--top"></span>
            <span className="stage-morning-rain-cloud stage-morning-rain-cloud--right"></span>
          </div>

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

          {activeStageRainVariant && (
            <div className="stage-rain stage-rain--back" aria-hidden="true">
              {activeStageRainBackDrops.map((drop) => (
                <i
                  key={drop.id}
                  className="stage-rain__drop"
                  style={{
                    '--stage-rain-left': drop.left,
                    '--stage-rain-top': drop.top,
                    '--stage-rain-end-top': drop.endTop,
                    '--stage-rain-height': drop.height,
                    '--stage-rain-width': drop.width,
                    '--stage-rain-opacity': drop.opacity,
                    '--stage-rain-duration': drop.duration,
                    '--stage-rain-delay': drop.delay,
                    '--stage-rain-z': drop.z,
                    '--stage-rain-drift': drop.drift,
                    '--stage-rain-blur': drop.blur,
                    '--stage-rain-scale': drop.scale
                  }}
                />
              ))}
            </div>
          )}

          {/* Ground line */}
          <div className="stage-ground" aria-hidden="true" />

          {/* Multiple front rain zones scattered across stage with vertical layers */}
          {activeStageRainVariant && activeStageRainFrontZones.map((zone, zoneIndex) => (
            zone.layers.map((layer, layerIndex) => (
              <div
                key={`front-zone-${zoneIndex}-layer-${layerIndex}`}
                className="stage-rain stage-rain--front"
                style={{
                  left: zone.left,
                  width: zone.width,
                  top: layer.top,
                  bottom: layer.bottom,
                  opacity: layer.opacity
                }}
                aria-hidden="true"
              >
                {zone.drops.map((drop) => (
                  <i
                    key={`front-${drop.id}-layer-${layerIndex}`}
                    className="stage-rain__drop"
                    style={{
                      '--stage-rain-left': drop.left,
                      '--stage-rain-top': drop.top,
                      '--stage-rain-end-top': drop.endTop,
                      '--stage-rain-height': drop.height,
                      '--stage-rain-width': drop.width,
                      '--stage-rain-opacity': drop.opacity,
                      '--stage-rain-duration': drop.duration,
                      '--stage-rain-delay': drop.delay,
                      '--stage-rain-z': drop.z,
                      '--stage-rain-drift': drop.drift,
                      '--stage-rain-blur': drop.blur,
                      '--stage-rain-scale': drop.scale
                    }}
                  />
                ))}
              </div>
            ))
          ))}
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
                  <button
                    type="button"
                    className={`pet-character-debug__option ${isMosquitoDebugOpen ? 'pet-character-debug__option--active' : ''}`}
                    onClick={() => setIsMosquitoDebugOpen(v => !v)}
                    aria-expanded={isMosquitoDebugOpen}
                    aria-controls="mosquito-debug-panel"
                  >
                    <span>Mosquito</span>
                    <small>{isMosquitoDebugOpen ? 'Debug panel open' : 'Open mosquito debug panel'}</small>
                  </button>
                  <div className="pet-character-debug__current">
                    <span>State: {activePetCharacterPresentation.state}</span>
                    <span>Effect: {activePetCharacterPresentation.effect}</span>
                    <span>Speed: {activePetCharacterSpeed}</span>
                    <span>Bottom: {debugCharacterPosition.bottom}px</span>
                    <span>Shadow gap: {debugCharacterPosition.shadowGap}px</span>
                    <span>Camera arm X: {debugCharacterPosition.cameraArmX}px</span>
                    <span>Camera arm top: {debugCharacterPosition.cameraArmTop}px</span>
                    <span>Camera arm size: {debugCharacterPosition.cameraArmWidth}px x {debugCharacterPosition.cameraArmHeight}px</span>
                    <span>Camera arm rotate: {debugCharacterPosition.cameraArmRotate}deg</span>
                    <span>Click area: {debugPetClickArea.visible ? 'shown' : 'hidden'} - {formatPetClickAreaPercent(debugPetClickArea.width)} x {formatPetClickAreaPercent(debugPetClickArea.height)}</span>
                    <span>Click area offset: {formatPetClickAreaPercent(debugPetClickArea.x)}, {formatPetClickAreaPercent(debugPetClickArea.y)}</span>
                    <span>Thermo X: {debugThermometerPosition.x}px</span>
                    <span>Thermo Y: {debugThermometerPosition.y}px</span>
                    <span>Thermo size: {debugThermometerPosition.size}%</span>
                    <span>Time: {activeTimePeriod}{normalizedDebugStageTimePeriod === STAGE_TIME_DEBUG_AUTO_VALUE ? ' (auto)' : ' (debug)'}</span>
                    <span>Rain: {activeStageRainLabel}</span>
                    <div className="pet-character-debug__actions">
                      <button
                        type="button"
                        className="pet-character-debug__reset"
                        onClick={savePetDebugCssSnapshot}
                      >
                        Save CSS
                      </button>
                      <button
                        type="button"
                        className="pet-character-debug__reset"
                        onClick={copyPetDebugCssSnapshot}
                      >
                        Copy CSS
                      </button>
                    </div>
                    {debugCssStatus && (
                      <span className="pet-character-debug__status" role="status">{debugCssStatus}</span>
                    )}
                    <pre className="pet-character-debug__css-snippet">{petDebugCssSnippet}</pre>
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Stage time controls">
                    <span className="pet-character-debug__controls-title">Time of day</span>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${normalizedDebugStageTimePeriod === STAGE_TIME_DEBUG_AUTO_VALUE ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugStageTimePeriod(STAGE_TIME_DEBUG_AUTO_VALUE)}
                      aria-pressed={normalizedDebugStageTimePeriod === STAGE_TIME_DEBUG_AUTO_VALUE}
                    >
                      <span>Auto time</span>
                      <small>Current: {timePeriod}</small>
                    </button>
                    {STAGE_TIME_PERIODS.map((period) => {
                      const isActive = normalizedDebugStageTimePeriod === period.key;

                      return (
                        <button
                          key={period.key}
                          type="button"
                          className={`pet-character-debug__option ${isActive ? 'pet-character-debug__option--active' : ''}`}
                          onClick={() => updateDebugStageTimePeriod(period.key)}
                          aria-pressed={isActive}
                        >
                          <span>{period.label}</span>
                          <small>{period.description}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Rain type controls">
                    <span className="pet-character-debug__controls-title">Rain type</span>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${normalizedDebugStageRainVariant === STAGE_RAIN_DEBUG_AUTO_VALUE ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugStageRainVariant(STAGE_RAIN_DEBUG_AUTO_VALUE)}
                      aria-pressed={normalizedDebugStageRainVariant === STAGE_RAIN_DEBUG_AUTO_VALUE}
                    >
                      <span>Auto weather</span>
                      <small>{weatherRainVariant ? `API: ${activeStageRainLabel}` : 'API: no rain'}</small>
                    </button>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${normalizedDebugStageRainVariant === STAGE_RAIN_DEBUG_NONE_VALUE ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugStageRainVariant(STAGE_RAIN_DEBUG_NONE_VALUE)}
                      aria-pressed={normalizedDebugStageRainVariant === STAGE_RAIN_DEBUG_NONE_VALUE}
                    >
                      <span>No rain</span>
                      <small>Force clear stage</small>
                    </button>
                    {STAGE_RAIN_VARIANTS.map((variant) => {
                      const isActive = normalizedDebugStageRainVariant === variant.key;

                      return (
                        <button
                          key={variant.key}
                          type="button"
                          className={`pet-character-debug__option ${isActive ? 'pet-character-debug__option--active' : ''}`}
                          onClick={() => updateDebugStageRainVariant(variant.key)}
                          aria-pressed={isActive}
                        >
                          <span>{variant.label}</span>
                          <small>{variant.description}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Sleep and wake debug controls">
                    <span className="pet-character-debug__controls-title">Sleep / wake state</span>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${debugAwakeningMode === 'auto' ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugAwakeningMode('auto')}
                      aria-pressed={debugAwakeningMode === 'auto'}
                    >
                      <span>Auto</span>
                      <small>Normal behavior</small>
                    </button>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${debugAwakeningMode === 'sleep' ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugAwakeningMode('sleep')}
                      aria-pressed={debugAwakeningMode === 'sleep'}
                    >
                      <span>Force sleep</span>
                      <small>Pet sleeping</small>
                    </button>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${debugAwakeningMode === 'awakening' ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugAwakeningMode('awakening')}
                      aria-pressed={debugAwakeningMode === 'awakening'}
                    >
                      <span>Force awakening</span>
                      <small>Show tap-to-wake overlay</small>
                    </button>
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Pet click area controls">
                    <span className="pet-character-debug__controls-title">Pet click area</span>
                    <button
                      type="button"
                      className={`pet-character-debug__option ${debugPetClickArea.visible ? 'pet-character-debug__option--active' : ''}`}
                      onClick={() => updateDebugPetClickArea('visible', !debugPetClickArea.visible)}
                      aria-pressed={debugPetClickArea.visible}
                    >
                      <span>Show click area</span>
                      <small>{debugPetClickArea.visible ? 'On - visible after closing Debug' : 'Off'}</small>
                    </button>
                    {PET_CLICK_AREA_DEBUG_CONTROLS.map((control) => (
                      <label className="pet-character-debug__control" key={control.key}>
                        <span>{control.label}: {formatPetClickAreaPercent(debugPetClickArea[control.key])}</span>
                        <input
                          type="range"
                          min={PET_CLICK_AREA_DEBUG_LIMITS[control.key].min}
                          max={PET_CLICK_AREA_DEBUG_LIMITS[control.key].max}
                          step={control.step}
                          value={debugPetClickArea[control.key]}
                          onChange={(event) => updateDebugPetClickArea(control.key, event.target.value)}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="pet-character-debug__reset"
                      onClick={resetDebugPetClickArea}
                    >
                      Reset click area
                    </button>
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Character position controls">
                    <span className="pet-character-debug__controls-title">Character position</span>
                    {PET_CHARACTER_POSITION_CONTROLS.map((control) => (
                      <label className="pet-character-debug__control" key={control.key}>
                        <span>{control.label}: {debugCharacterPosition[control.key]}{control.unit}</span>
                        <input
                          type="range"
                          min={PET_CHARACTER_POSITION_LIMITS[control.key].min}
                          max={PET_CHARACTER_POSITION_LIMITS[control.key].max}
                          step="1"
                          value={debugCharacterPosition[control.key]}
                          onChange={(event) => updateDebugCharacterPosition(control.key, event.target.value)}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="pet-character-debug__reset"
                      onClick={resetDebugCharacterPosition}
                    >
                      Reset position
                    </button>
                  </div>
                  <div className="pet-character-debug__controls" aria-label="Thermometer position controls">
                    <span className="pet-character-debug__controls-title">Thermometer position</span>
                    {STAGE_THERMOMETER_POSITION_CONTROLS.map((control) => (
                      <label className="pet-character-debug__control" key={control.key}>
                        <span>{control.label}: {debugThermometerPosition[control.key]}{control.unit}</span>
                        <input
                          type="range"
                          min={STAGE_THERMOMETER_POSITION_LIMITS[control.key].min}
                          max={STAGE_THERMOMETER_POSITION_LIMITS[control.key].max}
                          step="1"
                          value={debugThermometerPosition[control.key]}
                          onChange={(event) => updateDebugThermometerPosition(control.key, event.target.value)}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="pet-character-debug__reset"
                      onClick={resetDebugThermometerPosition}
                    >
                      Reset thermometer
                    </button>
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

          <MosquitoDebugPanel
            isOpen={isMosquitoDebugOpen}
            onToggle={() => setIsMosquitoDebugOpen(v => !v)}
            config={mosquitoDebugConfig}
            onUpdateConfig={updateMosquitoDebugConfig}
            onReset={resetMosquitoDebugConfig}
            onStartEventNow={startMosquitoEventNow}
            eventStatus={mosquitoEventStatus}
            isEventForced={isMosquitoEventForced}
            totalWaves={mosquitoEventWaveInfo.total || petEvents?.mosquito?.totalWaves || 0}
            spawnedWaves={mosquitoEventWaveInfo.spawned || petEvents?.mosquito?.spawnedWaves || 0}
            completedAt={petEvents?.mosquito?.completedAt || null}
            mosquitoes={mosquitoes}
          />

          {/* Awakening overlay - tap to wake */}
          {activeIsAwakening && (
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
            <div
              className="stage-thermometer"
              style={stageThermometerStyle}
              aria-label={`Stage thermometer ${stageTemperature.value}${stageTemperature.unit || 'C'}${realTemperature ? ' (real-time)' : ` (${stageTemperature.label || 'estimated'})`}`}
            >
              <span className="stage-thermometer__cap" aria-hidden="true"></span>
              <span className="stage-thermometer__meter" aria-hidden="true">
                <span className="stage-thermometer__track">
                  <span className="stage-thermometer__mercury"></span>
                </span>
                <span className="stage-thermometer__tick stage-thermometer__tick--top"></span>
                <span className="stage-thermometer__tick stage-thermometer__tick--mid"></span>
                <span className="stage-thermometer__tick stage-thermometer__tick--low"></span>
              </span>
              <span className="stage-thermometer__bulb" aria-hidden="true"></span>
              <span className="stage-thermometer__value">
                {stageTemperature.value}
              </span>
            </div>
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

          <div className="pet-mosquito-bite-effects" aria-hidden="true">
            {mosquitoBiteEffects.map((effect) => (
              <PetStageMosquitoBiteEffect
                key={effect.id}
                effect={effect}
                onDone={handleMosquitoBiteEffectDone}
              />
            ))}
          </div>

          {/* Mosquitoes */}
          {mosquitoes.map((mosquito) => (
            <div
              key={mosquito.id}
              data-mosquito-id={mosquito.id}
              className={`pet-mosquito pet-mosquito--${mosquito.phase}${mosquito.isDying ? ' pet-mosquito--dying' : ''}`}
              style={{
                left: mosquito.isDying ? `${mosquito.killLeft ?? 0}px` : undefined,
                top: mosquito.isDying ? `${mosquito.killTop ?? 0}px` : undefined,
                animationName: mosquito.isDying ? 'none' : undefined,
                '--mosquito-flight-duration': `${mosquito.phase === 'flying-away'
                  ? (mosquito.exitDurationMs || mosquito.flightDurationMs || 5000)
                  : (mosquito.approachDurationMs || mosquito.flightDurationMs || 5000)}ms`,
                '--mosquito-buzz-duration': `${mosquito.buzzDurationMs}ms`,
                '--mosquito-wing-duration': `${MOSQUITO_WING_FLAP_DURATION_MS}ms`,
                '--mosquito-buzz-x': `${mosquito.buzzX}px`,
                '--mosquito-buzz-y': `${mosquito.buzzY}px`,
                '--mosquito-buzz-x-neg': `${-mosquito.buzzX}px`,
                '--mosquito-buzz-y-neg': `${-mosquito.buzzY}px`,
                '--mosquito-buzz-rotate': `${mosquito.buzzRotateDeg}deg`,
                '--mosquito-buzz-rotate-neg': `${-mosquito.buzzRotateDeg}deg`,
                '--mosquito-flight-buzz-duration': `${Math.max(420, mosquito.buzzDurationMs)}ms`,
                '--mosquito-flight-buzz-x': `${Math.min(1, mosquito.buzzX * 0.25)}px`,
                '--mosquito-flight-buzz-y': `${Math.min(0.75, mosquito.buzzY * 0.18)}px`,
                '--mosquito-flight-buzz-y-neg': `${-Math.min(0.75, mosquito.buzzY * 0.18)}px`,
                '--mosquito-flight-buzz-rotate': `${Math.min(2, mosquito.buzzRotateDeg * 0.18)}deg`,
                '--mosquito-bite-font-size': `${mosquitoDebugConfig.biteEffectFontSizePx}px`,
                '--mosquito-bite-float-height': `${mosquitoDebugConfig.biteEffectFloatHeightPx}px`,
                '--mosquito-bite-tick-duration': `${MOSQUITO_BITE_TICK_MS}ms`,
                '--mosquito-bite-start-delay': `${MOSQUITO_BITE_START_DELAY_MS}ms`,
                '--mosquito-kill-duration': `${mosquito.killAnimationDurationMs ?? MOSQUITO_KILL_MIN_ANIMATION_MS}ms`,
                '--mosquito-hit-x': `${mosquito.killHitX ?? 24}px`,
                '--mosquito-hit-y': `${mosquito.killHitY ?? 21}px`,
                '--mosquito-kill-fall-mid-distance': `${mosquito.killFallMidDistancePx ?? 260}px`,
                '--mosquito-kill-fall-visible-distance': `${mosquito.killFallVisibleDistancePx ?? 520}px`,
                '--mosquito-kill-fall-distance': `${mosquito.killFallDistancePx ?? 520}px`,
                '--mosquito-facing-scale-x': mosquito.phase === 'flying-away'
                  ? (mosquito.exitFacingScaleX ?? mosquito.facingScaleX ?? -1)
                  : (mosquito.facingScaleX ?? -1),
                '--mosquito-flight-tilt': `${mosquito.phase === 'flying-away'
                  ? (mosquito.exitFlightTiltDeg ?? mosquito.flightTiltDeg ?? 0)
                  : (mosquito.flightTiltDeg ?? 0)}deg`,
                '--mosquito-size-scale': mosquitoDebugConfig.sizePercent / 100,
                offsetPath: mosquito.isDying ? 'none' : `path("${mosquito.phase === 'flying-away'
                  ? (mosquito.exitPathD || mosquito.pathD)
                  : (mosquito.approachPathD || mosquito.pathD)}")`,
                WebkitOffsetPath: mosquito.isDying ? 'none' : `path("${mosquito.phase === 'flying-away'
                  ? (mosquito.exitPathD || mosquito.pathD)
                  : (mosquito.approachPathD || mosquito.pathD)}")`
              }}
              aria-hidden={mosquito.isDying ? 'true' : undefined}
            >
              <div
                className="pet-mosquito__buzz"
                role="button"
                tabIndex={mosquito.isDying ? -1 : 0}
                aria-label="Kill mosquito"
                onPointerDown={(event) => handleMosquitoTap(mosquito.id, event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    handleMosquitoTap(mosquito.id, event);
                  }
                }}
              >
                <div className="pet-mosquito__wing pet-mosquito__wing--left"></div>
                <div className="pet-mosquito__wing pet-mosquito__wing--right"></div>
                <div className="pet-mosquito__head">
                  <div className="pet-mosquito__antenna pet-mosquito__antenna--left"></div>
                  <div className="pet-mosquito__antenna pet-mosquito__antenna--right"></div>
                  <div className="pet-mosquito__proboscis"></div>
                </div>
                <div className="pet-mosquito__thorax"></div>
                <div className="pet-mosquito__abdomen">
                  <span className="pet-mosquito__stripe pet-mosquito__stripe--one"></span>
                  <span className="pet-mosquito__stripe pet-mosquito__stripe--two"></span>
                </div>
                <div className="pet-mosquito__legs">
                  <div className="pet-mosquito__leg pet-mosquito__leg--1"></div>
                  <div className="pet-mosquito__leg pet-mosquito__leg--2"></div>
                  <div className="pet-mosquito__leg pet-mosquito__leg--3"></div>
                  <div className="pet-mosquito__leg pet-mosquito__leg--4"></div>
                  <div className="pet-mosquito__leg pet-mosquito__leg--5"></div>
                  <div className="pet-mosquito__leg pet-mosquito__leg--6"></div>
                </div>
              </div>
            </div>
          ))}

          {/* Mosquito debug overlay */}
          {isPetCharacterDebugEnabled && mosquitoDebugConfig.showBoundaries && (
            <div
              className="mosquito-debug-boundary"
              style={{
                top: `${mosquitoDebugConfig.stageTopPercent}%`,
                left: `${mosquitoDebugConfig.stageLeftPercent}%`,
                width: `${mosquitoDebugConfig.stageRightPercent - mosquitoDebugConfig.stageLeftPercent}%`,
                height: `${mosquitoDebugConfig.stageBottomPercent - mosquitoDebugConfig.stageTopPercent}%`
              }}
              aria-hidden="true"
            />
          )}

          {/* Mosquito flight paths */}
          {isPetCharacterDebugEnabled && mosquitoDebugConfig.showPaths && mosquitoes.map((mosquito) => (
            <svg
              key={`path-${mosquito.id}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 998
              }}
              aria-hidden="true"
            >
              {/* Start point */}
              <circle cx={mosquito.startX} cy={mosquito.startY} r="4" fill="#000000" opacity="0.7" />
              <text x={mosquito.startX + 8} y={mosquito.startY} fill="#000000" fontSize="10">{mosquito.entrySide}</text>

              {/* Exit point */}
              <circle cx={mosquito.exitX} cy={mosquito.exitY} r="4" fill="#666666" opacity="0.7" />
              <text x={mosquito.exitX + 8} y={mosquito.exitY} fill="#666666" fontSize="10">{mosquito.exitSide}</text>

              {/* Flight path curve */}
              <path d={mosquito.pathD} fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.55" />
            </svg>
          ))}

          <span className={petCharacterShadowClassName} aria-hidden="true" />

          <div
            className={petCharacterClassName}
          >
            <button
              type="button"
              className="pet-character__hit-area"
              disabled={activeIsAwakening || isPetPhotoModalOpen || isPetClickBlockedByMosquito}
              aria-label={isPetClickBlockedByMosquito
                ? 'Pet action disabled while mosquitoes are present'
                : (isPetCameraControlVisible || isCameraPoseActive ? 'Hide pet camera control' : 'Show pet camera control')}
              aria-pressed={isPetCameraControlVisible || isCameraPoseActive}
              onClick={handlePetCharacterCameraToggle}
              onKeyDown={handlePetCharacterCameraKeyDown}
            />
            <MeoBoxPetCharacter state={activePetCharacterPresentation.state} />
            <span className="pet-character__camera" aria-hidden="true">
              <span className="pet-character__camera-hold-arm pet-character__camera-hold-arm--left" />
              <span className="pet-character__camera-hold-arm pet-character__camera-hold-arm--right" />
              <span className="pet-character__camera-grip pet-character__camera-grip--left" />
              <span className="pet-character__camera-grip pet-character__camera-grip--right" />
              <span className="pet-character__camera-lens" />
              <span className="pet-character__camera-flash" />
            </span>

          </div>
        </div>

        <div
          className={`pet-camera-action-overlay ${isPetCameraOverlayVisible ? 'pet-camera-action-overlay--visible' : ''} ${isPetCameraRefusalVisible ? 'pet-camera-action-overlay--refusal' : ''}`}
          aria-hidden={!isPetCameraOverlayVisible}
        >
          <div className="pet-camera-action-overlay__backdrop" aria-hidden="true" />
          {isPetCameraRefusalVisible ? (
            <div className="pet-camera-action-overlay__refusal" role="status" aria-label="Pet refuses photo">
              <div className="pet-camera-action-overlay__refusal-bubble">
                {petCameraRefusalMessage}
              </div>
              <button
                type="button"
                className="pet-camera-action-overlay__refusal-mark"
                onClick={lowerPetCameraPose}
                aria-label="Close pet refusal"
              >
                <LuCameraOff className="pet-camera-action-overlay__refusal-camera" aria-hidden="true" />
                <span className="pet-camera-action-overlay__refusal-x" aria-hidden="true">X</span>
              </button>
            </div>
          ) : (
            <div className="pet-camera-action-overlay__controls">
              <label
                className={`pet-stage-camera-button ${isPetCameraControlsVisible ? 'pet-stage-camera-button--visible' : ''} ${isCameraPoseActive ? 'pet-stage-camera-button--active' : ''} ${isPetCameraReady ? 'pet-stage-camera-button--ready' : ''} ${isPetCameraControlDisabled ? 'pet-stage-camera-button--disabled' : ''}`}
                onClick={handleCameraPose}
                onKeyDown={handleCameraKeyDown}
                aria-label={isPetCameraReady ? 'Open camera to take a pet photo' : 'Raise pet camera'}
                aria-disabled={isPetCameraControlDisabled}
                aria-hidden={!isPetCameraControlsVisible}
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
                tabIndex={isPetCameraControlsVisible ? 0 : -1}
              >
                <LuX aria-hidden="true" />
              </button>
            </div>
          )}
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
                  const isFoodLocked = activeTab === 'food' && (isFoodUseAnimating || activeIsSleeping);
                  const isCareLocked = activeTab === 'care' && (isCareUseAnimating || activeIsSleeping);
                  const isPetItemDisabled = Boolean(petUsePreview && (!petUsePreview.canUse || isSavingPet || isFoodLocked || isCareLocked));
                  const disabledReason = activeIsSleeping
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
