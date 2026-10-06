import type { ContrastMode } from '../host-adapter';

// Podzbiór oficjalnego kontraktu API z 03.02.2026, s. 7–13 i 23–24.
export interface ZpeApi {
  enginePath(path: string): string;
  dataPath(path: string): string;
  loadCss(realPath: string): Promise<void>;
  triggerStateSave(): Promise<void>;
  requestFullscreen(container: Element, onFullscreenExit: () => void): Promise<void>;
}
export interface ZpeOptions { data: unknown; contrastMode: ContrastMode }
export interface ZpeEditorApi extends Omit<ZpeApi, 'requestFullscreen'> {
  addEditorTab(id: string, name: string): ZpeEditorApi;
}
