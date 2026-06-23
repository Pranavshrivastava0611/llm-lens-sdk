const http = require('http');

const traceId = Math.random().toString(36).substring(2, 15);
const now = Date.now();

const payload = {
  metadata: {
    serviceName: 'test-service',
    codebasePath: '/home/pranav/projects/test',
    sdkVersion: '0.1.0',
    sentAt: new Date().toISOString()
  },
  spans: [
    {
      id: Math.random().toString(36).substring(2, 15),
      traceId,
      name: 'generateText gpt-4o',
      startTime: now - 1500,
      endTime: now,
      status: { code: 0 },
      attributes: {
        'ai.model.id': 'gpt-4o',
        'ai.operation': 'generateText',
        'ai.usage.promptTokens': 150,
        'ai.usage.completionTokens': 50,
        'ai.usage.totalTokens': 200,
        'ai.finishReason': 'stop',
        'ai.toolCallCount': 1,
        'ai.toolCallNames': 'getWeather'
      },
      events: [
        { name: 'tool.called', timestamp: now - 1000, attributes: { toolName: 'getWeather' } }
      ],
      enqueuedAt: now
    }
  ]
};

const req = http.request('http://localhost:7777/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => {
  console.error(e);
});

req.write(JSON.stringify(payload));
req.end();
