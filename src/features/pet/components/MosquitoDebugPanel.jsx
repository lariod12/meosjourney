import React, { useMemo, useState } from 'react';

const MOSQUITO_DEBUG_CONFIG_STORAGE_KEY = 'mosquito-debug-config-shape-lab-v3';
const DEFAULT_FLIGHT_SPEED_MIN = 45;
const DEFAULT_FLIGHT_SPEED_MAX = 199;
const DEFAULT_HOLD_DURATION_MIN_MS = 3000;
const DEFAULT_HOLD_DURATION_MAX_MS = 7000;
const DEFAULT_BITE_EFFECT_FONT_SIZE_PX = 21;
const DEFAULT_BITE_EFFECT_FLOAT_HEIGHT_PX = 96;

export default function MosquitoDebugPanel({
  config,
  onUpdateConfig,
  onReset,
  onStartEventNow,
  eventStatus,
  isEventForced,
  totalWaves,
  spawnedWaves,
  completedAt,
  mosquitoes
}) {
  const [saveStatus, setSaveStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const flightSpeedMin = config.flightSpeedMinPxPerSec ?? DEFAULT_FLIGHT_SPEED_MIN;
  const flightSpeedMax = config.flightSpeedMaxPxPerSec ?? DEFAULT_FLIGHT_SPEED_MAX;
  const holdDurationMinMs = config.holdDurationMinMs ?? DEFAULT_HOLD_DURATION_MIN_MS;
  const holdDurationMaxMs = config.holdDurationMaxMs ?? DEFAULT_HOLD_DURATION_MAX_MS;
  const biteEffectFontSizePx = config.biteEffectFontSizePx ?? DEFAULT_BITE_EFFECT_FONT_SIZE_PX;
  const biteEffectFloatHeightPx = config.biteEffectFloatHeightPx ?? DEFAULT_BITE_EFFECT_FLOAT_HEIGHT_PX;
  const mosquitoCount = mosquitoes.length;
  const eventLabel = eventStatus || 'Idle';
  const waveLabel = `${spawnedWaves || 0} / ${totalWaves || 0}`;
  const configSnippet = useMemo(
    () => `MOSQUITO_DEBUG_CONFIG = ${JSON.stringify({
      ...config,
      isEnabled: config.isEnabled !== false,
      flightSpeedMinPxPerSec: flightSpeedMin,
      flightSpeedMaxPxPerSec: flightSpeedMax,
      holdDurationMinMs,
      holdDurationMaxMs,
      biteEffectFontSizePx,
      biteEffectFloatHeightPx
    }, null, 2)};`,
    [
      biteEffectFloatHeightPx,
      biteEffectFontSizePx,
      config,
      flightSpeedMax,
      flightSpeedMin,
      holdDurationMaxMs,
      holdDurationMinMs
    ]
  );

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(MOSQUITO_DEBUG_CONFIG_STORAGE_KEY, JSON.stringify(config));
      setSaveStatus('Saved local');
    } catch {
      setSaveStatus('Save failed');
    }
  };

  const handleCopySettings = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(configSnippet);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = configSnippet;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  return (
    <div className="mosquito-debug">
      <div
        id="mosquito-debug-panel"
        className="mosquito-debug__panel"
        onClick={(e) => e.stopPropagation()}
        role="region"
        aria-labelledby="mosquito-debug-title"
      >
        {/* Title */}
        <h2 id="mosquito-debug-title" className="mosquito-debug__title">Mosquito Debug</h2>
        <div className="mosquito-debug__quick-stats" aria-label="Mosquito debug quick stats">
          <span>
            <strong>{mosquitoCount}</strong>
            Active
          </span>
          <span>
            <strong>{eventLabel}</strong>
            Event
          </span>
          <span>
            <strong>{waveLabel}</strong>
            Waves
          </span>
        </div>

        {/* Grid Layout */}
        <div className="mosquito-debug__grid">
          {/* Status */}
          <details className="mosquito-debug__section" open>
            <summary className="mosquito-debug__section-title">
              <span>Status</span>
              <small>{eventLabel}</small>
            </summary>
            <div className="mosquito-debug__status">
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Active:</span>
                <span className="mosquito-debug__status-value">{mosquitoCount}</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Enabled:</span>
                <span className="mosquito-debug__status-value">{config.isEnabled === false ? 'Off' : 'On'}</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Event:</span>
                <span className="mosquito-debug__status-value">{eventLabel}</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Waves:</span>
                <span className="mosquito-debug__status-value">{waveLabel}</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Wave random:</span>
                <span className="mosquito-debug__status-value">{config.eventWavesMin} - {config.eventWavesMax}</span>
              </div>
              {completedAt && (
                <div className="mosquito-debug__status-item">
                  <span className="mosquito-debug__status-label">Completed:</span>
                  <span className="mosquito-debug__status-value">{completedAt}</span>
                </div>
              )}
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Stage:</span>
                <span className="mosquito-debug__status-value">{config.stageTopPercent}% - {config.stageBottomPercent}%</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Spawn:</span>
                <span className="mosquito-debug__status-value">{(config.spawnIntervalMinMs / 1000).toFixed(1)}s - {(config.spawnIntervalMaxMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Count:</span>
                <span className="mosquito-debug__status-value">{config.mosquitoesPerSpawnMin} - {config.mosquitoesPerSpawnMax}</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Speed:</span>
                <span className="mosquito-debug__status-value">{flightSpeedMin} - {flightSpeedMax}px/s</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Hold:</span>
                <span className="mosquito-debug__status-value">{(holdDurationMinMs / 1000).toFixed(1)}s - {(holdDurationMaxMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Damage text:</span>
                <span className="mosquito-debug__status-value">{biteEffectFontSizePx}px / {biteEffectFloatHeightPx}px</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Size:</span>
                <span className="mosquito-debug__status-value">{config.sizePercent}%</span>
              </div>
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Curve:</span>
                <span className="mosquito-debug__status-value">{config.curveAmountPercent}%</span>
              </div>
            </div>
          </details>

          {/* Current Settings */}
          <details className="mosquito-debug__section mosquito-debug__section--settings" open>
            <summary className="mosquito-debug__section-title">
              <span>Current Settings</span>
              <small>Save / copy</small>
            </summary>
            <div className="mosquito-debug__actions">
              <button
                type="button"
                className="mosquito-debug__action"
                onClick={handleSaveSettings}
              >
                Save Local
              </button>
              <button
                type="button"
                className="mosquito-debug__action mosquito-debug__action--dark"
                onClick={handleCopySettings}
              >
                Copy Snippet
              </button>
              <button
                type="button"
                className={`mosquito-debug__action ${isEventForced ? 'mosquito-debug__action--active' : ''}`}
                onClick={onStartEventNow}
              >
                {isEventForced ? 'Stop Forced Event' : 'Start Event Now'}
              </button>
            </div>
            {(saveStatus || copyStatus) && (
              <div className="mosquito-debug__action-status" role="status">
                {[saveStatus, copyStatus].filter(Boolean).join(' · ')}
              </div>
            )}
            <pre className="mosquito-debug__config-info">{configSnippet}</pre>
          </details>

          {/* Spawn Settings */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Spawn Settings</span>
              <small>{config.mosquitoesPerSpawnMin}-{config.mosquitoesPerSpawnMax} every {(config.spawnIntervalMinMs / 1000).toFixed(1)}-{(config.spawnIntervalMaxMs / 1000).toFixed(1)}s</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Max mosquitoes: <strong>{config.maxMosquitoes}</strong></span>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={config.maxMosquitoes}
                onChange={(e) => onUpdateConfig('maxMosquitoes', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Count min: <strong>{config.mosquitoesPerSpawnMin}</strong></span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.mosquitoesPerSpawnMin}
                onChange={(e) => onUpdateConfig('mosquitoesPerSpawnMin', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Count max: <strong>{config.mosquitoesPerSpawnMax}</strong></span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.mosquitoesPerSpawnMax}
                onChange={(e) => onUpdateConfig('mosquitoesPerSpawnMax', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Interval min: <strong>{(config.spawnIntervalMinMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={config.spawnIntervalMinMs}
                onChange={(e) => onUpdateConfig('spawnIntervalMinMs', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Interval max: <strong>{(config.spawnIntervalMaxMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={config.spawnIntervalMaxMs}
                onChange={(e) => onUpdateConfig('spawnIntervalMaxMs', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Wave min: <strong>{config.eventWavesMin}</strong></span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.eventWavesMin}
                onChange={(e) => onUpdateConfig('eventWavesMin', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Wave max: <strong>{config.eventWavesMax}</strong></span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.eventWavesMax}
                onChange={(e) => onUpdateConfig('eventWavesMax', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Flight Speed */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Random Flight Speed</span>
              <small>{flightSpeedMin}-{flightSpeedMax}px/s</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Min speed: <strong>{flightSpeedMin}px/s</strong></span>
              <input
                type="range"
                min="10"
                max="240"
                step="1"
                value={flightSpeedMin}
                onChange={(e) => onUpdateConfig('flightSpeedMinPxPerSec', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Max speed: <strong>{flightSpeedMax}px/s</strong></span>
              <input
                type="range"
                min="10"
                max="240"
                step="1"
                value={flightSpeedMax}
                onChange={(e) => onUpdateConfig('flightSpeedMaxPxPerSec', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Hold Duration */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Random Stop Time</span>
              <small>{(holdDurationMinMs / 1000).toFixed(1)}-{(holdDurationMaxMs / 1000).toFixed(1)}s</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Hold min: <strong>{(holdDurationMinMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="0"
                max="15000"
                step="100"
                value={holdDurationMinMs}
                onChange={(e) => onUpdateConfig('holdDurationMinMs', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Hold max: <strong>{(holdDurationMaxMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="0"
                max="15000"
                step="100"
                value={holdDurationMaxMs}
                onChange={(e) => onUpdateConfig('holdDurationMaxMs', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Bite Effect */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>-1 Damage Text</span>
              <small>{biteEffectFontSizePx}px / {biteEffectFloatHeightPx}px</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Font size: <strong>{biteEffectFontSizePx}px</strong></span>
              <input
                type="range"
                min="12"
                max="80"
                step="1"
                value={biteEffectFontSizePx}
                onChange={(e) => onUpdateConfig('biteEffectFontSizePx', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Float height: <strong>{biteEffectFloatHeightPx}px</strong></span>
              <input
                type="range"
                min="24"
                max="240"
                step="1"
                value={biteEffectFloatHeightPx}
                onChange={(e) => onUpdateConfig('biteEffectFloatHeightPx', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Shape & Path */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Shape & Path</span>
              <small>{config.sizePercent}% / curve {config.curveAmountPercent}%</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Size: <strong>{config.sizePercent}%</strong></span>
              <input
                type="range"
                min="1"
                max="220"
                step="1"
                value={config.sizePercent}
                onChange={(e) => onUpdateConfig('sizePercent', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Curve amount: <strong>{config.curveAmountPercent}%</strong></span>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={config.curveAmountPercent}
                onChange={(e) => onUpdateConfig('curveAmountPercent', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Body Buzz */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Body Buzz</span>
              <small>{config.bodyBuzzDurationMs}ms / {config.bodyBuzzX},{config.bodyBuzzY}px</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Speed: <strong>{config.bodyBuzzDurationMs}ms</strong></span>
              <input
                type="range"
                min="35"
                max="1000"
                step="5"
                value={config.bodyBuzzDurationMs}
                onChange={(e) => onUpdateConfig('bodyBuzzDurationMs', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Move X: <strong>{config.bodyBuzzX}px</strong></span>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={config.bodyBuzzX}
                onChange={(e) => onUpdateConfig('bodyBuzzX', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Move Y: <strong>{config.bodyBuzzY}px</strong></span>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={config.bodyBuzzY}
                onChange={(e) => onUpdateConfig('bodyBuzzY', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Rotate: <strong>{config.bodyBuzzRotateDeg}deg</strong></span>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={config.bodyBuzzRotateDeg}
                onChange={(e) => onUpdateConfig('bodyBuzzRotateDeg', Number(e.target.value))}
              />
            </label>
          </details>

          {/* Stage Boundaries */}
          <details className="mosquito-debug__section">
            <summary className="mosquito-debug__section-title">
              <span>Stage Boundaries (%)</span>
              <small>{config.stageTopPercent}-{config.stageBottomPercent}% Y</small>
            </summary>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Top: <strong>{config.stageTopPercent}%</strong></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.stageTopPercent}
                onChange={(e) => onUpdateConfig('stageTopPercent', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Bottom: <strong>{config.stageBottomPercent}%</strong></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.stageBottomPercent}
                onChange={(e) => onUpdateConfig('stageBottomPercent', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Left: <strong>{config.stageLeftPercent}%</strong></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.stageLeftPercent}
                onChange={(e) => onUpdateConfig('stageLeftPercent', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Right: <strong>{config.stageRightPercent}%</strong></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.stageRightPercent}
                onChange={(e) => onUpdateConfig('stageRightPercent', Number(e.target.value))}
              />
            </label>

          </details>

          {/* Visualization */}
          <details className="mosquito-debug__section" open>
            <summary className="mosquito-debug__section-title">
              <span>Visualization</span>
              <small>{config.isEnabled === false ? 'Off' : 'On'}</small>
            </summary>
            <div className="mosquito-debug__checkboxes">
              <label className="mosquito-debug__checkbox">
                <input
                  type="checkbox"
                  checked={config.isEnabled !== false}
                  onChange={(e) => onUpdateConfig('isEnabled', e.target.checked)}
                />
                <span>Enable mosquitoes</span>
              </label>

              <label className="mosquito-debug__checkbox">
                <input
                  type="checkbox"
                  checked={config.showBoundaries}
                  onChange={(e) => onUpdateConfig('showBoundaries', e.target.checked)}
                />
                <span>Show boundaries</span>
              </label>

              <label className="mosquito-debug__checkbox">
                <input
                  type="checkbox"
                  checked={config.showPaths}
                  onChange={(e) => onUpdateConfig('showPaths', e.target.checked)}
                />
                <span>Show flight paths</span>
              </label>
            </div>
          </details>
        </div>

        <button
          type="button"
          className="mosquito-debug__reset"
          onClick={onReset}
        >
          Reset All
        </button>
      </div>
    </div>
  );
}
