import { AutopilotSpan } from '../collector/processor.js';
import { getInstrumentationState } from './state.js';

/**
 * Express middleware to trace full HTTP requests.
 * Use this at the top level of your Express app.
 * `app.use(expressAutopilot())`
 */
export function expressAutopilot() {
  return function (req: any, res: any, next: any) {
    const state = getInstrumentationState();
    if (!state) {
      return next();
    }

    const span = new AutopilotSpan({
      name: `HTTP ${req.method} ${req.path}`,
      attributes: {
        'http.method': req.method,
        'http.path': req.path,
        'ai.operation': 'http_request', // Using our standard schema trick for the dashboard to render it
      },
    });

    if (req.query && Object.keys(req.query).length > 0) {
      try {
        span.setAttribute('http.query', JSON.stringify(req.query));
      } catch { /* ignore */ }
    }

    // Capture response completion
    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      if (res.statusCode >= 400) {
        span.setStatus(2, `HTTP Error ${res.statusCode}`);
      } else {
        span.setStatus(0);
      }
      state.processor.onEnd(span);
    });

    // Capture abrupt closing
    res.on('close', () => {
      if (!res.writableEnded) {
        span.setStatus(2, 'Connection closed by client');
        state.processor.onEnd(span);
      }
    });

    next();
  };
}
