/**
 * Focus Manager
 * Manages keyboard focus state for timeline events, including focus tracking,
 * history navigation, and ARIA announcements for screen readers.
 */

const MAX_FOCUS_HISTORY = 50;

export function createFocusManager(store, ariaLiveElement = null) {
  let historyIndex = -1;
  let navigatingHistory = false;

  // Keep track of last known position for restoration
  let lastKnownPosition = null;

  // Subscribe to store changes to handle focus restoration
  const unsubscribe = store.subscribe((state) => {
    handleEventChanges(state);
  });

  function handleEventChanges(state) {
    // If we have a focused event, check if it still exists
    if (state.focusedEventId && !navigatingHistory) {
      const focusedEvent = state.events.find((e) => e.id === state.focusedEventId);
      if (focusedEvent) {
        // Update last known position
        lastKnownPosition = focusedEvent.start + (focusedEvent.end - focusedEvent.start) / 2n;
      } else {
        // Focused event no longer exists, restore focus
        if (lastKnownPosition !== null && state.events.length > 0) {
          const nearestId = findNearestEvent(lastKnownPosition);
          if (nearestId) {
            setFocus(nearestId);
            return;
          }
        }
        // No events left, clear focus
        store.dispatch({ type: 'SET_FOCUS', eventId: null });
        lastKnownPosition = null;
      }
    }
  }

  function setFocus(eventId) {
    const state = store.getState();

    // Update store
    store.dispatch({ type: 'SET_FOCUS', eventId });

    // Update focus history
    if (!navigatingHistory) {
      let history = [...state.focusHistory];

      // Don't duplicate consecutive entries
      if (history.length === 0 || history[history.length - 1] !== eventId) {
        history.push(eventId);

        // Limit history size
        if (history.length > MAX_FOCUS_HISTORY) {
          history = history.slice(history.length - MAX_FOCUS_HISTORY);
        }

        store.dispatch({ type: 'SET_FOCUS_HISTORY', history });
        historyIndex = history.length - 1;
      }
    }

    // Announce to screen readers
    announceToScreenReader(eventId);
  }

  function getFocus() {
    return store.getState().focusedEventId;
  }

  function announceToScreenReader(eventId) {
    if (!ariaLiveElement) return;

    if (eventId === null) {
      ariaLiveElement.textContent = '';
      return;
    }

    const state = store.getState();
    const event = state.events.find((e) => e.id === eventId);

    if (!event) {
      ariaLiveElement.textContent = '';
      return;
    }

    const title = event.title || event.id;
    const index = state.events.findIndex((e) => e.id === eventId);
    const position = `${index + 1} of ${state.events.length}`;

    ariaLiveElement.textContent = `Focused on ${title}, item ${position}`;
  }

  function findNearestEvent(targetTime) {
    const state = store.getState();

    if (!state.events || state.events.length === 0) {
      return null;
    }

    if (targetTime === null || targetTime === undefined) {
      return null;
    }

    let nearestEvent = null;
    let minDistance = null;

    for (const event of state.events) {
      // Calculate midpoint of event
      const midpoint = event.start + (event.end - event.start) / 2n;
      const distance = midpoint > targetTime ? midpoint - targetTime : targetTime - midpoint;

      if (minDistance === null || distance < minDistance) {
        minDistance = distance;
        nearestEvent = event;
      }
    }

    return nearestEvent ? nearestEvent.id : null;
  }

  function focusBack() {
    const state = store.getState();
    if (historyIndex > 0) {
      navigatingHistory = true;
      historyIndex--;
      const eventId = state.focusHistory[historyIndex];
      store.dispatch({ type: 'SET_FOCUS', eventId });
      announceToScreenReader(eventId);
      navigatingHistory = false;
    }
  }

  function focusForward() {
    const state = store.getState();
    if (historyIndex < state.focusHistory.length - 1) {
      navigatingHistory = true;
      historyIndex++;
      const eventId = state.focusHistory[historyIndex];
      store.dispatch({ type: 'SET_FOCUS', eventId });
      announceToScreenReader(eventId);
      navigatingHistory = false;
    }
  }

  function enableKeyboardFocusMode() {
    store.dispatch({ type: 'SET_KEYBOARD_FOCUS_MODE', enabled: true });
  }

  function disableKeyboardFocusMode() {
    store.dispatch({ type: 'SET_KEYBOARD_FOCUS_MODE', enabled: false });
  }

  function focusNext() {
    const state = store.getState();
    const events = state.events;

    if (events.length === 0) return;

    if (!state.focusedEventId) {
      // No focus, focus first event
      setFocus(events[0].id);
      return;
    }

    const currentIndex = events.findIndex((e) => e.id === state.focusedEventId);
    if (currentIndex === -1) {
      // Current focus not found, focus first
      setFocus(events[0].id);
      return;
    }

    // Move to next, wrapping to first if at end
    const nextIndex = (currentIndex + 1) % events.length;
    setFocus(events[nextIndex].id);
  }

  function focusPrevious() {
    const state = store.getState();
    const events = state.events;

    if (events.length === 0) return;

    if (!state.focusedEventId) {
      // No focus, focus last event
      setFocus(events[events.length - 1].id);
      return;
    }

    const currentIndex = events.findIndex((e) => e.id === state.focusedEventId);
    if (currentIndex === -1) {
      // Current focus not found, focus last
      setFocus(events[events.length - 1].id);
      return;
    }

    // Move to previous, wrapping to last if at start
    const prevIndex = currentIndex === 0 ? events.length - 1 : currentIndex - 1;
    setFocus(events[prevIndex].id);
  }

  function focusFirst() {
    const state = store.getState();
    if (state.events.length > 0) {
      setFocus(state.events[0].id);
    }
  }

  function focusLast() {
    const state = store.getState();
    if (state.events.length > 0) {
      setFocus(state.events[state.events.length - 1].id);
    }
  }

  function destroy() {
    unsubscribe();
  }

  return {
    setFocus,
    getFocus,
    findNearestEvent,
    focusBack,
    focusForward,
    enableKeyboardFocusMode,
    disableKeyboardFocusMode,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    destroy,
  };
}
