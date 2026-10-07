// AI Cost Leak & Token Usage Observatory Engine
class AICostLeakDetector {
  constructor(options = {}) {
    this.pricingPerThousandTokens = {
      'gpt-4o': { prompt: 0.005, completion: 0.015 },
      'claude-3-5-sonnet': { prompt: 0.003, completion: 0.015 },
      'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 }
    };
    this.costSpikeThresholdDailyUSD = options.costSpikeThresholdDailyUSD || 50;
  }

  recordCall(callEvent) {
    const { model, promptTokens, completionTokens, userId, feature } = callEvent;
    const rates = this.pricingPerThousandTokens[model] || { prompt: 0.005, completion: 0.015 };
    const cost = ((promptTokens / 1000) * rates.prompt) + ((completionTokens / 1000) * rates.completion);

    return {
      userId,
      feature,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      costUSD: Math.round(cost * 10000) / 10000,
      timestamp: new Date().toISOString()
    };
  }

  auditUserUsage(events, userId) {
    const userEvents = events.filter(e => e.userId === userId);
    const totalCost = userEvents.reduce((sum, e) => sum + e.costUSD, 0);
    const totalTokens = userEvents.reduce((sum, e) => sum + e.totalTokens, 0);
    const isAnomalousSpike = totalCost > this.costSpikeThresholdDailyUSD;

    return {
      userId,
      callCount: userEvents.length,
      totalTokens,
      totalCostUSD: Math.round(totalCost * 100) / 100,
      isAnomalousSpike,
      status: isAnomalousSpike ? 'BUDGET_EXCEEDED_RATE_LIMITED' : 'NORMAL'
    };
  }
}

module.exports = { AICostLeakDetector };
