import { useEffect, useMemo, useState } from 'react';
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

const DEFAULT_PET_ITEMS = {
  food: TAB_ITEMS.food.map(({ name, shape }) => ({ name, icon: '', shape })),
  care: TAB_ITEMS.care.map(({ name, shape }) => ({ name, icon: '', shape }))
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

const normalizePetInventoryItems = (items, fallbackItems = []) => {
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems;

  return sourceItems
    .map((item) => {
      if (!item) return null;
      const name = typeof item.name === 'string' ? item.name.trim() : String(item.name || '').trim();
      const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
      const shape = item.shape || DEFAULT_PET_SHAPES[name.toLowerCase()] || 'box';
      return name ? { name, icon, shape } : null;
    })
    .filter(Boolean);
};

const serializePetItems = (items) => (
  normalizePetInventoryItems(items)
    .map(({ name, icon }) => ({ name, icon }))
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
  PET_STATUS_ROWS.map((row) => ({
    ...row,
    value: row.key === 'level' ? row.value : clampPetStatusValue(petStatus[row.key] ?? row.value),
    editable: PET_STATUS_KEYS.includes(row.key)
  }))
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

const PetItemCard = ({ item, showCount = true, isCurrent = false, showEmptyIcon = false, onClick }) => {
  const Icon = ACTIVITY_ICONS[item.shape] ?? ITEM_ICONS[item.shape] ?? LuPackage2;
  const ariaLabel = showCount ? `${item.name}, quantity ${item.count}` : item.name;

  return (
    <button
      type="button"
      className={`pet-item-card ${showCount ? '' : 'pet-item-card--activity'} ${isCurrent ? 'pet-item-card--current' : ''}`}
      aria-label={ariaLabel}
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

const PetStatusPanel = ({ rows, onStatusChange, isSaving }) => (
  <div className="pet-status-list" aria-label="Pet status cards">
    {rows.map(({ key, label, value, Icon, editable }) => (
      <div key={key} className="pet-status-row" aria-label={`${label} ${value}%`}>
        <div className="pet-status-row__header">
          <Icon className="pet-status-icon" aria-hidden="true" />
          <span className="pet-status-row__title">{label}</span>
          {editable && (
            <input
              type="number"
              className="pet-status-row__input"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={(event) => onStatusChange(key, event.target.value)}
              disabled={isSaving}
              aria-label={`${label} value`}
            />
          )}
        </div>
        <div className="pet-status-row__track" aria-hidden="true">
          <span style={{ width: `${value}%` }} />
        </div>
        <span className="pet-status-row__percent">{value}%</span>
      </div>
    ))}
  </div>
);

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
  const [activeTab, setActiveTab] = useState('food');
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [moodFloatBatch, setMoodFloatBatch] = useState(() => createMoodFloatBatch());
  const [thoughtBubbleVisible, setThoughtBubbleVisible] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [moodItems, setMoodItems] = useState(() => normalizeMoodItems());
  const [currentActivityName, setCurrentActivityName] = useState('');
  const [currentMoodName, setCurrentMoodName] = useState('');
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
  const [petItemModalCategory, setPetItemModalCategory] = useState(null);
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
          setActivityItems(activities);
          setMoodItems(moods);
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

          setPetStatus({
            health: clampPetStatusValue(pet?.status?.health ?? DEFAULT_PET_STATUS.health),
            hunger: clampPetStatusValue(pet?.status?.hunger ?? DEFAULT_PET_STATUS.hunger),
            sanity: clampPetStatusValue(pet?.status?.sanity ?? DEFAULT_PET_STATUS.sanity)
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch pet page data:', error);
        if (!cancelled) {
          setActivityItems([]);
          setMoodItems(normalizeMoodItems());
          setCurrentActivityName('');
          setCurrentMoodName('');
          setPetItems({
            food: DEFAULT_PET_ITEMS.food,
            care: DEFAULT_PET_ITEMS.care
          });
          setPetStatus({
            health: DEFAULT_PET_STATUS.health,
            hunger: DEFAULT_PET_STATUS.hunger,
            sanity: DEFAULT_PET_STATUS.sanity
          });
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

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    window.history.back();
  };

  const handlePetStatusChange = (key, value) => {
    setPetStatus(prev => ({
      ...prev,
      [key]: clampPetStatusValue(value)
    }));
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
          <div className="pet-nameplate" aria-label="Méo, current location Home">
            <span className="pet-nameplate__flip" aria-hidden="true">
              <span className="pet-nameplate__face pet-nameplate__face--front">Méo</span>
              <span className="pet-nameplate__face pet-nameplate__face--back">Home</span>
            </span>
          </div>
          <PetInfoDropdown expanded={infoExpanded} onToggle={() => setInfoExpanded(v => !v)} rows={petStatusRows} />
        </div>

        <div className="pet-stage">
          <div className={`pet-bubble ${thoughtBubbleVisible ? 'pet-bubble--visible' : ''}`} aria-hidden={!thoughtBubbleVisible}>
            <p>I'm hungry. Missing your yummy meals.</p>
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

          <div className="pet-character pet-character--pet" role="img" aria-label="Meo pet placeholder">
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
                onStatusChange={handlePetStatusChange}
                isSaving={isSavingPet}
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
                {items.map((item, index) => (
                  <PetItemCard
                    key={`${item.name}-${item.shape}-${index}`}
                    item={item}
                    showCount={false}
                    showEmptyIcon={activeTab === 'activity' || activeTab === 'moods'}
                    isCurrent={
                      (activeTab === 'activity' && item.name === currentActivityName)
                      || (activeTab === 'moods' && item.name === currentMoodName)
                    }
                    onClick={
                      activeTab === 'activity'
                        ? () => handleActivityCardClick(item)
                        : activeTab === 'moods'
                          ? () => handleMoodCardClick(item)
                          : undefined
                    }
                  />
                ))}
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
    </main>
  );
};

export default PetPage;
