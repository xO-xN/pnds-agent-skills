import {positionAt} from './timeline.js';
const startButton = document.querySelector('#start');
const rail = document.querySelector('#rail');
const status = document.querySelector('#status');
let startedAt = null;
function draw(now) {
  const position = positionAt(startedAt, now);
  rail.style.setProperty('--position', `${position * 100}%`);
  if (position < 1) requestAnimationFrame(draw);
  else {
    status.textContent = 'Finished';
    startButton.disabled = false;
    startedAt = null;
  }
}
startButton.addEventListener('click', () => {
  if (startedAt !== null) return;
  startedAt = performance.now();
  startButton.disabled = true;
  status.textContent = 'Running';
  rail.style.setProperty('--position', '0%');
  requestAnimationFrame(draw);
});
