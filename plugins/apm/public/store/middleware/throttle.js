// Throttle middleware for redux
// Should only be used during development
//
// tldr: While developing, it is easy to make minor mistakes that results in infinite dispatch loops.
// Longer Motivation: Infinite dispatch loop occurs, if a component dispatches an action, that in turn re-renders the component, which then again dispatches.
// Normally this is guarded, but if the condition is missing/errornous an infinite loop happens.
// The root cause is mostly very simple to fix (update an if statement) but the infinite loop causes the browser to be unresponsive
// and only by killing and restarting the process can development continue.
// Solution: Block actions if more than x dispatches happens within y seconds

const MAX_DISPATCHES = 50;
const INTERVAL_MS = 2000;

let count = 0;
setInterval(() => {
  count = 0;
}, INTERVAL_MS);

function throttle() {
  return next => action => {
    count += 1;

    if (count > MAX_DISPATCHES) {
      console.error('Action was throttled', action);
      return {};
    }

    return next(action);
  };
}

export default throttle;
