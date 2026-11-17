import { expect, it, vi } from 'vitest';
import { startFrnlUiSession } from '../src/runtime/ui-session.js';
import type { FrnlFrontendApi } from '../src/runtime/frontend-api.js';

it('publishes a projected snapshot, invokes a registered event, and stops', async () => {
  vi.useFakeTimers();
  const invoke = vi.fn();
  const api = {
    inspect: () => ({
      application: { id: 'test' },
      components: [{
        id: 'menu', type: 'tilesMenu', rendered: true, state: 'idle',
        properties: { privateField: 'do not transmit' },
        presentation: { disabled: false, loading: false },
        realized: { mounted: true, visible: true },
        controls: {
          select: { id: 'select', kind: 'event', available: true },
          setState: { id: 'setState', kind: 'setState', available: true },
        },
      }],
    }),
    invoke,
  } as unknown as FrnlFrontendApi;
  const received: Record<string, unknown>[] = [];
  const request = vi.fn<typeof fetch>(async (_url, init) => {
    if (init?.method === 'DELETE') return new Response(null, { status: 204 });
    const body = JSON.parse(String(init?.body));
    received.push(body);
    return Response.json({ command: received.length === 1
      ? { id: 'action', revision: body.revision, componentId: 'menu', controlId: 'select', payload: 'tile' }
      : null });
  });
  const session = startFrnlUiSession({ api, request, allowAction: () => true });
  try {
    await vi.advanceTimersByTimeAsync(2_000);
    expect(invoke).toHaveBeenCalledExactlyOnceWith('menu', 'select', 'tile');
    expect(received[0].snapshot).toMatchObject({ components: [{ id: 'menu', actions: ['select'] }] });
    expect(JSON.stringify(received)).not.toContain('privateField');
    expect(received[1].completion).toEqual({ id: 'action', status: 'succeeded' });
  } finally {
    session.stop();
    vi.useRealTimers();
  }
  expect(request).toHaveBeenLastCalledWith(session.endpoint, expect.objectContaining({ method: 'DELETE' }));
});
