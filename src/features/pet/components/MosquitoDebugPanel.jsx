import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const MOSQUITO_DEBUG_CONFIG_STORAGE_KEY = 'mosquito-debug-config';

export default function MosquitoDebugPanel({
  isOpen,
  onToggle,
  config,
  onUpdateConfig,
  onReset,
  mosquitoes
}) {
  const [saveStatus, setSaveStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const configSnippet = useMemo(
    () => `MOSQUITO_DEBUG_CONFIG = ${JSON.stringify(config, null, 2)};`,
    [config]
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

  const panelContent = isOpen ? (
    <div className="mosquito-debug__dock">
      <div
        id="mosquito-debug-panel"
        className="mosquito-debug__panel"
        onClick={(e) => e.stopPropagation()}
        role="region"
        aria-labelledby="mosquito-debug-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="mosquito-debug__close"
          onClick={onToggle}
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 id="mosquito-debug-title" className="mosquito-debug__title">🦟 Mosquito Debug Panel</h2>

        {/* Grid Layout */}
        <div className="mosquito-debug__grid">
          {/* Status */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">📊 Status</div>
            <div className="mosquito-debug__status">
              <div className="mosquito-debug__status-item">
                <span className="mosquito-debug__status-label">Active:</span>
                <span className="mosquito-debug__status-value">{mosquitoes.length}</span>
              </div>
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
                <span className="mosquito-debug__status-label">Flight:</span>
                <span className="mosquito-debug__status-value">{(config.flightDurationMinMs / 1000).toFixed(1)}s - {(config.flightDurationMaxMs / 1000).toFixed(1)}s</span>
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
          </div>

          {/* Current Settings */}
          <div className="mosquito-debug__section mosquito-debug__section--settings">
            <div className="mosquito-debug__section-title">🧾 Current Settings</div>
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
            </div>
            {(saveStatus || copyStatus) && (
              <div className="mosquito-debug__action-status" role="status">
                {[saveStatus, copyStatus].filter(Boolean).join(' · ')}
              </div>
            )}
            <pre className="mosquito-debug__config-info">{configSnippet}</pre>
          </div>

          {/* Spawn Settings */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">⏱️ Spawn Settings</div>

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
          </div>

          {/* Flight Speed */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">✈️ Flight Speed</div>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Fastest: <strong>{(config.flightDurationMinMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="1000"
                max="15000"
                step="100"
                value={config.flightDurationMinMs}
                onChange={(e) => onUpdateConfig('flightDurationMinMs', Number(e.target.value))}
              />
            </label>

            <label className="mosquito-debug__control">
              <span className="mosquito-debug__control-label">Slowest: <strong>{(config.flightDurationMaxMs / 1000).toFixed(1)}s</strong></span>
              <input
                type="range"
                min="1000"
                max="15000"
                step="100"
                value={config.flightDurationMaxMs}
                onChange={(e) => onUpdateConfig('flightDurationMaxMs', Number(e.target.value))}
              />
            </label>
          </div>

          {/* Shape & Path */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">🧬 Shape & Path</div>

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
          </div>

          {/* Stage Boundaries */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">📐 Stage Boundaries (%)</div>

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

          </div>

          {/* Visualization */}
          <div className="mosquito-debug__section">
            <div className="mosquito-debug__section-title">👁️ Visualization</div>
            <div className="mosquito-debug__checkboxes">
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
          </div>
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
  ) : null;

  return (
    <>
      {/* Toggle Button */}
      <div className="mosquito-debug">
        <button
          type="button"
          className="mosquito-debug__toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="mosquito-debug-panel"
        >
          🦟 Mosquito
        </button>
      </div>

      {panelContent && typeof document !== 'undefined' && createPortal(panelContent, document.body)}
    </>
  );
}
