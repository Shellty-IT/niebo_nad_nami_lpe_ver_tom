export type ContrastMode = false | 'yellowOnBlack' | 'blackOnYellow' | 'whiteOnBlack';
export interface HostAdapter {
  resolveAsset(path: string, scope: 'engine' | 'lesson'): string;
  loadStyles(path: string): Promise<void>;
  notifyStateChanged(): Promise<void>;
  requestFullscreen(container: HTMLElement): Promise<void>;
  getEnvironment(): { kind: 'local' | 'zpe'; contrastMode: ContrastMode };
  createEphemerisWorker(): Worker | undefined;
  dispose(): void;
}
