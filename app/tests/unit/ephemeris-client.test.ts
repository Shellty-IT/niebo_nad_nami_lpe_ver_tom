import { afterEach, expect, it, vi } from 'vitest';
import { EphemerisClient } from '../../src/astronomy/ephemeris-client';
import { calculateSnapshot } from '../../src/astronomy/ephemeris';
import { parseConfig } from '../../src/domain/probe';
import defaults from '../../.generated/probe.json';
import type { EphemerisRequest, EphemerisResponse } from '../../src/workers/protocol';

const observation = parseConfig(defaults).initialObservation;
class FakeWorker {
  onmessage: ((event: { data: EphemerisResponse }) => void) | null = null;
  onerror: ((event: { preventDefault(): void }) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  sent: EphemerisRequest[] = [];
  terminated = false;
  postMessage(request: EphemerisRequest) { this.sent.push(request); }
  terminate() { this.terminated = true; }
  respond(index: number) {
    const request = this.sent[index]!;
    this.onmessage?.({ data: { revision: request.revision, snapshot: calculateSnapshot(request.observation) } });
  }
}
afterEach(() => vi.useRealTimers());

it('odrzuca nieaktualne wyniki i wysyła tylko najnowsze oczekujące żądanie', async () => {
  const worker = new FakeWorker();
  const client = new EphemerisClient(() => worker as unknown as Worker);
  const first = client.calculate(observation);
  const second = client.calculate({ ...observation, instantUtc: '2026-10-04T18:00:00.000Z' });
  const latestObservation = { ...observation, instantUtc: '2026-10-05T18:00:00.000Z' };
  const third = client.calculate(latestObservation);
  expect(await first).toBe(null); expect(await second).toBe(null);
  expect(worker.sent).toHaveLength(1);
  worker.respond(0);
  expect(worker.sent).toHaveLength(2);
  worker.respond(1);
  expect(await third).toEqual(calculateSnapshot(latestObservation));
  client.dispose();
});

it('po błędzie Workera oblicza to samo lokalnie i zwalnia zasoby', async () => {
  vi.useFakeTimers();
  const worker = new FakeWorker();
  const client = new EphemerisClient(() => worker as unknown as Worker);
  const result = client.calculate(observation);
  worker.onerror?.({ preventDefault() {} });
  await vi.runAllTimersAsync();
  expect(await result).toEqual(calculateSnapshot(observation));
  expect(client.getMode()).toBe('main-thread');
  expect(worker.terminated).toBe(true);
  client.dispose();
});

it('brak odpowiedzi uruchamia fallback, a dispose rozwiązuje oczekiwanie bez wyniku', async () => {
  vi.useFakeTimers();
  const worker = new FakeWorker();
  const client = new EphemerisClient(() => worker as unknown as Worker);
  const result = client.calculate(observation);
  await vi.runAllTimersAsync();
  expect(await result).toEqual(calculateSnapshot(observation));
  const cancelled = client.calculate(observation);
  client.dispose();
  expect(await cancelled).toBe(null);
});
