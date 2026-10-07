const test = require('node:test');
const assert = require('node:assert');
const { AICostLeakDetector } = require('../src/index.js');

test('AICostLeakDetector: calculates micro-dollar call cost', () => {
  const detector = new AICostLeakDetector();
  const res = detector.recordCall({
    model: 'gpt-4o',
    promptTokens: 1000,
    completionTokens: 1000,
    userId: 'u1',
    feature: 'doc-summarizer'
  });
  assert.strictEqual(res.costUSD, 0.02); // 0.005 + 0.015
  assert.strictEqual(res.totalTokens, 2000);
});

test('AICostLeakDetector: detects anomalous user budget breach', () => {
  const detector = new AICostLeakDetector({ costSpikeThresholdDailyUSD: 10 });
  const events = [
    { userId: 'u2', costUSD: 6.5, totalTokens: 100000 },
    { userId: 'u2', costUSD: 5.0, totalTokens: 80000 }
  ];
  const audit = detector.auditUserUsage(events, 'u2');
  assert.strictEqual(audit.isAnomalousSpike, true);
  assert.strictEqual(audit.status, 'BUDGET_EXCEEDED_RATE_LIMITED');
});
