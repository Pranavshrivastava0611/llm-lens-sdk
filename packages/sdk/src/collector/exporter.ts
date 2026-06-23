import type { QueuedSpan } from '../queue/SpanQueue.js';

export interface ExporterMetadata {
  serviceName: string;
  codebasePath: string;
  sdkVersion: string;
  sentAt: string;
  judgeModel?: {
    provider: string;
    apiKey: string;
    model: string;
  };
}

export interface ExportPayload {
  spans: QueuedSpan[];
  metadata: ExporterMetadata;
}

export class SpanExporter {
  private daemonUrl: string;
  private metadata: Omit<ExporterMetadata, 'sentAt'>;
  private sentConfig = false;

  constructor(
    daemonUrl: string,
    metadata: Omit<ExporterMetadata, 'sentAt' | 'sdkVersion'>
  ) {
    this.daemonUrl = daemonUrl.replace(/\/$/, '');
    this.metadata = {
      ...metadata,
      sdkVersion: '0.1.0',
    };
  }

  async export(spans: QueuedSpan[]): Promise<void> {
    const payload: ExportPayload = {
      spans,
      metadata: {
        ...this.metadata,
        sentAt: new Date().toISOString(),
        // Only send judgeModel config on first export
        judgeModel: !this.sentConfig ? this.metadata.judgeModel : undefined,
      },
    };

    const response = await fetch(`${this.daemonUrl}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(
        `[llm-autopilot] Daemon responded ${response.status}: ${response.statusText}`
      );
    }

    if (!this.sentConfig && this.metadata.judgeModel) {
      this.sentConfig = true;
    }
  }
}
