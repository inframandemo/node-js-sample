var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

// --- 1. The Recursive Function (The "Work") ---
function fibonacci(n) {
  // We log here to verify that EVERY internal step gets the same Trace ID
  console.log(`[Trace-Test] Computing fib(${n})...`);
  
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// --- 2. The Original Route ---
app.get('/', function(request, response) {
  response.send('Hello World!')
})

// --- 3. The New Recursive Route ---
// Usage: curl http://localhost:5000/fib/10
app.get('/fib/:n', function(req, res) {
  var n = parseInt(req.params.n);
  
  if (isNaN(n)) {
    console.error("[Trace-Test] Invalid number provided");
    return res.status(400).send("Please provide a number");
  }

  console.log(`[Trace-Test] Starting request for fib(${n})`);
  
  // Start recursion
  var result = fibonacci(n);
  
  console.log(`[Trace-Test] Finished result: ${result}`);
  res.send(`Fibonacci(${n}) is ${result}`);
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
