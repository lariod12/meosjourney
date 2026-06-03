import { useEffect, useMemo } from 'react';
import { LuX } from 'react-icons/lu';

const CLAW_GAME_MESSAGE_TYPE = 'meosjourney:pet-claw-game-complete';

const PetClawMachineGame = ({ isOpen, onComplete, onExit }) => {
  const gameUrl = useMemo(() => (
    `/claw-machine.html?petGame=1&round=${Date.now()}`
  ), [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== CLAW_GAME_MESSAGE_TYPE) {
        return;
      }

      onComplete({
        caught: Boolean(event.data.caught),
        toyType: event.data.toyType || null
      });
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pet-claw-game-screen" role="dialog" aria-modal="true" aria-label="Claw machine game">
      <button
        type="button"
        className="pet-claw-game-screen__exit"
        onClick={onExit}
        aria-label="Exit claw machine game"
      >
        <LuX aria-hidden="true" />
      </button>
      <iframe
        title="Claw machine game"
        className="pet-claw-game-screen__frame"
        src={gameUrl}
      />
    </div>
  );
};

export default PetClawMachineGame;
