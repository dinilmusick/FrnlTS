import type { FrnlFrontendApiOptions, FrnlGeometry, FrnlMeasurementAdapter, FrnlRealizedState } from './frontend-api.js';

export type FrnlDomMeasurementAdapterOptions = {
  readonly root?: Document | HTMLElement;
};

/**
 * Optional browser adapter. Semantic component identity remains FrnlTS state;
 * the DOM only contributes realized geometry and visibility.
 */
export function createFrnlDomMeasurementAdapter(
  options: FrnlDomMeasurementAdapterOptions = {},
): FrnlMeasurementAdapter {
  const root = options.root ?? (typeof document === 'undefined' ? undefined : document);
  return {
    measure(componentId: string): FrnlRealizedState | undefined {
      if (!root) return undefined;
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(componentId) : componentId.replace(/["\\]/g, '\\\\$&');
      const element = root.querySelector<HTMLElement>(
        '[data-frnl-component][id="' + escaped + '"]',
      );
      if (!element) return { mounted: false, visible: false };
      const rect = element.getBoundingClientRect();
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      // This describes CSS visibility, independent of viewport clipping or overlap.
      const cssVisible = element.checkVisibility?.({
        opacityProperty: true,
        visibilityProperty: true,
        contentVisibilityAuto: true,
      }) ?? (
        style?.display !== 'none' &&
        style?.visibility !== 'hidden' &&
        style?.visibility !== 'collapse' &&
        Number(style?.opacity ?? 1) > 0
      );
      const visible = rect.width > 0 && rect.height > 0 && cssVisible;
      const view = element.ownerDocument.defaultView;
      const inViewport = view && Number.isFinite(view.innerWidth) && Number.isFinite(view.innerHeight)
        ? visible && rect.x + rect.width > 0 && rect.y + rect.height > 0
          && rect.x < view.innerWidth && rect.y < view.innerHeight
        : undefined;
      const geometry: FrnlGeometry = Object.freeze({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
      const layout = style && Object.freeze({
        tag: element.localName,
        display: style.display,
        position: style.position,
        visibility: style.visibility,
        opacity: style.opacity,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
      });
      return Object.freeze({ mounted: true, visible, ...(inViewport === undefined ? {} : { inViewport }), geometry, ...(layout ? { layout } : {}) });
    },
  };
}

export type { FrnlFrontendApiOptions };
