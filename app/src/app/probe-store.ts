import { initialState, parseState, PLANET_IDS, VISIBLE_PLANETS_2025, type Observation, type ObservationPlan, type ObservationEntry, type ExtraCatalogId, type P3TaskState, type ProbeConfig, type ProbeState, type SceneId, type Level, type Mode, type TaskAttempt, type ObjectId } from '../domain/probe';
import type { SkyCamera } from '../domain/camera';
import { angularSeparationDeg } from '../education/coordinate-task';
import { questionById } from '../education/question-bank';
import { lessonSettings } from '../domain/lesson-settings';

export function createProbeStore(config: ProbeConfig) {
  const lesson = lessonSettings(config);
  function conformToLesson(candidate: ProbeState): ProbeState {
    const sceneId = lesson.sceneOrder.includes(candidate.sceneId) ? candidate.sceneId : lesson.sceneOrder[0]!;
    const level = lesson.levels.includes(candidate.level) ? candidate.level : lesson.defaultLevel;
    const observation = candidate.observation.instantUtc >= lesson.dateFromUtc &&
      candidate.observation.instantUtc <= lesson.dateToUtc && lesson.visibleObjects.includes(candidate.observation.objectId)
      ? candidate.observation : config.initialObservation;
    const activeTask = candidate.coordinateTask.active && sceneId === 'E2';
    return parseState({ ...candidate, sceneId, level, observation,
      playbackRate: sceneId === 'E2' ? candidate.playbackRate : 0,
      mode: candidate.coordinateTask.active && !activeTask ? 'explore' : candidate.mode,
      coordinateTask: activeTask ? candidate.coordinateTask : { ...candidate.coordinateTask, active: false, previousCamera: null } });
  }
  let state = conformToLesson(initialState(config));
  let frozen = false;
  const listeners = new Set<() => void>();
  function emit() { listeners.forEach((listener) => listener()); }
  function update(next: ProbeState): boolean {
    if (frozen || JSON.stringify(next) === JSON.stringify(state)) return false;
    state = parseState(next); emit(); return true;
  }
  function fixedPlanetView(requireAllPlanets: boolean): boolean {
    const instantUtc = '2025-01-16T20:00:00.000Z';
    const startingObject = lesson.visibleObjects.find((id) => id !== 'Mars');
    if (frozen || !lesson.sceneOrder.includes('E2') || instantUtc < lesson.dateFromUtc || instantUtc > lesson.dateToUtc ||
        !lesson.visibleObjects.includes('Mars') || !startingObject ||
        (requireAllPlanets && !PLANET_IDS.every((id) => lesson.visibleObjects.includes(id)))) return false;
    return update({ ...state, sceneId: 'E2', mode: 'learn', playbackRate: 0,
      observation: { ...state.observation, instantUtc, timeZone: 'Europe/Warsaw',
        objectId: startingObject, observer: { latitudeDeg: 52.2297, longitudeDeg: 21.0122, heightM: 100 } } });
  }

  return {
    getConfig: () => config,
    getState: (): ProbeState => ({ ...state, observation: { ...state.observation, observer: { ...state.observation.observer } }, camera: { ...state.camera },
      assessment: { answers: state.assessment.answers.map((answer) => ({ ...answer })) },
      taskAttempts: state.taskAttempts.map((attempt) => ({ ...attempt, ...(attempt.planetIds ? { planetIds: [...attempt.planetIds] } : {}) })),
      locationHistory: state.locationHistory.map((item) => ({ ...item })), observationPlan: state.observationPlan && { ...state.observationPlan, observer: { ...state.observationPlan.observer } },
      observationJournal: state.observationJournal.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
      p3Tasks: state.p3Tasks && { ...state.p3Tasks,
        sunRecords: state.p3Tasks.sunRecords.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
        moonRecords: state.p3Tasks.moonRecords.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
        telescope: state.p3Tasks.telescope && { ...state.p3Tasks.telescope } },
      coordinateTask: { ...state.coordinateTask, previousCamera: state.coordinateTask.previousCamera && { ...state.coordinateTask.previousCamera },
        lastReading: state.coordinateTask.lastReading && { ...state.coordinateTask.lastReading } } }),
    isFrozen: () => frozen,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    change(observation: Observation): boolean {
      if (frozen) return false;
      if (observation.instantUtc < lesson.dateFromUtc || observation.instantUtc > lesson.dateToUtc ||
          !lesson.visibleObjects.includes(observation.objectId)) return false;
      const locationChanged = JSON.stringify(observation.observer) !== JSON.stringify(state.observation.observer);
      const locationHistory = locationChanged ? [...state.locationHistory, { ...observation.observer }].slice(-100) : state.locationHistory;
      return update({ ...state, observation, locationHistory,
        selectedStarId: observation.objectId === state.observation.objectId ? state.selectedStarId : null });
    },
    selectObject(objectId: Observation['objectId']) {
      if (!lesson.visibleObjects.includes(objectId)) return false;
      return update({ ...state, observation: { ...state.observation, objectId }, selectedStarId: null, selectedCatalogId: null });
    },
    setSelectedStar(selectedStarId: number | null) {
      return update({ ...state, selectedStarId, selectedCatalogId: null });
    },
    setSelectedCatalog(selectedCatalogId: ExtraCatalogId | null) {
      return update({ ...state, selectedCatalogId, selectedStarId: null });
    },
    setCamera(camera: SkyCamera) { return update({ ...state, camera }); },
    setPlaybackRate(playbackRate: number) { return update({ ...state, playbackRate }); },
    navigate(sceneId: SceneId) {
      if (!lesson.sceneOrder.includes(sceneId)) return false;
      if (state.coordinateTask.active && sceneId !== 'E2') {
        return update({ ...state, sceneId, mode: 'explore',
          camera: state.coordinateTask.previousCamera ? { ...state.coordinateTask.previousCamera } : state.camera,
          coordinateTask: { ...state.coordinateTask, active: false, previousCamera: null } });
      }
      return update({ ...state, sceneId });
    },
    setLevel(level: Level) { return lesson.levels.includes(level) && update({ ...state, level }); },
    setMode(mode: Mode) { return update({ ...state, mode }); },
    saveObservationPlan(plan: ObservationPlan) { return update({ ...state, observationPlan: plan }); },
    addObservationEntry(entry: ObservationEntry) {
      return update({ ...state, observationJournal: [...state.observationJournal, entry].slice(-100) });
    },
    saveP3Tasks(tasks: P3TaskState) { return update({ ...state, p3Tasks: tasks }); },
    answerQuestion(questionId: string, choiceIndex: number) {
      const question = questionById(questionId) ?? lesson.questions.find((item) => item.id === questionId);
      if (!question || !Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length ||
          state.assessment.answers.length >= 500 || frozen) return null;
      const correct = choiceIndex === question.correctIndex;
      const answer = { questionId, choiceIndex, correct, attemptedAtUtc: new Date().toISOString() };
      update({ ...state, assessment: { answers: [...state.assessment.answers, answer] } });
      return answer;
    },
    startMarsTask() {
      return fixedPlanetView(false);
    },
    startVisiblePlanetsTask() { return fixedPlanetView(true); },
    checkVisiblePlanetsTask(selected: ObjectId[]): TaskAttempt | null {
      if (frozen || state.taskAttempts.length >= 500 || state.sceneId !== 'E2' || state.playbackRate !== 0 ||
          state.observation.instantUtc !== '2025-01-16T20:00:00.000Z' ||
          state.observation.observer.latitudeDeg !== 52.2297 || state.observation.observer.longitudeDeg !== 21.0122 ||
          !PLANET_IDS.every((id) => lesson.visibleObjects.includes(id)) ||
          selected.some((id) => !PLANET_IDS.includes(id)) || new Set(selected).size !== selected.length) return null;
      const planetIds = PLANET_IDS.filter((id) => selected.includes(id));
      const attempt: TaskAttempt = { taskId: 'VisiblePlanets', kind: 'planets', objectId: null,
        constellationId: null, planetIds, azimuthDeg: null, altitudeDeg: null, separationDeg: null,
        correct: planetIds.length === VISIBLE_PLANETS_2025.length &&
          VISIBLE_PLANETS_2025.every((id) => planetIds.includes(id)), attemptedAtUtc: new Date().toISOString() };
      update({ ...state, taskAttempts: [...state.taskAttempts, attempt] });
      return attempt;
    },
    checkPracticalTask(taskId: string): TaskAttempt | null {
      if (frozen || state.taskAttempts.length >= 500 || state.playbackRate !== 0) return null;
      const builtIn = taskId === 'Z01';
      const task = builtIn ? null : lesson.tasks.find((item) => item.id === taskId && item.sceneId === state.sceneId);
      if (!builtIn && !task) return null;
      if (builtIn && (state.sceneId !== 'E2' || state.observation.instantUtc !== '2025-01-16T20:00:00.000Z' ||
          state.observation.observer.latitudeDeg !== 52.2297 || state.observation.observer.longitudeDeg !== 21.0122)) return null;
      const kind = builtIn ? 'object' : task!.kind;
      const objectId = kind === 'object' ? state.observation.objectId : null;
      const separationDeg = kind === 'coordinate' ? angularSeparationDeg(state.camera.azimuthDeg, state.camera.altitudeDeg,
        task!.azimuthDeg!, task!.altitudeDeg!) : null;
      const attempt: TaskAttempt = {
        taskId, kind, objectId, constellationId: null, azimuthDeg: kind === 'coordinate' ? state.camera.azimuthDeg : null,
        altitudeDeg: kind === 'coordinate' ? state.camera.altitudeDeg : null, separationDeg,
        correct: kind === 'object' ? objectId === (builtIn ? 'Mars' : task!.targetObjectId) : separationDeg! <= task!.toleranceDeg!,
        attemptedAtUtc: new Date().toISOString(),
      };
      update({ ...state, taskAttempts: [...state.taskAttempts, attempt] });
      return attempt;
    },
    checkOrionTask(constellationId: string): TaskAttempt | null {
      if (frozen || state.taskAttempts.length >= 500 || state.sceneId !== 'E3' || !/^[A-Za-z]{3}$/.test(constellationId)) return null;
      const attempt: TaskAttempt = { taskId: 'Orion', kind: 'constellation', objectId: null, constellationId,
        azimuthDeg: null, altitudeDeg: null, separationDeg: null, correct: constellationId === 'Ori', attemptedAtUtc: new Date().toISOString() };
      update({ ...state, taskAttempts: [...state.taskAttempts, attempt] });
      return attempt;
    },
    setTaskNotes(hypothesis: string, conclusion: string) {
      if (hypothesis.length > 500 || conclusion.length > 500) return false;
      return update({ ...state, coordinateTask: { ...state.coordinateTask, hypothesis, conclusion } });
    },
    startCoordinateTask() {
      if (state.coordinateTask.active || !lesson.sceneOrder.includes('E2')) return false;
      return update({ ...state, sceneId: 'E2', mode: 'learn', playbackRate: 0,
        coordinateTask: { ...state.coordinateTask, active: true, previousCamera: { ...state.camera } } });
    },
    checkCoordinateTask() {
      if (frozen || !state.coordinateTask.active) return null;
      const separationDeg = angularSeparationDeg(state.camera.azimuthDeg, state.camera.altitudeDeg, 90, 30);
      const completed = separationDeg <= 2;
      const prior = state.coordinateTask.bestSeparationDeg;
      update({ ...state, coordinateTask: { ...state.coordinateTask, attempts: state.coordinateTask.attempts + 1,
        bestSeparationDeg: prior === null ? separationDeg : Math.min(prior, separationDeg),
        lastReading: { azimuthDeg: state.camera.azimuthDeg, altitudeDeg: state.camera.altitudeDeg,
          separationDeg, instantUtc: new Date().toISOString() },
        completedAtUtc: completed ? state.coordinateTask.completedAtUtc ?? new Date().toISOString() : state.coordinateTask.completedAtUtc } });
      return { separationDeg, completed };
    },
    leaveCoordinateTask() {
      if (!state.coordinateTask.active) return false;
      return update({ ...state, mode: 'explore',
        camera: state.coordinateTask.previousCamera ? { ...state.coordinateTask.previousCamera } : state.camera,
        coordinateTask: { ...state.coordinateTask, active: false, previousCamera: null } });
    },
    restore(value: unknown) {
      // Host musi móc podmienić podgląd ucznia także w stanie zamrożenia.
      // Walidacja przed przypisaniem zapewnia atomowe odrzucenie błędnego stanu.
      state = conformToLesson(value === null ? initialState(config) : parseState(value));
      emit();
    },
    setFrozen(value: boolean) { frozen = value; emit(); },
  };
}
export type ProbeStore = ReturnType<typeof createProbeStore>;
