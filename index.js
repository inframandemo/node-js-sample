const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const axios = require('axios'); // <--- NEW: For external calls
const { trace } = require('@opentelemetry/api');

const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(pinoHttp({ logger }));

// --- HELPER: Sleep for visualization ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const tracer = trace.getTracer('node-sample-app');

// --- NEW FUNCTION: Call External API ---
async function fetchTodo(id) {
  // We wrap this in a manual span to label it clearly in the trace
  return tracer.startActiveSpan('fetch_external_todo', async (span) => {
    try {
        const url = `https://jsonplaceholder.typicode.com/todos/${id}`;
        
        logger.info({ msg: `[External] Calling ${url}` });
        
        // AUTO-INSTRUMENTATION KICKING IN HERE:
        // Axios uses 'http' module. OTel intercepts this and creates
        // a CHILD SPAN automatically named "GET jsonplaceholder.typicode.com"
        const response = await axios.get(url);
        
        // Simulate processing time
        await sleep(20);
        
        logger.info({ msg: `[External] Received data`, data: response.data });
        
        return response.data;
    } catch (err) {
        span.recordException(err);
        throw err;
    } finally {
        span.end();
    }
  });
}

// --- NEW ROUTE: /todo/:id ---
app.get('/todo/:id', async function(req, res) {
  const id = req.params.id;
  
  req.log.info({ msg: `[Trace-Test] Fetching Todo #${id}` });

  try {
      const todo = await fetchTodo(id);
      res.json(todo);
  } catch (err) {
      req.log.error(err);
      res.status(500).send("External API Error");
  }
});

// --- KEEPING THE OLD ROUTE (Fibonacci) ---
// ... (Your previous fibonacci code can stay here if you want) ...

app.listen(app.get('port'), function() {
  logger.info(`Node app is running at localhost:${app.get('port')}`);
});
