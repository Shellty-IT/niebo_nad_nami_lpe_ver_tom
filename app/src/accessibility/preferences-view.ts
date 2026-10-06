import { pl } from '../i18n/pl';
import type { Preferences } from './preferences';

export function mountPreferences(container: HTMLElement, initial: Preferences, onChange: (value: Preferences, future: boolean) => boolean) {
  const details = document.createElement('details'); details.className = 'nnb-preferences';
  const summary = document.createElement('summary'); summary.textContent = pl.accessibility;
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend'); legend.textContent = pl.preferencesTitle; fieldset.append(legend);
  function options(labelText: string, values: Array<[string, string]>, current: string) {
    const label = document.createElement('label'); label.textContent = labelText;
    const select = document.createElement('select');
    for (const [value, text] of values) {
      const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option);
    }
    select.value = current; label.append(select); fieldset.append(label); return select;
  }
  const contrast = options(pl.contrast, [['default', pl.defaultContrast], ['yellowOnBlack', pl.yellowOnBlack],
    ['blackOnYellow', pl.blackOnYellow], ['whiteOnBlack', pl.whiteOnBlack]], initial.contrast);
  const scale = options(pl.textSize, [['1', '100%'], ['1.25', '125%'], ['1.5', '150%'], ['2', '200%']], String(initial.textScale));
  function checkbox(labelText: string, checked: boolean) {
    const label = document.createElement('label'); label.textContent = labelText; label.className = 'nnb-checkbox';
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = checked;
    label.prepend(input); fieldset.append(label); return input;
  }
  const large = checkbox(pl.largeControls, initial.largeControls);
  const readable = checkbox(pl.readableText, initial.readableText);
  const motion = checkbox(pl.reducedMotion, initial.reducedMotion);
  const crosshair = checkbox(pl.crosshair, initial.crosshair);
  const future = checkbox(pl.rememberFuture, false);
  const note = document.createElement('p'); note.textContent = pl.preferencesNote;
  const button = document.createElement('button'); button.type = 'submit'; button.textContent = pl.applyPreferences;
  const message = document.createElement('p'); message.setAttribute('aria-live', 'polite');
  fieldset.append(note, button, message); form.append(fieldset); details.append(summary, form); container.append(details);
  function submit(event: Event) {
    event.preventDefault();
    const saved = onChange({ schemaVersion: 1, contrast: contrast.value as Preferences['contrast'],
      textScale: Number(scale.value) as Preferences['textScale'], largeControls: large.checked,
      readableText: readable.checked, reducedMotion: motion.checked, crosshair: crosshair.checked }, future.checked);
    message.textContent = saved ? (future.checked ? pl.preferencesSavedFuture : pl.preferencesSavedSession) : pl.preferencesSaveError;
  }
  form.addEventListener('submit', submit);
  return { destroy() { form.removeEventListener('submit', submit); details.remove(); } };
}
