import { getState, goToNow, shiftDate, shiftHour } from '../app-state';
import { formatDateLong, hourLabel } from './format';

type Action = () => void;

// Two parallel sets, both always active: Alt+arrows/Alt+N (works even where
// plain keys are reserved) and plain punctuation/N (fast when nothing else
// claims them). Screen-reader users in browse mode may need their pass-through
// key first; that is expected.
const ALT_KEYS: Record<string, Action> = {
  ArrowUp: () => shiftHour(-1),
  ArrowDown: () => shiftHour(1),
  ArrowLeft: () => shiftDate(-1),
  ArrowRight: () => shiftDate(1),
};

const PLAIN_KEYS: Record<string, Action> = {
  '[': () => shiftHour(-1),
  ']': () => shiftHour(1),
  ',': () => shiftDate(-1),
  '.': () => shiftDate(1),
  n: () => goToNow(),
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

let clearTimer: ReturnType<typeof setTimeout> | undefined;
let activeListener: ((event: KeyboardEvent) => void) | undefined;

/** Mounted once from `shell.ts`. `announcer` is a visually hidden
 * `aria-live` element: keyboard moves don't move focus, so the new
 * hour/date is spoken through it. */
export function mountKeyboardShortcuts(announcer: HTMLElement): void {
  // Replace any earlier listener so a re-mount (tests) doesn't stack handlers.
  if (activeListener) document.removeEventListener('keydown', activeListener);
  activeListener = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
    if (isTypingTarget(event.target)) return;
    if (document.querySelector('dialog[open]')) return;

    let action: Action | undefined;
    if (event.altKey) {
      // `code` for N: Alt+letter yields alternate characters on macOS.
      action = event.code === 'KeyN' ? PLAIN_KEYS['n'] : ALT_KEYS[event.key];
    } else if (!(event.target instanceof HTMLElement && event.target.closest('.dropdown-panel'))) {
      action = PLAIN_KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    }
    if (!action) return;

    event.preventDefault();
    action();
    const { date, selectedHour } = getState();
    announcer.textContent = `${hourLabel(selectedHour)}, ${formatDateLong(date).en ?? date}`;
    // Clear afterward so the text doesn't linger as a stray line to arrow
    // onto in browse mode; the live region has already spoken it.
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      announcer.textContent = '';
    }, 2000);
  };
  document.addEventListener('keydown', activeListener);
}
