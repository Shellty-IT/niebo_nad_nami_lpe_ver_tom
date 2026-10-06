import { validateConfig, validateState, validateObservation, validateLegacyConfig, validateLegacyState, validateV2State, validateV3State, validateV4State, validateV5State, validateV6State, validateV6Config, validateV7State, validateV7Config } from '../../.generated/validators.js';
import { DEFAULT_CAMERA, type SkyCamera } from './camera';
import { questionById } from '../education/question-bank';
import { lessonSettings, validateLessonSettings, type LessonSettings } from './lesson-settings';

export type ObjectId = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune';
export type SceneId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
export type Level = 'basic' | 'extended' | 'expert';
export type Mode = 'explore' | 'learn';
export type ExtraCatalogId = 'M31' | 'M42' | 'Ceres' | '67P' | 'Io' | 'Europa' | 'Ganymede' | 'Callisto';
export interface ObserverLocation { latitudeDeg: number; longitudeDeg: number; heightM: number }
export const DEFAULT_OBSERVER: ObserverLocation = { latitudeDeg: 52.2297, longitudeDeg: 21.0122, heightM: 100 };
export interface Observation {
  instantUtc: string;
  timeZone: string;
  objectId: ObjectId;
  observer: ObserverLocation;
  refraction: boolean;
}
interface Identity {
  lessonId: 'p0-host-probe';
  contentVersion: '0.3.0';
}
export interface ProbeConfig extends Identity { schemaVersion: 2; initialObservation: Observation; lesson?: LessonSettings }
export interface CoordinateTaskState {
  active: boolean;
  previousCamera: SkyCamera | null;
  attempts: number;
  bestSeparationDeg: number | null;
  completedAtUtc: string | null;
  hypothesis: string;
  conclusion: string;
  lastReading: { azimuthDeg: number; altitudeDeg: number; separationDeg: number; instantUtc: string } | null;
}
export interface ObservationPlan {
  dateUtc: string;
  observer: ObserverLocation;
  equipment: 'Gołe oko' | 'Lornetka' | 'Teleskop';
  conditions: string;
}
export interface ObservationEntry {
  instantUtc: string;
  observer: ObserverLocation;
  objectId: ObjectId;
  azimuthDeg: number;
  altitudeDeg: number;
  phaseFraction: number | null;
  note: string;
}
export interface P3TaskState {
  sunRecords: Array<{ date: string; observer: ObserverLocation; riseUtc: string | null; transitUtc: string | null;
    setUtc: string | null; transitAltitudeDeg: number | null }>;
  sunConclusion: string;
  moonRecords: Array<{ quarter: number; instantUtc: string; observer: ObserverLocation; litFraction: number;
    phaseAngleDeg: number; brightLimbAngleDeg: number }>;
  moonConclusion: string;
  telescope: { eyepieceMm: number; magnification: number; fieldDeg: number; prediction: 'smaller' | 'larger'; conclusion: string } | null;
}
export const INITIAL_P3_TASKS: P3TaskState = { sunRecords: [], sunConclusion: '', moonRecords: [], moonConclusion: '', telescope: null };
export const INITIAL_COORDINATE_TASK: CoordinateTaskState = {
  active: false, previousCamera: null, attempts: 0, bestSeparationDeg: null, completedAtUtc: null,
  hypothesis: '', conclusion: '', lastReading: null,
};
export interface QuestionAnswer { questionId: string; choiceIndex: number; correct: boolean; attemptedAtUtc: string }
export interface AssessmentState { answers: QuestionAnswer[] }
export interface TaskAttempt { taskId: string; kind: 'object' | 'coordinate' | 'constellation' | 'planets'; objectId: ObjectId | null; constellationId: string | null; planetIds?: ObjectId[]; azimuthDeg: number | null; altitudeDeg: number | null; separationDeg: number | null; correct: boolean; attemptedAtUtc: string }
export const VISIBLE_PLANETS_2025: ObjectId[] = ['Mars', 'Jupiter', 'Uranus', 'Neptune'];
export const PLANET_IDS: ObjectId[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
export interface ProbeState extends Identity { schemaVersion: 8; sessionId: string; assessment: AssessmentState; taskAttempts: TaskAttempt[]; observation: Observation; camera: SkyCamera; playbackRate: number; sceneId: SceneId; level: Level; mode: Mode; locationHistory: ObserverLocation[]; selectedStarId: number | null; selectedCatalogId?: ExtraCatalogId | null; coordinateTask: CoordinateTaskState; observationPlan: ObservationPlan | null; observationJournal: ObservationEntry[]; p3Tasks: P3TaskState }
let validatedTimeZone: string | undefined;

function newSessionId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function parseObservation(input: unknown): Observation {
  if (!validateObservation(input)) throw new Error('invalid-observation');
  const value = input as Observation;
  const instant = new Date(value.instantUtc);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== value.instantUtc) {
    throw new Error('invalid-instant');
  }
  // Strefa jest wyłącznie sposobem prezentacji; nie zmienia chwili UTC.
  if (validatedTimeZone !== value.timeZone) {
    new Intl.DateTimeFormat('pl-PL', { timeZone: value.timeZone });
    validatedTimeZone = value.timeZone;
  }
  return { ...value, observer: { ...value.observer } };
}

