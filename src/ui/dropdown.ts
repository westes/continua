export interface DropdownOptions {
  /** Accessible name for the whole control (e.g. "Display language"). */
  label: string;
  /** Plain text shown on the trigger button (escaped by the caller). */
  current: string;
  /** Inner HTML of the panel: links with class `dropdown-item`, one of which
   * may carry `aria-current="true"` to receive focus when opened. */
  panelHtml: string;
  className?: string;
}

let nextId = 0;

/** Renders a disclosure dropdown into `container`: a trigger button showing
 * the current choice plus a panel of real `<a href>` links. Callers bind
 * their own click handlers on the `.dropdown-item` links afterward; the
 * shell re-renders on every state change, which replaces this markup and so
 * closes the panel after a selection.
 *
 * Closes on Escape (focus back to the trigger), on focus leaving the
 * control, and on a pointer press elsewhere. While open, Up/Down/Home/End
 * move between items. */
export function mountDropdown(container: HTMLElement, options: DropdownOptions): void {
  const panelId = `dropdown-panel-${nextId++}`;
  container.innerHTML = `
    <div class="dropdown ${options.className ?? ''}">
      <button type="button" class="dropdown-trigger" aria-expanded="false" aria-controls="${panelId}" aria-label="${options.label}: ${options.current}">
        <span class="dropdown-current">${options.current}</span>
        <span class="dropdown-chevron" aria-hidden="true">&#9662;</span>
      </button>
      <div class="dropdown-panel" id="${panelId}" role="group" aria-label="${options.label}" hidden>
        ${options.panelHtml}
      </div>
    </div>
  `;

  const root = container.querySelector<HTMLElement>('.dropdown')!;
  const trigger = root.querySelector<HTMLButtonElement>('.dropdown-trigger')!;
  const panel = root.querySelector<HTMLElement>('.dropdown-panel')!;
  const items = (): HTMLElement[] => Array.from(panel.querySelectorAll<HTMLElement>('.dropdown-item'));

  const onPointerDown = (event: Event): void => {
    if (!root.contains(event.target as Node)) close(false);
  };

  function close(refocus: boolean): void {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onPointerDown, true);
    if (refocus) trigger.focus();
  }

  function open(): void {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onPointerDown, true);
    (panel.querySelector<HTMLElement>('[aria-current="true"]') ?? items()[0])?.focus();
  }

  trigger.addEventListener('click', () => {
    if (panel.hidden) open();
    else close(false);
  });

  root.addEventListener('keydown', (event) => {
    if (panel.hidden) {
      if (event.target === trigger && event.key === 'ArrowDown' && !event.altKey) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    let target: HTMLElement | undefined;
    if (event.key === 'ArrowDown') target = list[index < 0 ? 0 : Math.min(index + 1, list.length - 1)];
    else if (event.key === 'ArrowUp') target = list[index < 0 ? list.length - 1 : Math.max(index - 1, 0)];
    else if (event.key === 'Home') target = list[0];
    else if (event.key === 'End') target = list[list.length - 1];
    if (target) {
      event.preventDefault();
      target.focus();
    }
  });

  root.addEventListener('focusout', (event) => {
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (next && !root.contains(next)) close(false);
  });
}
