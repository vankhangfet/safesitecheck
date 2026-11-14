import type { VisitSnapshot } from '../shared/contracts';
import type { Logger } from '../shared/logger';
import type { VerdictLabel } from '../shared/types';

export type IconState = 'checking' | VerdictLabel;

export interface IconModel {
  state: IconState;
  /** Text badge that repeats the symbol, so colour is never the only signal (BR4.1). */
  badgeText: string;
  /** The accessible name that announces the verdict (BR4.2). */
  title: string;
  color: string;
}

const APPEARANCE: Record<IconState, { badge: string; name: string; color: string }> = {
  checking: { badge: '...', name: 'Checking', color: '#5f6368' },
  safe: { badge: 'OK', name: 'Safe', color: '#1e7e34' },
  suspicious: { badge: '?', name: 'Suspicious', color: '#9a6700' },
  dangerous: { badge: '!', name: 'Dangerous', color: '#c5221f' },
  'could-not-check': { badge: '-', name: 'Could not check', color: '#5f6368' },
};

export function iconModel(snapshot: VisitSnapshot): IconModel {
  const state: IconState =
    snapshot.state === 'checking' ? 'checking' : (snapshot.label ?? 'could-not-check');
  const { badge, name, color } = APPEARANCE[state];
  const reason =
    state === 'could-not-check' && snapshot.reasonShort ? `, ${snapshot.reasonShort}` : '';
  return { state, badgeText: badge, title: `Phishing Guard: ${name}${reason}`, color };
}

/** The part of a 2D drawing surface the shield needs. Real canvases and test fakes both fit. */
export interface IconContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  closePath(): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
  getImageData(x: number, y: number, width: number, height: number): ImageData;
}

export interface IconCanvas {
  getContext(type: '2d'): IconContext | null;
}

export interface ActionApi {
  setBadgeText(details: { tabId: number; text: string }): Promise<void>;
  setBadgeBackgroundColor(details: { tabId: number; color: string }): Promise<void>;
  setTitle(details: { tabId: number; title: string }): Promise<void>;
  setIcon(details: { tabId: number; imageData: Record<number, ImageData> }): Promise<void>;
}

const ICON_SIZES = [16, 32];

/** Draws the shield with the state's symbol. The symbol is text, so shape differs by state. */
export function drawIcon(canvas: IconCanvas, size: number, model: IconModel): ImageData {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no drawing surface');
  context.clearRect(0, 0, size, size);
  context.fillStyle = model.color;
  context.beginPath();
  context.moveTo(size * 0.5, size * 0.04);
  context.lineTo(size * 0.92, size * 0.18);
  context.lineTo(size * 0.92, size * 0.52);
  context.quadraticCurveTo(size * 0.92, size * 0.82, size * 0.5, size * 0.96);
  context.quadraticCurveTo(size * 0.08, size * 0.82, size * 0.08, size * 0.52);
  context.lineTo(size * 0.08, size * 0.18);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  const small = model.badgeText.length > 1;
  context.font = `bold ${Math.round(size * (small ? 0.36 : 0.56))}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(model.badgeText, size * 0.5, size * 0.54);
  return context.getImageData(0, 0, size, size);
}

export interface ToolbarIcon {
  update(snapshot: VisitSnapshot): Promise<void>;
}

/**
 * BrowserPresenter, icon part: shows each tab's state on the toolbar icon. A failure leaves the
 * previous state in place and never touches the page (reliability design).
 */
export function createToolbarIcon(deps: {
  action: ActionApi;
  createCanvas: (size: number) => IconCanvas;
  logger: Logger;
}): ToolbarIcon {
  const { action, createCanvas, logger } = deps;
  return {
    async update(snapshot) {
      const model = iconModel(snapshot);
      const { tabId } = snapshot;
      const calls: Promise<void>[] = [
        action.setBadgeText({ tabId, text: model.badgeText }),
        action.setBadgeBackgroundColor({ tabId, color: model.color }),
        action.setTitle({ tabId, title: model.title }),
      ];
      try {
        const imageData: Record<number, ImageData> = {};
        for (const size of ICON_SIZES) imageData[size] = drawIcon(createCanvas(size), size, model);
        calls.push(action.setIcon({ tabId, imageData }));
      } catch {
        logger.error('internal-error');
      }
      const results = await Promise.allSettled(calls);
      if (results.some((result) => result.status === 'rejected')) logger.error('internal-error');
    },
  };
}
