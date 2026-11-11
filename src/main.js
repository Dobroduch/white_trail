// THE WHITE TRAIL — bootstrap.
import { Display, toggleFullscreen } from './engine/display.js';
import { Input } from './engine/input.js';
import { Loop } from './engine/loop.js';
import { loadSprites, loadNativeSheets, assetErrors } from './engine/assets.js';
import { Game } from './engine/game.js';
import { loadStationArt } from './world/stationArt.js';
import { loadTownArt } from './world/townArt.js';
import { loadNativeSceneArt } from './world/nativeArt.js';
import { Audio } from './audio/audio.js';
import { loadSettings } from './systems/save.js';
import { PauseMenu } from './ui/menus.js';
import { loadMapArt } from './ui/mapView.js';
import { loadHudIcons } from './ui/hud.js';
import { loadItemIcons } from './ui/itemIcons.js';

async function boot() {
  const canvas = document.getElementById('game');
  const bootEl = document.getElementById('boot');
  const display = new Display(canvas);
  const input = new Input(canvas);
  input.onFullscreen = () => toggleFullscreen();
  const settings = loadSettings();
  const audio = new Audio(settings);

  await loadSprites();
  await loadNativeSheets(); // Pixelorama native-density characters override the legacy sprites
  await loadStationArt();
  await loadTownArt();
  await loadNativeSceneArt();
  await Promise.all([loadMapArt(), loadHudIcons(), loadItemIcons()]);
  if (assetErrors().length) console.warn(`[boot] ${assetErrors().length} asset problem(s); see errors above. The game will continue with fallbacks.`);

  const game = new Game({ display, input, audio, settings });
  // Exposed for debugging and automated play-testing only.
  window.TWT = game;

  const loop = new Loop((dt) => game.update(dt), (a) => game.render(a));
  loop.start();
  bootEl.dataset.done = '1';
  bootEl.style.display = 'none';
  canvas.focus();

  // Pause safely on focus loss; never let story timers advance while hidden.
  const pauseForFocus = () => {
    if (game.mode === 'play' && !game.overlay) game.pushOverlay(new PauseMenu(game));
    audio.suspend();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForFocus();
    else { loop.last = performance.now(); }
  });
  window.addEventListener('blur', pauseForFocus);
  window.addEventListener('focus', () => { loop.last = performance.now(); });
  // Resume audio on the next interaction after returning.
  input.onKey(() => audio.resume());
}

boot().catch((err) => {
  console.error('[boot] fatal:', err);
  const b = document.getElementById('boot');
  if (b) { b.className = 'error'; b.style.display = 'flex'; document.getElementById('boot-msg').textContent = 'Failed to start: ' + err.message; }
});
