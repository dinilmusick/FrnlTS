import type { FrnlComponentSnapshot, FrnlFrontendApi } from './frontend-api.js';

export type FrnlUiSessionOptions = {
  api: FrnlFrontendApi;
  request?: typeof fetch;
  endpoint?: string;
  describe?: (component: FrnlComponentSnapshot) => unknown;
  allowAction?: (component: FrnlComponentSnapshot, action: string) => boolean;
  onError?: (error: unknown) => void;
};

type Command = { id: string; revision: string; componentId: string; controlId: string; payload?: unknown };
type Completion = { id: string; status: 'succeeded' | 'failed' };

function summarize(options: FrnlUiSessionOptions) {
  const { application, components } = options.api.inspect();
  return {
    version: 1,
    application,
    components: components.filter(component => component.rendered).map(component => ({
      id: component.id,
      parentId: component.parentId,
      type: component.type,
      state: component.state,
      presentation: component.presentation,
      realized: component.realized,
      details: options.describe?.(component),
      actions: component.realized.mounted && component.realized.visible && !component.presentation.disabled && !component.presentation.loading
        ? Object.values(component.controls)
          .filter(control => control.kind === 'event' && control.available &&
            options.allowAction?.(component, control.id))
          .map(control => control.id)
        : [],
    })),
  };
}

/** Share a deliberate, short-lived session from the tab that renders the app. */
export function startFrnlUiSession(options: FrnlUiSessionOptions) {
  const tabId = crypto.randomUUID();
  const endpoint = (options.endpoint ?? '/api/ui-session').replace(/\/$/, '') + '/' + tabId;
  const request = options.request ?? globalThis.fetch.bind(globalThis);
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revision = crypto.randomUUID();
  let lastSnapshot = '';
  let completion: Completion | undefined;

  async function synchronize() {
    try {
      const snapshot = summarize(options);
      const serialized = JSON.stringify(snapshot);
      if (serialized !== lastSnapshot) {
        lastSnapshot = serialized;
        revision = crypto.randomUUID();
      }
      const response = await request(endpoint + '/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision, snapshot, completion }),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: abort.signal,
      });
      if (!response.ok) throw new Error('UI session sync failed: ' + response.status);
      const result = await response.json() as { command: Command | null };
      completion = undefined;
      if (!abort.signal.aborted && result.command) {
        const { id, componentId, controlId, payload } = result.command;
        completion = { id, status: 'failed' };
        const current = summarize(options);
        if (result.command.revision === revision && JSON.stringify(current) === serialized &&
          current.components.find(component => component.id === componentId)?.actions.includes(controlId)) {
          await options.api.invoke(componentId, controlId, payload);
          completion = { id, status: 'succeeded' };
        }
      }
    } catch (error) {
      if (!abort.signal.aborted) options.onError?.(error);
    } finally {
      if (!abort.signal.aborted) timer = setTimeout(() => void synchronize(), 2_000);
    }
  }

  void synchronize();
  return {
    tabId,
    endpoint,
    stop() {
      if (abort.signal.aborted) return;
      abort.abort();
      clearTimeout(timer);
      void request(endpoint, { method: 'DELETE', credentials: 'same-origin', keepalive: true })
        .catch(error => options.onError?.(error));
    },
  };
}
