import data from '../../.generated/questions.json';
import type { Level, SceneId } from '../domain/probe';

export interface Question {
  id: string;
  sceneId: SceneId;
  level: Level;
  objective: string;
  stem: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export const questions = data.questions as Question[];
const byId = new Map(questions.map((question) => [question.id, question]));
export function questionById(id: string): Question | undefined { return byId.get(id); }

export function testQuestions(level: Level, count = 12): Question[] {
  const allowed = level === 'basic' ? ['basic'] : level === 'extended' ? ['basic', 'extended'] : ['basic', 'extended', 'expert'];
  const scenes: SceneId[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
  const groups = scenes.map((sceneId) => questions.filter((question) => question.sceneId === sceneId && allowed.includes(question.level)));
  const selected: Question[] = [];
  for (const group of groups) {
    const basic = group.find((question) => question.level === 'basic');
    const tier = group.find((question) => question.level === level && question !== basic) ?? group.find((question) => question !== basic);
    if (basic) selected.push(basic);
    if (tier) selected.push(tier);
  }
  if (selected.length >= count) return selected.slice(0, count);
  for (let round = 0; selected.length < count && groups.some((group) => group[round]); round++) {
    for (const group of groups) {
      const question = group[round];
      if (question && !selected.includes(question)) selected.push(question);
      if (selected.length === count) break;
    }
  }
  return selected;
}

export function displayedChoices(question: Question): Array<{ text: string; originalIndex: number }> {
  const rotation = Number(question.id.replace(/^[^0-9]+/, '')) % question.choices.length;
  return question.choices.map((_, index) => {
    const originalIndex = (index + rotation) % question.choices.length;
    return { text: question.choices[originalIndex]!, originalIndex };
  });
}
