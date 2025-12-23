const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');

// 1. Initialize the Logger
const logger = pino({
  level: 'info',
  // Optional: formats time as ISO string instead of epoch
  timestamp: pino.stdTimeFunctions.isoTime, 
});

const app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// 2. Attach the Pino Middleware
// This automatically logs all incoming requests (e.g., "request completed")
app.use(pinoHttp({ logger }));

// --- The Recursive Function ---
function fibonacci(n) {
  // We use the global logger. 
  // OTel auto-instrumentation will inject the current Trace ID here automatically.
  logger.info({ msg: `[Trace-Test] Computing fib(${n})...`, n: n });
  
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// --- Original Route ---
app.get('/', function(request, response) {
  response.send('Hello World!');
});

// --- Recursive Route ---
app.get('/fib/:n', function(req, res) {
  var n = parseInt(req.params.n);
  
  // Use req.log to include request-specific context (like req.id) if available
  // But global 'logger' works fine for Trace IDs too.
  if (isNaN(n)) {
    req.log.error("[Trace-Test] Invalid number provided");
    return res.status(400).send("Please provide a number");
  }

  req.log.info({ msg: `[Trace-Test] Starting request for fib(${n})`, n: n });
  
  // Start recursion
  var result = fibonacci(n);
  
  req.log.info({ msg: `[Trace-Test] Finished result`, result: result });
  res.send(`Fibonacci(${n}) is ${result}`);
});

app.listen(app.get('port'), function() {
  logger.info(`Node app is running at localhost:${app.get('port')}`);
});
