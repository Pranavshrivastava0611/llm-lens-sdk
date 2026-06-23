import { getMetricsInRange } from './packages/daemon/dist/store/metrics.js';
console.log(getMetricsInRange(Date.now() - 15 * 60 * 1000, Date.now()).length);
