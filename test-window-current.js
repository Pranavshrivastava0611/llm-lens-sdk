import { AggregationWindowManager } from './packages/daemon/dist/aggregator/window.js';
const mgr = new AggregationWindowManager({});
console.log(mgr.computeCurrentWindow().totalTraces);
