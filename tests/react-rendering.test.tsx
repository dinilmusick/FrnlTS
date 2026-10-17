import { describe, expect, it, afterEach } from 'vitest';
import React, { StrictMode } from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { createFrnlStore } from '../src/runtime/store.js';
import { FrnlPrimitive, FrnlComposite, FrnlSlot } from '../src/react/index.js';

afterEach(() => {
  cleanup();
});

describe('FrnlTS React rendering suite', () => {
  it('1. Primitive rendering: renders with semantic data attributes and custom element type', () => {
    const store = createFrnlStore();
    render(
      <FrnlPrimitive
        id="btn-primary"
        as="button"
        store={store}
        state="default"
        properties={{ variant: 'accent' }}
        bounds={{ width: 120, height: 40 }}
        className="test-btn"
        hostProps={{ 'aria-label': 'Action Button' }}
      >
        Click Me
      </FrnlPrimitive>
    );

    const button = screen.getByRole('button', { name: 'Action Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-frnl-kind', 'ui-primitive');
    expect(button).toHaveAttribute('data-frnl-id', 'btn-primary');
    expect(button).toHaveAttribute('data-frnl-state', 'default');
    expect(button).toHaveTextContent('Click Me');
    expect(button).toHaveClass('test-btn');
    expect(store.getState().entities['btn-primary']?.kind).toBe('primitive');
  });

  it('2. Composite rendering: renders with semantic attributes and contains child slots', () => {
    const store = createFrnlStore();
    render(
      <FrnlComposite
        id="card-composite"
        store={store}
        state="expanded"
        properties={{ elevation: 2 }}
        className="card-class"
        slots={<div data-testid="card-inner">Card Content</div>}
      />
    );

    const compositeEl = screen.getByTestId('card-inner').parentElement;
    expect(compositeEl).toHaveAttribute('data-frnl-kind', 'ui-composite');
    expect(compositeEl).toHaveAttribute('data-frnl-id', 'card-composite');
    expect(compositeEl).toHaveAttribute('data-frnl-state', 'expanded');
    expect(store.getState().entities['card-composite']?.kind).toBe('composite');
  });

  it('3. Slot rendering: renders current occupant inside slot boundary', () => {
    const store = createFrnlStore();
    render(
      <FrnlSlot
        id="header-slot"
        address="Page.header"
        occupantId="title"
        occupantKind="primitive"
        store={store}
        occupants={{
          title: <h1 data-testid="title-occupant">Dashboard Header</h1>,
          banner: <div data-testid="banner-occupant">Banner Notification</div>,
        }}
      />
    );

    const slotEl = screen.getByTestId('title-occupant').parentElement;
    expect(slotEl).toHaveAttribute('data-frnl-kind', 'slot');
    expect(slotEl).toHaveAttribute('data-frnl-slot-id', 'header-slot');
    expect(slotEl).toHaveAttribute('data-frnl-address', 'Page.header');
    expect(slotEl).toHaveAttribute('data-frnl-occupant-id', 'title');
    expect(screen.getByTestId('title-occupant')).toBeInTheDocument();
    expect(screen.queryByTestId('banner-occupant')).not.toBeInTheDocument();
  });

  it('4. Live Slot occupant replacement: replaces rendered occupant on store change', () => {
    const store = createFrnlStore();
    render(
      <FrnlSlot
        id="main-slot"
        address="App.main"
        occupantId="overview"
        occupantKind="composite"
        store={store}
        occupants={{
          overview: <div data-testid="overview-view">Overview Panel</div>,
          settings: <div data-testid="settings-view">Settings Panel</div>,
        }}
      />
    );

    expect(screen.getByTestId('overview-view')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();

    act(() => {
      store.getState().replaceSlotOccupant('main-slot', {
        id: 'settings',
        kind: 'composite',
      });
    });

    expect(screen.queryByTestId('overview-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('settings-view')).toBeInTheDocument();
  });

  it('5. Live replacement while parent Composite remains mounted', () => {
    const store = createFrnlStore();
    let renderCount = 0;

    function ParentShell() {
      renderCount++;
      return (
        <FrnlComposite
          id="parent-shell"
          store={store}
          state="active"
          slots={
            <FrnlSlot
              id="content-slot"
              address="ParentShell.content"
              occupantId="step1"
              occupantKind="primitive"
              store={store}
              occupants={{
                step1: <span data-testid="step-1">Step 1</span>,
                step2: <span data-testid="step-2">Step 2</span>,
              }}
            />
          }
        />
      );
    }

    render(<ParentShell />);
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    const initialRenderCount = renderCount;

    act(() => {
      store.getState().replaceSlotOccupant('content-slot', {
        id: 'step2',
        kind: 'primitive',
      });
    });

    expect(screen.getByTestId('step-2')).toBeInTheDocument();
    expect(screen.queryByTestId('step-1')).not.toBeInTheDocument();
    // ParentShell itself did not re-render because slot subscribes independently
    expect(renderCount).toBe(initialRenderCount);
  });

  it('6. Preservation of Slot identity/address/properties across replacement', () => {
    const store = createFrnlStore();
    render(
      <FrnlSlot
        id="stable-slot"
        address="Layout.sidebar"
        occupantId="navA"
        occupantKind="primitive"
        properties={{ width: 250, visible: true }}
        store={store}
        occupants={{
          navA: <div data-testid="nav-a">Nav A</div>,
          navB: <div data-testid="nav-b">Nav B</div>,
        }}
      />
    );

    const slotEl = screen.getByTestId('nav-a').parentElement;
    expect(slotEl).toHaveAttribute('data-frnl-slot-id', 'stable-slot');
    expect(slotEl).toHaveAttribute('data-frnl-address', 'Layout.sidebar');

    act(() => {
      store.getState().replaceSlotOccupant('stable-slot', {
        id: 'navB',
        kind: 'primitive',
      });
    });

    const slotAfter = screen.getByTestId('nav-b').parentElement;
    expect(slotAfter).toBe(slotEl);
    expect(slotAfter).toHaveAttribute('data-frnl-slot-id', 'stable-slot');
    expect(slotAfter).toHaveAttribute('data-frnl-address', 'Layout.sidebar');
    expect(store.getState().slots['stable-slot'].properties.width).toBe(250);
  });

  it('7. Zustand-driven state changes causing React updates', () => {
    const store = createFrnlStore();
    render(
      <FrnlPrimitive
        id="interactive-btn"
        store={store}
        state="idle"
      >
        Submit
      </FrnlPrimitive>
    );

    const primitiveEl = screen.getByText('Submit');
    expect(primitiveEl).toHaveAttribute('data-frnl-state', 'idle');

    act(() => {
      store.getState().setEntityState('interactive-btn', 'loading');
    });

    expect(primitiveEl).toHaveAttribute('data-frnl-state', 'loading');

    act(() => {
      store.getState().setEntityState('interactive-btn', 'success');
    });

    expect(primitiveEl).toHaveAttribute('data-frnl-state', 'success');
  });

  it('8. React Strict Mode does not duplicate semantic registrations or corrupt state', () => {
    const store = createFrnlStore();
    render(
      <StrictMode>
        <FrnlComposite
          id="strict-modal"
          store={store}
          state="open"
          slots={
            <FrnlSlot
              id="strict-slot"
              address="Modal.body"
              occupantId="body-content"
              occupantKind="primitive"
              store={store}
              occupants={{
                'body-content': (
                  <FrnlPrimitive id="body-content" store={store} state="ready">
                    Strict Ready
                  </FrnlPrimitive>
                ),
              }}
            />
          }
        />
      </StrictMode>
    );

    expect(screen.getByText('Strict Ready')).toBeInTheDocument();
    // Verify each registered entity exists exactly once with correct state
    expect(Object.keys(store.getState().entities)).toEqual(
      expect.arrayContaining(['strict-modal', 'body-content'])
    );
    expect(store.getState().entities['strict-modal'].state).toBe('open');
    expect(store.getState().entities['body-content'].state).toBe('ready');
    expect(store.getState().slots['strict-slot'].occupantId).toBe('body-content');
  });

  it('9. Property synchronization: React prop updates sync to semantic store', () => {
    const store = createFrnlStore();
    const { rerender } = render(
      <FrnlPrimitive
        id="sync-button"
        store={store}
        state="default"
        properties={{ variant: 'primary', count: 1 }}
      >
        Click
      </FrnlPrimitive>
    );

    expect(store.getState().entities['sync-button']?.properties.variant).toBe('primary');
    expect(store.getState().entities['sync-button']?.properties.count).toBe(1);

    // Re-render with new properties
    rerender(
      <FrnlPrimitive
        id="sync-button"
        store={store}
        state="default"
        properties={{ variant: 'danger', count: 2 }}
      >
        Click
      </FrnlPrimitive>
    );

    expect(store.getState().entities['sync-button']?.properties.variant).toBe('danger');
    expect(store.getState().entities['sync-button']?.properties.count).toBe(2);

    // Verify entity.propertyChanged events were recorded
    const propertyEvents = store
      .getState()
      .events.filter((e) => e.type === 'entity.propertyChanged');
    expect(propertyEvents.length).toBeGreaterThanOrEqual(2);
    expect(
      propertyEvents.some(
        (e) =>
          e.payload.entityId === 'sync-button' &&
          e.payload.key === 'variant' &&
          e.payload.value === 'danger'
      )
    ).toBe(true);
  });

  it('10. Empty slot rendering: replaceSlotOccupant(null) empties DOM occupant while slot remains mounted', () => {
    const store = createFrnlStore();
    render(
      <FrnlSlot
        id="dynamic-slot"
        address="Container.content"
        occupantId="initial-occupant"
        occupantKind="primitive"
        store={store}
        occupants={{
          'initial-occupant': <div data-testid="visible-occupant">Live Occupant</div>,
        }}
      />
    );

    // Initially occupant is in the document
    expect(screen.getByTestId('visible-occupant')).toBeInTheDocument();
    const slotEl = screen.getByTestId('visible-occupant').parentElement;
    expect(slotEl).toHaveAttribute('data-frnl-kind', 'slot');
    expect(slotEl).toHaveAttribute('data-frnl-slot-id', 'dynamic-slot');

    // Replace occupant with null
    act(() => {
      store.getState().replaceSlotOccupant('dynamic-slot', null);
    });

    // Occupant is now unmounted from the DOM
    expect(screen.queryByTestId('visible-occupant')).not.toBeInTheDocument();

    // Slot element itself remains mounted in DOM with null occupant
    expect(slotEl).toBeInTheDocument();
    expect(slotEl).toHaveAttribute('data-frnl-kind', 'slot');
    expect(slotEl).not.toHaveAttribute('data-frnl-occupant-id');
    expect(store.getState().slots['dynamic-slot']?.occupantId).toBeNull();
  });

  it('11. Bounds synchronization: React bounds prop updates sync to semantic store', () => {
    const store = createFrnlStore();
    const { rerender } = render(
      <FrnlPrimitive
        id="resizable-box"
        store={store}
        bounds={{ width: 100, height: 50 }}
      >
        Box
      </FrnlPrimitive>
    );

    expect(store.getState().entities['resizable-box']?.bounds).toEqual({ width: 100, height: 50 });

    // Re-render with new bounds
    rerender(
      <FrnlPrimitive
        id="resizable-box"
        store={store}
        bounds={{ width: 300, height: 150 }}
      >
        Box
      </FrnlPrimitive>
    );

    expect(store.getState().entities['resizable-box']?.bounds).toEqual({ width: 300, height: 150 });
  });
});