function migrate(value: unknown, field: 'observation' | 'initialObservation'): unknown {
  const valid = field === 'observation' ? validateLegacyState(value) : validateLegacyConfig(value);
  if (!valid) return value;
  const legacy = value as Record<string, unknown>;
  return { ...legacy, schemaVersion: 2, [field]: {
    ...(legacy[field] as object), observer: { ...DEFAULT_OBSERVER }, refraction: false,
  } };
}

export function parseConfig(value: unknown): ProbeConfig {
  value = migrate(value, 'initialObservation');
  if (validateV6Config(value)) value = { ...(value as object), contentVersion: '0.2.0' };
  if (validateV7Config(value)) value = { ...(value as object), contentVersion: '0.3.0' };
  if (!validateConfig(value)) throw new Error('invalid-config');
  const config = value as ProbeConfig;
  if (config.lesson && validateLessonSettings(config.lesson, config).length) throw new Error('invalid-lesson');
  return { ...config, initialObservation: parseObservation(config.initialObservation),
    ...(config.lesson ? { lesson: lessonSettings(config) } : {}) };
}

export function parseState(value: unknown): ProbeState {
  value = migrate(value, 'observation');
  if (value && typeof value === 'object' && 'schemaVersion' in value &&
      typeof value.schemaVersion === 'number' && value.schemaVersion < 7) {
    const { sessionId: _sessionId, assessment: _assessment, taskAttempts: _taskAttempts, ...legacy } = value as Record<string, unknown>;
    value = legacy;
  }
  if (value && typeof value === 'object' && 'schemaVersion' in value &&
      typeof value.schemaVersion === 'number' && value.schemaVersion < 6) {
    const { p3Tasks: _p3Tasks, selectedCatalogId: _selectedCatalogId, ...legacy } = value as Record<string, unknown>;
    value = legacy;
  }
  if (validateV2State(value)) value = { ...(value as object), schemaVersion: 3, camera: { ...DEFAULT_CAMERA }, playbackRate: 0 };
  if (validateV3State(value)) value = { ...(value as object), schemaVersion: 4, sceneId: 'E1', level: 'basic', mode: 'explore',
    locationHistory: [{ ...((value as { observation: Observation }).observation.observer) }] };
  if (validateV4State(value)) value = { ...(value as object), schemaVersion: 5,
    coordinateTask: { active: false, previousCamera: null, attempts: 0, bestSeparationDeg: null, completedAtUtc: null } };
  if (validateV5State(value)) value = { ...(value as object), schemaVersion: 6, coordinateTask: {
    ...((value as { coordinateTask: CoordinateTaskState }).coordinateTask), hypothesis: '', conclusion: '', lastReading: null } };
  if (validateV6State(value)) value = { ...(value as object), schemaVersion: 7, contentVersion: '0.2.0',
    sessionId: newSessionId(), assessment: { answers: [] } };
  if (validateV7State(value)) value = { ...(value as object), schemaVersion: 8, contentVersion: '0.3.0',
    taskAttempts: (value as { taskAttempts?: TaskAttempt[] }).taskAttempts ?? [] };
  if (!validateState(value)) throw new Error('invalid-state');
  const state = value as ProbeState;
  if (state.assessment.answers.some((answer) => {
    const question = questionById(answer.questionId);
    const instant = new Date(answer.attemptedAtUtc);
    return (!question && !/^TQ[0-9]{2,3}$/.test(answer.questionId)) ||
      answer.choiceIndex >= (question?.choices.length ?? 3) ||
      (question !== undefined && answer.correct !== (answer.choiceIndex === question.correctIndex)) ||
      !Number.isFinite(instant.getTime()) || instant.toISOString() !== answer.attemptedAtUtc;
  })) throw new Error('invalid-assessment');
  const taskAttempts = state.taskAttempts ?? [];
  if (taskAttempts.some((attempt) => {
    const instant = new Date(attempt.attemptedAtUtc);
    return !Number.isFinite(instant.getTime()) || instant.toISOString() !== attempt.attemptedAtUtc ||
      (attempt.taskId === 'Z01' && (attempt.kind !== 'object' || attempt.correct !== (attempt.objectId === 'Mars'))) ||
      (attempt.taskId === 'Orion' && (attempt.kind !== 'constellation' || attempt.correct !== (attempt.constellationId === 'Ori'))) ||
      (attempt.taskId === 'VisiblePlanets' && (attempt.kind !== 'planets' || !attempt.planetIds ||
        new Set(attempt.planetIds).size !== attempt.planetIds.length ||
        attempt.correct !== (attempt.planetIds.length === VISIBLE_PLANETS_2025.length &&
          VISIBLE_PLANETS_2025.every((id) => attempt.planetIds!.includes(id)))));
  })) throw new Error('invalid-task-attempts');
  const plan = state.observationPlan ?? null;
  const journal = state.observationJournal ?? [];
  const p3Tasks = state.p3Tasks ?? INITIAL_P3_TASKS;
  const validInstant = (instant: string) => {
    const date = new Date(instant);
    return Number.isFinite(date.getTime()) && date.toISOString() === instant && instant >= '1900-01-01T00:00:00.000Z' && instant <= '2100-12-31T23:59:59.999Z';
  };
  const moonRecords = [...p3Tasks.moonRecords].sort((a, b) => a.instantUtc.localeCompare(b.instantUtc));
  const firstMoon = moonRecords[0];
  const invalidMoonSeries = moonRecords.some((entry, index) =>
    (firstMoon !== undefined && (entry.observer.latitudeDeg !== firstMoon.observer.latitudeDeg ||
      entry.observer.longitudeDeg !== firstMoon.observer.longitudeDeg || entry.observer.heightM !== firstMoon.observer.heightM)) ||
    (index > 0 && (entry.quarter !== (moonRecords[index - 1]!.quarter + 1) % 4 ||
      (Date.parse(entry.instantUtc) - Date.parse(moonRecords[index - 1]!.instantUtc)) / 86_400_000 < 3 ||
      (Date.parse(entry.instantUtc) - Date.parse(moonRecords[index - 1]!.instantUtc)) / 86_400_000 > 11)));
  if (p3Tasks.sunRecords.length > 4 || p3Tasks.moonRecords.length > 4 ||
      p3Tasks.sunConclusion.length > 500 || p3Tasks.moonConclusion.length > 500 ||
      (p3Tasks.telescope !== null && p3Tasks.telescope.conclusion.length > 500) ||
      p3Tasks.sunRecords.some((entry) => !['2025-03-20','2025-06-21','2025-09-22','2025-12-21'].includes(entry.date) ||
        [entry.riseUtc,entry.transitUtc,entry.setUtc].some((value) => value !== null && (!validInstant(value) || value.slice(0,10) !== entry.date))) ||
      new Set(p3Tasks.sunRecords.map((entry) => entry.date)).size !== p3Tasks.sunRecords.length ||
      p3Tasks.sunRecords.some((entry) => entry.observer.latitudeDeg !== p3Tasks.sunRecords[0]?.observer.latitudeDeg ||
        entry.observer.longitudeDeg !== p3Tasks.sunRecords[0]?.observer.longitudeDeg ||
        entry.observer.heightM !== p3Tasks.sunRecords[0]?.observer.heightM) ||
      p3Tasks.moonRecords.some((entry) => !validInstant(entry.instantUtc)) ||
      new Set(p3Tasks.moonRecords.map((entry) => entry.quarter)).size !== p3Tasks.moonRecords.length || invalidMoonSeries ||
      (p3Tasks.telescope !== null && (p3Tasks.telescope.eyepieceMm < 5 || p3Tasks.telescope.eyepieceMm >= 25))) {
    throw new Error('invalid-p3-tasks');
  }
  for (const entry of journal) {
    const instant = new Date(entry.instantUtc);
    if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== entry.instantUtc ||
        entry.instantUtc.slice(0, 10) < '1900-01-01' || entry.instantUtc.slice(0, 10) > '2100-12-31' ||
        entry.note.length > 500 || (entry.phaseFraction !== null && (entry.phaseFraction < 0 || entry.phaseFraction > 1))) {
      throw new Error('invalid-observation-journal');
    }
  }
  if (plan !== null) {
    const date = new Date(`${plan.dateUtc}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== plan.dateUtc ||
        plan.dateUtc < '1900-01-01' || plan.dateUtc > '2100-12-31' || plan.conditions.length > 500) {
      throw new Error('invalid-observation-plan');
    }
  }
  if ((state.coordinateTask.active && (state.coordinateTask.previousCamera === null || state.sceneId !== 'E2' || state.mode !== 'learn')) ||
      (!state.coordinateTask.active && state.coordinateTask.previousCamera !== null) ||
      ((state.coordinateTask.attempts === 0) !== (state.coordinateTask.bestSeparationDeg === null)) ||
      (state.coordinateTask.attempts === 0 && state.coordinateTask.lastReading !== null) ||
      state.coordinateTask.hypothesis.length > 500 || state.coordinateTask.conclusion.length > 500 ||
      (state.coordinateTask.completedAtUtc !== null && (state.coordinateTask.bestSeparationDeg === null || state.coordinateTask.bestSeparationDeg > 2 ||
        new Date(state.coordinateTask.completedAtUtc).toISOString() !== state.coordinateTask.completedAtUtc)) ||
      (state.coordinateTask.lastReading !== null && new Date(state.coordinateTask.lastReading.instantUtc).toISOString() !== state.coordinateTask.lastReading.instantUtc)) {
    throw new Error('invalid-coordinate-task');
  }
  return { ...state, assessment: { answers: state.assessment.answers.map((answer) => ({ ...answer })) },
    taskAttempts: taskAttempts.map((attempt) => ({ ...attempt, ...(attempt.planetIds ? { planetIds: [...attempt.planetIds] } : {}) })),
    selectedStarId: state.selectedStarId ?? null, selectedCatalogId: state.selectedCatalogId ?? null,
    p3Tasks: { ...p3Tasks, sunRecords: p3Tasks.sunRecords.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
      moonRecords: p3Tasks.moonRecords.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
      telescope: p3Tasks.telescope && { ...p3Tasks.telescope } }, observationPlan: plan && { ...plan, observer: { ...plan.observer } },
    observationJournal: journal.map((entry) => ({ ...entry, observer: { ...entry.observer } })),
    observation: parseObservation(state.observation), camera: { ...state.camera },
    locationHistory: state.locationHistory.map((item) => ({ ...item })),
    coordinateTask: { ...state.coordinateTask, previousCamera: state.coordinateTask.previousCamera && { ...state.coordinateTask.previousCamera },
      lastReading: state.coordinateTask.lastReading && { ...state.coordinateTask.lastReading } } };
}

export function initialState(config: ProbeConfig): ProbeState {
  return parseState({
    schemaVersion: 8,
    lessonId: config.lessonId,
    contentVersion: config.contentVersion,
    sessionId: newSessionId(), assessment: { answers: [] },
    taskAttempts: [],
    observation: config.initialObservation,
    camera: { ...DEFAULT_CAMERA },
    playbackRate: 0,
    sceneId: 'E1', level: 'basic', mode: 'explore', locationHistory: [{ ...config.initialObservation.observer }], selectedStarId: null,
    coordinateTask: { ...INITIAL_COORDINATE_TASK }, observationPlan: null, observationJournal: [], selectedCatalogId: null,
    p3Tasks: { ...INITIAL_P3_TASKS },
  });
}
