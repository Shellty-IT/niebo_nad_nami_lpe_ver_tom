import type { ProbeStore } from '../app/probe-store';
import type { SceneId } from '../domain/probe';
import type { HostAdapter } from '../hosts/host-adapter';
import { displayedChoices, testQuestions } from '../education/question-bank';
import { lessonSettings } from '../domain/lesson-settings';

export function mountAssessment(container: HTMLElement, store: ProbeStore, host: HostAdapter, openScene: (scene: SceneId) => void) {
  const section = document.createElement('section'); section.className = 'nnb-assessment';
  const title = document.createElement('h3'); title.textContent = 'Test przekrojowy';
  const intro = document.createElement('p');
  intro.textContent = 'Pytania obejmują E1–E6. Wybierz odpowiedź i sprawdź ją. Możesz wracać do pytań bez limitu czasu i bez kary za kolejną próbę. Otwarte wnioski z ćwiczeń omawia nauczyciel.';
  const score = document.createElement('p'); score.setAttribute('aria-live', 'polite');
  const list = document.createElement('div');
  const review = document.createElement('section'); const reviewTitle = document.createElement('h4'); reviewTitle.textContent = 'Powrót do błędnych odpowiedzi';
  const reviewList = document.createElement('ul'); review.append(reviewTitle, reviewList);
  section.append(title, intro, score, list, review); container.append(section);

  function render() {
    const state = store.getState();
    const settings = lessonSettings(store.getConfig());
    const questions = [...testQuestions(state.level).filter((question) => settings.sceneOrder.includes(question.sceneId)), ...settings.questions.filter((question) =>
      settings.sceneOrder.includes(question.sceneId) &&
      (question.level === state.level || question.level === 'basic')).map((question) => ({ ...question, objective: 'pytanie nauczyciela' }))];
    const latest = new Map(state.assessment.answers.map((answer) => [answer.questionId, answer]));
    const answered = questions.filter((question) => latest.has(question.id));
    const correct = questions.filter((question) => latest.get(question.id)?.correct);
    score.textContent = `Odpowiedziano: ${answered.length}/${questions.length}. Ostatnie poprawne odpowiedzi: ${correct.length}/${questions.length}. Zapisanych prób: ${state.assessment.answers.length}/500.`;
    list.replaceChildren(); reviewList.replaceChildren();
    for (const question of questions) {
      const fieldset = document.createElement('fieldset'); fieldset.id = `nnb-${question.id}`;
      const legend = document.createElement('legend'); legend.textContent = `${question.id} · ${question.stem}`;
      const source = document.createElement('p'); source.className = 'nnb-note'; source.textContent = `${question.sceneId} · cel ${question.objective}`;
      const choices = displayedChoices(question);
      for (const choice of choices) {
        const label = document.createElement('label'); label.className = 'nnb-checkbox';
        const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `nnb-${question.id}-answer`;
        radio.value = String(choice.originalIndex); radio.disabled = store.isFrozen() || state.assessment.answers.length >= 500;
        label.append(radio, document.createTextNode(choice.text)); fieldset.append(label);
      }
      const hint = document.createElement('details'); const hintTitle = document.createElement('summary'); hintTitle.textContent = 'Podpowiedź';
      const hintText = document.createElement('p'); hintText.textContent = question.hint; hint.append(hintTitle, hintText);
      const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
      const prior = latest.get(question.id);
      if (prior) feedback.textContent = `${prior.correct ? 'Poprawnie.' : 'Odpowiedź błędna.'} ${question.explanation} Próby: ${state.assessment.answers.filter((answer) => answer.questionId === question.id).length}.`;
      const actions = document.createElement('div'); actions.className = 'nnb-actions';
      const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź odpowiedź';
      check.disabled = store.isFrozen() || state.assessment.answers.length >= 500;
      check.addEventListener('click', () => {
        const selected = fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked');
        if (!selected) { feedback.textContent = 'Najpierw wybierz odpowiedź.'; return; }
        const saved = store.answerQuestion(question.id, Number(selected.value));
        if (!saved) { feedback.textContent = 'Nie można zapisać próby. Wyeksportuj stan lub sprawdź pamięć urządzenia.'; return; }
        void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać odpowiedzi na urządzeniu. Wyeksportuj stan.'; });
      });
      const returnButton = document.createElement('button'); returnButton.type = 'button'; returnButton.textContent = `Wróć do ${question.sceneId}`;
      returnButton.addEventListener('click', () => openScene(question.sceneId)); actions.append(check, returnButton);
      fieldset.prepend(legend, source); fieldset.append(hint, actions, feedback); list.append(fieldset);
      if (prior && !prior.correct) {
        const item = document.createElement('li'); const link = document.createElement('a'); link.href = `#${fieldset.id}`;
        link.textContent = `${question.id}: ${question.stem}`; item.append(link); reviewList.append(item);
      }
    }
    review.hidden = reviewList.childElementCount === 0;
  }
  const unsubscribe = store.subscribe(render); render();
  return { destroy() { unsubscribe(); section.remove(); } };
}
