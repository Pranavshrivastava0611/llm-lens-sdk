<div align="center">
  <h1>🔭 LLM Lens Daemon</h1>
  <p><strong>The local SQLite backend and Next.js dashboard for LLM Lens.</strong></p>
</div>

---

**LLM Lens** is a blazing-fast, developer-first alternative to cloud AI observability platforms. 

This package (`llm-lens-daemon`) runs a local Node.js background process that handles UDP/WebSocket ingestion of traces and aggregates them into a local SQLite database. It also serves the Next.js frontend dashboard where you can view your traces and run **Autonomous Agentic Analysis** to deeply debug failing LLM calls.

## Usage

You don't even need to clone the repository. Just run the daemon globally using `npx`:

```bash
npx -y llm-lens-daemon@latest dashboard
```

*This will spin up the SQLite database on `localhost:7777` and open the beautiful observability dashboard at `http://localhost:8493`.*

### Instrumenting your code
To actually send traces to this daemon, you need to instrument your AI application using the [llm-lens-sdk](https://www.npmjs.com/package/llm-lens-sdk).

```bash
npm install llm-lens-sdk
```

For full documentation, visit the [main repository](https://github.com/Pranavshrivastava0611/llm-lens-sdk).
