import type { Level, ObjectId, ProbeConfig, SceneId } from './probe';
import { Body, Equator, Horizon, Observer } from 'astronomy-engine';

export interface LessonQuestion {
  id: string;
  sceneId: SceneId;
  level: Level;
  stem: string;
  choices: [string, string, string];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface LessonTask {
  id: string;
  sceneId: SceneId;
  kind: 'object' | 'coordinate';
  title: string;
  instruction: string;
  hint: string;
  targetObjectId: ObjectId | null;
  azimuthDeg: number | null;
  altitudeDeg: number | null;
  toleranceDeg: number | null;
}

export interface LessonSettings {
  sceneOrder: SceneId[];
  levels: Level[];
  defaultLevel: Level;
  visibleObjects: ObjectId[];
  layers: { stars: boolean; figure: boolean; boundary: boolean; name: boolean };
  dateFromUtc: string;
  dateToUtc: string;
  questions: LessonQuestion[];
  tasks: LessonTask[];
}

export const ALL_SCENES: SceneId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
export const ALL_LEVELS: Level[] = ['basic', 'extended', 'expert'];
export const ALL_OBJECTS: ObjectId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

export function lessonSettings(config: ProbeConfig): LessonSettings {
  return config.lesson ? {
    ...config.lesson,
    sceneOrder: [...config.lesson.sceneOrder], levels: [...config.lesson.levels],
    visibleObjects: [...config.lesson.visibleObjects], layers: { ...config.lesson.layers },
    questions: config.lesson.questions.map((question) => ({ ...question, choices: [...question.choices] as [string, string, string] })),
    tasks: config.lesson.tasks.map((task) => ({ ...task })),
  } : {
    sceneOrder: [...ALL_SCENES], levels: [...ALL_LEVELS], defaultLevel: 'basic',
    visibleObjects: [...ALL_OBJECTS], layers: { stars: true, figure: true, boundary: true, name: true },
    dateFromUtc: '1900-01-01T00:00:00.000Z', dateToUtc: '2100-12-31T23:59:59.999Z',
    questions: [], tasks: [],
  };
}

export function validateLessonSettings(settings: LessonSettings, config: ProbeConfig): string[] {
  const errors: string[] = [];
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!settings.sceneOrder.length || !unique(settings.sceneOrder)) errors.push('Wybierz co najmniej jedną scenę bez powtórzeń.');
  if (!settings.levels.length || !unique(settings.levels) || !settings.levels.includes(settings.defaultLevel)) errors.push('Wybierz poziomy i poziom domyślny.');
  if (!settings.visibleObjects.length || !unique(settings.visibleObjects)) errors.push('Wybierz widoczne obiekty.');
  const start = Date.parse(settings.dateFromUtc); const end = Date.parse(settings.dateToUtc);
  if (!Number.isFinite(start) || !Number.isFinite(end) ||
      new Date(start).toISOString() !== settings.dateFromUtc || new Date(end).toISOString() !== settings.dateToUtc ||
      settings.dateFromUtc >= settings.dateToUtc ||
      settings.dateFromUtc < '1900-01-01T00:00:00.000Z' || settings.dateToUtc > '2100-12-31T23:59:59.999Z') {
    errors.push('Zakres dat musi mieścić się w latach 1900–2100 i mieć poprawną kolejność.');
  }
  if (config.initialObservation.instantUtc < settings.dateFromUtc || config.initialObservation.instantUtc > settings.dateToUtc ||
      !settings.visibleObjects.includes(config.initialObservation.objectId)) errors.push('Obserwacja początkowa jest poza zakresem dat lub ma ukryty obiekt.');
  const ids = [...settings.questions.map((question) => question.id), ...settings.tasks.map((task) => task.id)];
  if (!unique(ids)) errors.push('Identyfikatory pytań i zadań muszą być unikalne.');
  for (const question of settings.questions) {
    if (!settings.sceneOrder.includes(question.sceneId) || !settings.levels.includes(question.level) ||
        !question.stem.trim() || question.choices.some((choice) => !choice.trim()) ||
        !question.hint.trim() || !question.explanation.trim() || question.correctIndex < 0 || question.correctIndex > 2 ||
        question.stem.length > 500 || question.choices.some((choice) => choice.length > 300) ||
        question.hint.length > 500 || question.explanation.length > 500) {
      errors.push(`Pytanie ${question.id}: uzupełnij treść, odpowiedzi, podpowiedź, wyjaśnienie i widoczną scenę/poziom.`);
    }
  }
  for (const task of settings.tasks) {
    if (task.sceneId !== 'E2' || !settings.sceneOrder.includes(task.sceneId) || !task.title.trim() || !task.instruction.trim() || !task.hint.trim() ||
        task.title.length > 120 || task.instruction.length > 500 || task.hint.length > 500)
      errors.push(`Zadanie ${task.id}: uzupełnij tytuł, polecenie, podpowiedź i widoczną scenę.`);
    if (task.kind === 'object' && (!task.targetObjectId || !settings.visibleObjects.includes(task.targetObjectId)))
      errors.push(`Zadanie ${task.id}: cel jest ukryty.`);
    if (task.kind === 'object' && task.targetObjectId && Number.isFinite(Date.parse(config.initialObservation.instantUtc))) {
      try {
        const instant = new Date(config.initialObservation.instantUtc);
        const place = config.initialObservation.observer;
        const observer = new Observer(place.latitudeDeg, place.longitudeDeg, place.heightM);
        const equator = Equator(Body[task.targetObjectId], instant, observer, true, true);
        const horizon = Horizon(instant, observer, equator.ra, equator.dec);
        if (horizon.altitude < 0) errors.push(`Zadanie ${task.id}: cel jest pod horyzontem dla daty i miejsca startowego.`);
      } catch { errors.push(`Zadanie ${task.id}: nie można obliczyć położenia celu.`); }
    }
    if (task.kind === 'coordinate' && (task.azimuthDeg === null || task.altitudeDeg === null || task.toleranceDeg === null ||
        task.azimuthDeg < 0 || task.azimuthDeg >= 360 || task.altitudeDeg < -89 || task.altitudeDeg > 89 ||
        task.toleranceDeg <= 0 || task.toleranceDeg > 15)) errors.push(`Zadanie ${task.id}: niepoprawny cel lub tolerancja.`);
  }
  return errors;
}
