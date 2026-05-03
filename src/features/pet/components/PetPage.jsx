import { useEffect, useMemo, useState } from 'react';
import {
  LuChevronLeft, LuChevronDown,
  LuUtensils, LuHeart, LuActivity, LuGauge,
  LuTrophy, LuHeartPulse, LuSoup, LuBrain,
  LuCake, LuBeef, LuApple, LuMilk, LuFish, LuCookie,
  LuShowerHead, LuShirt, LuBedSingle, LuBrush, LuBath, LuBandage,
  LuPackage2, LuCarFront, LuPlane, LuGamepad2, LuBookOpen, LuFootprints, LuPuzzle,
  LuSmile, LuLaugh, LuMeh, LuFrown, LuSparkles, LuMoon, LuSun, LuCloudSun, LuCloudRain
} from 'react-icons/lu';
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
  activity: [
    { name: 'Package', count: 0, shape: 'box' },
    { name: 'Car', count: 1, shape: 'car' },
    { name: 'Plane', count: 1, shape: 'plane' },
    { name: 'Ball', count: 1, shape: 'ball' },
    { name: 'Book', count: 0, shape: 'book' },
    { name: 'Walk', count: 1, shape: 'walk' },
    { name: 'Puzzle', count: 1, shape: 'puzzle' },
    { name: 'Sprint', count: 0, shape: 'walk' },
    { name: 'Kite', count: 1, shape: 'plane' }
  ],
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

const PET_DROPDOWN_STATUS_ROWS = PET_STATUS_ROWS.filter(({ key }) => (
  key === 'health' || key === 'hunger' || key === 'sanity'
));

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

const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

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

const PetItemCard = ({ item }) => {
  const Icon = ITEM_ICONS[item.shape] ?? LuPackage2;
  return (
    <button type="button" className="pet-item-card" aria-label={`${item.name}, quantity ${item.count}`}>
      <Icon className="pet-item-icon" aria-hidden="true" />
      <span className="pet-item-card__count"><span className="pet-item-card__count-x">x</span>{item.count}</span>
      <span className="pet-item-card__name">{item.name}</span>
    </button>
  );
};

const PetStatusPanel = () => (
  <div className="pet-status-list" aria-label="Pet status cards">
    {PET_STATUS_ROWS.map(({ key, label, value, Icon }) => (
      <div key={key} className="pet-status-row" aria-label={`${label} ${value}%`}>
        <div className="pet-status-row__header">
          <Icon className="pet-status-icon" aria-hidden="true" />
          <span className="pet-status-row__title">{label}</span>
        </div>
        <div className="pet-status-row__track" aria-hidden="true">
          <span style={{ width: `${value}%` }} />
        </div>
        <span className="pet-status-row__percent">{value}%</span>
      </div>
    ))}
  </div>
);

const PetInfoDropdown = ({ expanded, onToggle }) => (
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
      {PET_DROPDOWN_STATUS_ROWS.map(({ key, label, value, Icon }) => (
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
  const items = useMemo(() => TAB_ITEMS[activeTab] ?? TAB_ITEMS.food, [activeTab]);
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMoodFloatBatch(createMoodFloatBatch());
    }, PET_MOOD_FLOAT_OPTIONS.runIntervalSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    window.history.back();
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
          <PetInfoDropdown expanded={infoExpanded} onToggle={() => setInfoExpanded(v => !v)} />
        </div>

        <div className="pet-stage">
          <div className="pet-bubble">
            <p>I'm hungry. Missing your yummy meals.</p>
          </div>

          <div className="pet-stage-indicators" aria-label="Pet context">
            {moodFloatBatch.map((moodFloatItem, index) => (
              <div key={moodFloatItem.id} className="pet-mood-float" style={moodFloatStyles[index]} aria-label={`Current mood ${PET_CURRENT_MOOD.label}`}>
                <PET_CURRENT_MOOD.Icon className="pet-mood-float__icon" aria-hidden="true" />
                <span>{PET_CURRENT_MOOD.label}</span>
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
              <PetStatusPanel />
            ) : (
              <div className="pet-item-grid">
                {items.map((item) => (
                  <PetItemCard key={item.name} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default PetPage;
