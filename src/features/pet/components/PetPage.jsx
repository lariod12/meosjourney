import { useMemo, useState } from 'react';
import {
  LuChevronLeft, LuEllipsis,
  LuUtensils, LuHeart, LuActivity, LuGauge,
  LuTrophy, LuHeartPulse, LuSoup, LuBrain,
  LuCake, LuBeef, LuApple, LuMilk, LuFish, LuCookie,
  LuShowerHead, LuShirt, LuBedSingle, LuBrush, LuBath, LuBandage,
  LuPackage2, LuCarFront, LuPlane, LuGamepad2, LuBookOpen, LuFootprints, LuPuzzle
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
  puzzle: LuPuzzle
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
  ]
};

const TABS = [
  { key: 'food', label: 'Food', Icon: LuUtensils },
  { key: 'care', label: 'Care', Icon: LuHeart },
  { key: 'activity', label: 'Activity', Icon: LuActivity },
  { key: 'status', label: 'Status', Icon: LuGauge }
];

const PET_STATUS_ROWS = [
  { key: 'level', label: 'LV.0', value: 10, Icon: LuTrophy },
  { key: 'health', label: 'Health', value: 84, Icon: LuHeartPulse },
  { key: 'hunger', label: 'Hunger', value: 38, Icon: LuSoup },
  { key: 'sanity', label: 'Sanity', value: 72, Icon: LuBrain }
];

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

const PetPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('food');
  const items = useMemo(() => TAB_ITEMS[activeTab] ?? TAB_ITEMS.food, [activeTab]);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    window.history.back();
  };

  return (
    <main className="pet-page">
      <section className="pet-phone" aria-label="Virtual pet preview">
        <div className="pet-stage">
          <div className="pet-topbar">
            <button type="button" className="pet-round-button" onClick={handleBack} aria-label="Back">
              <LuChevronLeft className="pet-topbar-icon" aria-hidden="true" />
            </button>
            <div className="pet-nameplate">Méos Home</div>
            <button type="button" className="pet-round-button" aria-label="More options">
              <LuEllipsis className="pet-topbar-icon" aria-hidden="true" />
            </button>
          </div>

          <div className="pet-bubble">
            <p>I'm hungry. Missing your yummy meals.</p>
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
