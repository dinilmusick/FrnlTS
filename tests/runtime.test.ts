import { describe, expect, it, vi } from 'vitest';
import {
  createLifecycle,
  defineContract,
  defineCommand,
  defineCapability,
  defineEffect,
  LifecycleError,
  FrnlFault,
} from '../src/runtime/core.js';
import {
  createScope,
  defineResource,
  createResourceController,
} from '../src/runtime/resources.js';
import { FrnlRegistry } from '../src/runtime/registry.js';
import { DependencyGraph } from '../src/runtime/dependencies.js';
import { matchRoute, buildRouteUrl, FrnlRouter } from '../src/runtime/routing.js';
import { validateAccessibility } from '../src/runtime/accessibility.js';
import * as RootExports from '../src/index.js';
import * as RuntimeExports from '../src/runtime/index.js';
import * as ReactExports from '../src/react/index.js';

describe('FrnlTS Frontend Runtime', () => {
  describe('Lifecycle Controller', () => {
    it('enforces valid forward lifecycle transitions', () => {
      const lc = createLifecycle();
      expect(lc.phase).toBe('created');

      lc.transition('initializing');
      expect(lc.phase).toBe('initializing');

      lc.transition('mounted');
      expect(lc.phase).toBe('mounted');

      lc.transition('active');
      expect(lc.phase).toBe('active');

      lc.transition('suspended');
      expect(lc.phase).toBe('suspended');

      lc.transition('resuming');
      expect(lc.phase).toBe('resuming');

      lc.transition('active');
      expect(lc.phase).toBe('active');

      lc.transition('disposing');
      expect(lc.phase).toBe('disposing');

      lc.transition('disposed');
      expect(lc.phase).toBe('disposed');
    });

    it('rejects invalid or impossible transitions with LifecycleError', () => {
      const lc = createLifecycle();
      expect(() => lc.transition('active')).toThrow(LifecycleError);
      expect(() => lc.transition('mounted')).toThrow(LifecycleError);

      lc.transition('initializing');
      expect(() => lc.transition('created')).toThrow(LifecycleError);

      lc.transition('mounted');
      lc.transition('active');
      expect(() => lc.transition('created')).toThrow(LifecycleError);
      expect(() => lc.transition('initializing')).toThrow(LifecycleError);

      lc.transition('disposing');
      lc.transition('disposed');
      // No transitions out of disposed
      expect(() => lc.transition('created')).toThrow(LifecycleError);
      expect(() => lc.transition('active')).toThrow(LifecycleError);
    });

    it('handles idempotent transitions to current phase without error or duplicate events', () => {
      const lc = createLifecycle('initializing');
      const listener = vi.fn();
      lc.subscribe(listener);

      lc.transition('initializing');
      expect(listener).not.toHaveBeenCalled();
      expect(lc.phase).toBe('initializing');
    });

    it('notifies subscribers on valid transitions and supports unsubscribing', () => {
      const lc = createLifecycle();
      const events: Array<{ from: string; to: string }> = [];
      const unsub = lc.subscribe((t) => events.push(t));

      lc.transition('initializing');
      lc.transition('mounted');
      expect(events).toEqual([
        { from: 'created', to: 'initializing' },
        { from: 'initializing', to: 'mounted' },
      ]);

      unsub();
      lc.transition('active');
      expect(events).toHaveLength(2);
    });

    it('recovers from failed state back to initializing or disposed', () => {
      const lc = createLifecycle('initializing');
      lc.transition('failed');
      expect(lc.phase).toBe('failed');

      lc.transition('initializing');
      expect(lc.phase).toBe('initializing');

      lc.transition('failed');
      lc.transition('disposed');
      expect(lc.phase).toBe('disposed');
    });
  });

  describe('Contracts, Commands, Capabilities and Effects', () => {
    it('validates and freezes semantic contracts', () => {
      const contract = defineContract({
        id: 'button-action',
        version: 1,
        commands: ['trigger', 'reset'],
        events: ['clicked'],
        capabilities: ['dom-focus'],
      });
      expect(contract.id).toBe('button-action');
      expect(contract.version).toBe(1);
      expect(Object.isFrozen(contract)).toBe(true);

      // Rejects invalid version
      expect(() =>
        defineContract({
          id: 'bad',
          version: -1,
        } as any)
      ).toThrow();
    });

    it('validates and defines commands', () => {
      const cmd = defineCommand('mutate-state', { counter: 42 });
      expect(cmd.id).toBe('mutate-state');
      expect(cmd.payload).toEqual({ counter: 42 });
      expect(Object.isFrozen(cmd)).toBe(true);

      expect(() => defineCommand('')).toThrow();
    });

    it('validates and defines capabilities', () => {
      const cap = defineCapability({
        id: 'canvas-renderer',
        version: 2,
        provides: ['2d-context', 'webgl'],
        requires: ['window'],
      });
      expect(cap.id).toBe('canvas-renderer');
      expect(cap.version).toBe(2);
      expect(Object.isFrozen(cap)).toBe(true);
    });

    it('defines effects and executes with AbortSignal', async () => {
      const effect = defineEffect('fetch-data', async (signal) => {
        if (signal.aborted) throw new Error('aborted');
        return 'success';
      });

      const controller = new AbortController();
      await expect(effect.run(controller.signal)).resolves.toBe('success');

      controller.abort();
      await expect(effect.run(controller.signal)).rejects.toThrow('aborted');
    });

    it('preserves structured causes in FrnlFault', () => {
      const originalErr = new Error('Database connection failed');
      const fault = new FrnlFault({
        code: 'STORAGE_UNAVAILABLE',
        message: 'Could not connect to storage backend',
        recoverable: true,
        retryable: true,
        cause: originalErr,
      });

      expect(fault.name).toBe('FrnlFault');
      expect(fault.code).toBe('STORAGE_UNAVAILABLE');
      expect(fault.recoverable).toBe(true);
      expect(fault.retryable).toBe(true);
      expect(fault.cause).toBe(originalErr);
    });
  });

  describe('Scoped Resources and Lifecycle', () => {
    it('acquires resource and caches value idempotently', async () => {
      let acquireCount = 0;
      const res = defineResource({
        id: 'api-client',
        acquire: async () => {
          acquireCount++;
          return { connected: true };
        },
      });

      const scope = createScope('test-scope');
      const ctrl = scope.add(res);

      expect(ctrl.status).toBe('idle');
      const val1 = await ctrl.load();
      expect(ctrl.status).toBe('ready');
      expect(val1).toEqual({ connected: true });
      expect(acquireCount).toBe(1);

      // Subsequent loads return cached value without invoking acquire again
      const val2 = await ctrl.load();
      expect(val2).toBe(val1);
      expect(acquireCount).toBe(1);

      await scope.dispose();
      expect(ctrl.status).toBe('released');
    });

    it('deduplicates concurrent in-flight load requests', async () => {
      let acquireCalls = 0;
      const res = defineResource({
        id: 'concurrent-res',
        acquire: async () => {
          acquireCalls++;
          await new Promise((r) => setTimeout(r, 20));
          return 'done';
        },
      });

      const scope = createScope('concurrent-scope');
      const ctrl = scope.add(res);

      const [r1, r2, r3] = await Promise.all([ctrl.load(), ctrl.load(), ctrl.load()]);
      expect(r1).toBe('done');
      expect(r2).toBe('done');
      expect(r3).toBe('done');
      expect(acquireCalls).toBe(1);

      await scope.dispose();
    });

    it('release is idempotent and safely called multiple times', async () => {
      let releaseCount = 0;
      const res = defineResource({
        id: 'closable-handle',
        acquire: () => 999,
        release: () => {
          releaseCount++;
        },
      });

      const ctrl = createResourceController(res, 'manual-scope');
      await ctrl.load();
      expect(ctrl.status).toBe('ready');

      await ctrl.release();
      expect(ctrl.status).toBe('released');
      expect(releaseCount).toBe(1);

      // Calling release again must not re-trigger release logic
      await ctrl.release();
      expect(releaseCount).toBe(1);
    });

    it('disposal of parent scope deterministically disposes child scopes and resources', async () => {
      const releasedIds: string[] = [];

      const parentScope = createScope('parent');
      const childScope1 = parentScope.createChildScope('child-1');
      const childScope2 = childScope1.createChildScope('child-2');

      const res1 = parentScope.add(
        defineResource({
          id: 'res-parent',
          acquire: () => 'val-parent',
          release: () => {
            releasedIds.push('res-parent');
          },
        })
      );

      const res2 = childScope1.add(
        defineResource({
          id: 'res-child-1',
          acquire: () => 'val-child-1',
          release: () => {
            releasedIds.push('res-child-1');
          },
        })
      );

      const res3 = childScope2.add(
        defineResource({
          id: 'res-child-2',
          acquire: () => 'val-child-2',
          release: () => {
            releasedIds.push('res-child-2');
          },
        })
      );

      await Promise.all([res1.load(), res2.load(), res3.load()]);

      // Disposing the root parent must clean up all generations of child scopes
      await parentScope.dispose();

      expect(res1.status).toBe('released');
      expect(res2.status).toBe('released');
      expect(res3.status).toBe('released');
      expect(releasedIds).toContain('res-parent');
      expect(releasedIds).toContain('res-child-1');
      expect(releasedIds).toContain('res-child-2');

      // Attempting to add a resource to a disposed scope throws FrnlFault
      expect(() =>
        parentScope.add(
          defineResource({
            id: 'late-res',
            acquire: () => 1,
          })
        )
      ).toThrow(FrnlFault);
    });

    it('handles aborted async resource acquisition safely without leaving inconsistent state', async () => {
      let resourceCleanedUp = false;
      const slowRes = defineResource({
        id: 'slow-resource',
        acquire: async ({ signal }) => {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 50);
            signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new Error('Acquisition aborted'));
            });
          });
          return 'slow-data';
        },
        release: () => {
          resourceCleanedUp = true;
        },
      });

      const scope = createScope('abort-test-scope');
      const ctrl = scope.add(slowRes);

      const loadPromise = ctrl.load();
      // Dispose scope mid-flight
      await scope.dispose();

      await expect(loadPromise).rejects.toThrow();
      expect(ctrl.status).toBe('released');
    });
  });

  describe('Semantic Registry and Capability Resolution', () => {
    it('registers and resolves entries and prevents version downgrades', () => {
      const reg = new FrnlRegistry();
      reg.register({
        id: 'theme-provider',
        version: 1,
        value: { theme: 'light' },
      });

      expect(reg.has('theme-provider')).toBe(true);
      expect(reg.resolve('theme-provider')).toEqual({ theme: 'light' });

      // Upgrade to version 2
      reg.register({
        id: 'theme-provider',
        version: 2,
        value: { theme: 'dark' },
      });
      expect(reg.resolve('theme-provider')).toEqual({ theme: 'dark' });

      // Downgrade to version 1 is blocked
      expect(() =>
        reg.register({
          id: 'theme-provider',
          version: 1,
          value: { theme: 'old' },
        })
      ).toThrow(/older version/i);
    });

    it('enforces required capabilities from contract and capability schemas', () => {
      const reg = new FrnlRegistry();
      reg.register({
        id: 'modal-service',
        version: 1,
        contract: {
          id: 'modal-contract',
          version: 1,
          capabilities: ['focus-trap', 'portal-mount'],
        },
        value: { open: () => {} },
      });

      // Missing capabilities
      expect(() => reg.requireCapabilities('modal-service', ['focus-trap'])).toThrow(
        /Missing capability 'portal-mount'/
      );

      // Exact capabilities present
      expect(() =>
        reg.requireCapabilities('modal-service', ['focus-trap', 'portal-mount', 'extra'])
      ).not.toThrow();
    });
  });

  describe('Dependency Graph and Cycle Detection', () => {
    it('validates missing dependencies', () => {
      const graph = new DependencyGraph();
      graph.register({ id: 'app', requires: ['auth', 'router'] });
      graph.register({ id: 'router' });

      const errors = graph.validate();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('app requires missing dependency auth');
    });

    it('detects direct and indirect cycles in topological order', () => {
      const graph = new DependencyGraph();
      graph.register({ id: 'a', requires: ['b'] });
      graph.register({ id: 'b', requires: ['c'] });
      graph.register({ id: 'c', requires: ['a'] });

      expect(() => graph.topologicalOrder()).toThrow(/cycle detected/i);
    });

    it('computes correct topological order when acyclic', () => {
      const graph = new DependencyGraph();
      graph.register({ id: 'core' });
      graph.register({ id: 'auth', requires: ['core'] });
      graph.register({ id: 'dashboard', requires: ['auth'] });

      const order = graph.topologicalOrder();
      expect(order.indexOf('core')).toBeLessThan(order.indexOf('auth'));
      expect(order.indexOf('auth')).toBeLessThan(order.indexOf('dashboard'));
    });
  });

  describe('Routing and URL Generation', () => {
    it('matches parameterized routes and parses query strings', () => {
      const route = { id: 'user-profile', pattern: '/users/:userId/tab/:tabId' };
      const match = matchRoute(route, 'https://example.com/users/u123/tab/settings?sort=asc&view=card');

      expect(match).not.toBeNull();
      expect(match?.id).toBe('user-profile');
      expect(match?.params).toEqual({ userId: 'u123', tabId: 'settings' });
      expect(match?.query).toEqual({ sort: 'asc', view: 'card' });
      expect(match?.path).toBe('/users/u123/tab/settings');
    });

    it('matches wildcard routes', () => {
      const route = { id: 'catchall', pattern: '/files/*' };
      const match = matchRoute(route, '/files/documents/2026/report.pdf');

      expect(match).not.toBeNull();
      expect(match?.params.wildcard).toBe('documents/2026/report.pdf');
    });

    it('builds URL from params and query and roundtrips safely', () => {
      const route = { id: 'search', pattern: '/search/:category/:query' };
      const url = buildRouteUrl(
        route,
        { category: 'electronics', query: 'audio pro' },
        { page: '2', lang: 'en' }
      );

      expect(url).toBe('/search/electronics/audio%20pro?page=2&lang=en');

      const match = matchRoute(route, url);
      expect(match?.params).toEqual({ category: 'electronics', query: 'audio pro' });
      expect(match?.query).toEqual({ page: '2', lang: 'en' });
    });

    it('throws when required route parameter is missing during build', () => {
      const route = { id: 'item', pattern: '/items/:itemId' };
      expect(() => buildRouteUrl(route, {})).toThrow(/Missing route parameter: itemId/);
    });

    it('matches routes via FrnlRouter', () => {
      const router = new FrnlRouter([
        { id: 'home', pattern: '/' },
        { id: 'about', pattern: '/about' },
        { id: 'post', pattern: '/posts/:id' },
      ]);

      expect(router.match('/about')?.id).toBe('about');
      expect(router.match('/posts/42')?.params.id).toBe('42');
      expect(router.match('/nonexistent')).toBeNull();
    });
  });

  describe('Accessibility Validation', () => {
    it('detects missing accessible names for controls requiring them', () => {
      const issues = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button' }
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('ACCESSIBLE_NAME_REQUIRED');

      const validAriaLabel = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button', 'aria-label': 'Close dialog' }
      );
      expect(validAriaLabel).toEqual([]);

      const validAriaLabelledBy = validateAccessibility(
        { role: 'button', nameRequired: true },
        { role: 'button', 'aria-labelledby': 'heading-id' }
      );
      expect(validAriaLabelledBy).toEqual([]);
    });

    it('detects missing required attributes and role mismatches', () => {
      const issues = validateAccessibility(
        {
          role: 'checkbox',
          requiredAttributes: ['aria-checked'],
        },
        { role: 'button' }
      );

      expect(issues.some((i) => i.code === 'ROLE_MISMATCH')).toBe(true);
      expect(issues.some((i) => i.code === 'REQUIRED_ATTRIBUTE_MISSING')).toBe(true);
    });
  });

  describe('Architecture & Public Exports Purity', () => {
    it('exports all runtime primitives from root and runtime subpaths', () => {
      expect(RootExports.createLifecycle).toBeDefined();
      expect(RootExports.createScope).toBeDefined();
      expect(RootExports.FrnlRegistry).toBeDefined();
      expect(RootExports.FrnlRouter).toBeDefined();
      expect(RootExports.createFrnlStore).toBeDefined();

      expect(RuntimeExports.createLifecycle).toBeDefined();
      expect(RuntimeExports.createScope).toBeDefined();
      expect(RuntimeExports.FrnlRegistry).toBeDefined();
      expect(RuntimeExports.FrnlRouter).toBeDefined();
      expect(RuntimeExports.createFrnlStore).toBeDefined();
    });

    it('keeps React adapter separate with no React pollution in runtime', () => {
      expect(ReactExports.FrnlPrimitive).toBeDefined();
      expect(ReactExports.FrnlComposite).toBeDefined();

      // Runtime exports must NOT include React components
      expect((RuntimeExports as any).FrnlPrimitive).toBeUndefined();
      expect((RuntimeExports as any).FrnlComposite).toBeUndefined();
    });
  });
});