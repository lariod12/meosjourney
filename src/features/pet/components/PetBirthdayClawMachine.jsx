import { useEffect, useRef, useState } from 'react';

export const DEFAULT_BIRTHDAY_GIFT_TOY = 'petTeddy';

export const BIRTHDAY_CLAW_TOYS = [
  { id: 'bear', label: 'Pocket bear' },
  { id: 'bunny', label: 'Moon bunny' },
  { id: DEFAULT_BIRTHDAY_GIFT_TOY, label: 'Birthday teddy' },
  { id: 'penguin', label: 'Tiny penguin' },
  { id: 'robot', label: 'Little robot' },
  { id: 'golem', label: 'Stone plush' }
];

const BIRTHDAY_GIFT_TOY_IDS = new Set(BIRTHDAY_CLAW_TOYS.map((toy) => toy.id));

export const normalizeBirthdayGiftToy = (toyType) => (
  BIRTHDAY_GIFT_TOY_IDS.has(toyType) ? toyType : DEFAULT_BIRTHDAY_GIFT_TOY
);

export const getBirthdayGiftToyLabel = (toyType) => {
  const normalizedToyType = normalizeBirthdayGiftToy(toyType);
  return BIRTHDAY_CLAW_TOYS.find((toy) => toy.id === normalizedToyType)?.label || 'Birthday plush';
};

export const PetBirthdayToy = ({ toyType, className = '', ariaHidden = true }) => {
  const normalizedToyType = normalizeBirthdayGiftToy(toyType);
  const classes = [
    'pet-birthday-toy',
    `pet-birthday-toy--${normalizedToyType}`,
    className
  ].filter(Boolean).join(' ');

  if (normalizedToyType === DEFAULT_BIRTHDAY_GIFT_TOY) {
    return (
      <span className={classes} aria-hidden={ariaHidden}>
        <span className="pet-birthday-toy__teddy-ear pet-birthday-toy__teddy-ear--left" />
        <span className="pet-birthday-toy__teddy-ear pet-birthday-toy__teddy-ear--right" />
        <span className="pet-birthday-toy__teddy-body" />
        <span className="pet-birthday-toy__teddy-arm pet-birthday-toy__teddy-arm--left">
          <span className="pet-birthday-toy__teddy-arm-inner" />
          <span className="pet-birthday-toy__teddy-paw" />
        </span>
        <span className="pet-birthday-toy__teddy-arm pet-birthday-toy__teddy-arm--right">
          <span className="pet-birthday-toy__teddy-arm-inner" />
          <span className="pet-birthday-toy__teddy-paw" />
        </span>
        <span className="pet-birthday-toy__teddy-leg pet-birthday-toy__teddy-leg--left">
          <span className="pet-birthday-toy__teddy-foot" />
        </span>
        <span className="pet-birthday-toy__teddy-leg pet-birthday-toy__teddy-leg--right">
          <span className="pet-birthday-toy__teddy-foot" />
        </span>
        <span className="pet-birthday-toy__teddy-head" />
        <span className="pet-birthday-toy__teddy-eye pet-birthday-toy__teddy-eye--left" />
        <span className="pet-birthday-toy__teddy-eye pet-birthday-toy__teddy-eye--right" />
        <span className="pet-birthday-toy__teddy-muzzle">
          <span className="pet-birthday-toy__teddy-cheek pet-birthday-toy__teddy-cheek--left" />
          <span className="pet-birthday-toy__teddy-cheek pet-birthday-toy__teddy-cheek--right" />
        </span>
        <span className="pet-birthday-toy__teddy-nose">
          <span className="pet-birthday-toy__teddy-nose-shine" />
        </span>
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden={ariaHidden}>
      <span className="pet-birthday-toy__part pet-birthday-toy__part--ear-left" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--ear-right" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--body" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--belly" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--eye-left" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--eye-right" />
      <span className="pet-birthday-toy__part pet-birthday-toy__part--detail" />
    </span>
  );
};

const PetBirthdayClawMachine = ({ isOpen, onToyCollected }) => {
  const [clawIndex, setClawIndex] = useState(2);
  const [dropState, setDropState] = useState('idle');
  const collectTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setDropState('idle');
      setClawIndex(2);
    }

    return () => {
      if (collectTimerRef.current) {
        window.clearTimeout(collectTimerRef.current);
        collectTimerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedToy = BIRTHDAY_CLAW_TOYS[clawIndex] || BIRTHDAY_CLAW_TOYS[0];
  const isDropping = dropState !== 'idle';

  const handleMove = (direction) => {
    if (isDropping) return;
    setClawIndex((currentIndex) => Math.min(
      BIRTHDAY_CLAW_TOYS.length - 1,
      Math.max(0, currentIndex + direction)
    ));
  };

  const handleToySelect = (nextIndex) => {
    if (isDropping) return;
    setClawIndex(nextIndex);
  };

  const handleDrop = () => {
    if (isDropping) return;

    setDropState('dropping');
    collectTimerRef.current = window.setTimeout(() => {
      setDropState('collected');
      onToyCollected(selectedToy.id);
      collectTimerRef.current = null;
    }, 920);
  };

  return (
    <div className="pet-birthday-claw-overlay" role="presentation">
      <div
        className="pet-birthday-claw-machine"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-birthday-claw-title"
        style={{ '--pet-claw-index': clawIndex }}
      >
        <div className="pet-birthday-claw-machine__header">
          <p id="pet-birthday-claw-title">Pick your birthday plush</p>
          <span>{isDropping ? `Catching ${selectedToy.label}...` : selectedToy.label}</span>
        </div>

        <div className={`pet-birthday-claw-machine__cabinet pet-birthday-claw-machine__cabinet--${dropState}`}>
          <div className="pet-birthday-claw-machine__rail" aria-hidden="true" />
          <div className="pet-birthday-claw-machine__claw" aria-hidden="true">
            <span className="pet-birthday-claw-machine__claw-cable" />
            <span className="pet-birthday-claw-machine__claw-head" />
            <span className="pet-birthday-claw-machine__claw-arm pet-birthday-claw-machine__claw-arm--left" />
            <span className="pet-birthday-claw-machine__claw-arm pet-birthday-claw-machine__claw-arm--right" />
          </div>

          <div className="pet-birthday-claw-machine__toy-row">
            {BIRTHDAY_CLAW_TOYS.map((toy, index) => (
              <button
                key={toy.id}
                type="button"
                className={[
                  'pet-birthday-claw-machine__toy-button',
                  index === clawIndex ? 'pet-birthday-claw-machine__toy-button--selected' : '',
                  isDropping && index === clawIndex ? 'pet-birthday-claw-machine__toy-button--catching' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => handleToySelect(index)}
                disabled={isDropping}
                aria-label={`Aim claw at ${toy.label}`}
                aria-pressed={index === clawIndex}
              >
                <PetBirthdayToy toyType={toy.id} className="pet-birthday-claw-machine__toy-visual" />
              </button>
            ))}
          </div>
        </div>

        <div className="pet-birthday-claw-machine__controls">
          <button
            type="button"
            className="pet-birthday-claw-machine__control-button"
            onClick={() => handleMove(-1)}
            disabled={isDropping || clawIndex === 0}
          >
            Left
          </button>
          <button
            type="button"
            className="pet-birthday-claw-machine__drop-button"
            onClick={handleDrop}
            disabled={isDropping}
          >
            Drop
          </button>
          <button
            type="button"
            className="pet-birthday-claw-machine__control-button"
            onClick={() => handleMove(1)}
            disabled={isDropping || clawIndex === BIRTHDAY_CLAW_TOYS.length - 1}
          >
            Right
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetBirthdayClawMachine;
