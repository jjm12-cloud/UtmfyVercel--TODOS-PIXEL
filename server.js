require('dotenv').config();
const http = require('http');
const url = require('url');

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  const pathname = req.url.split('?')[0];

  // Handle requests with body (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (body) {
          req.body = JSON.parse(body);
        } else {
          req.body = {};
        }
      } catch (e) {
        req.body = {};
      }

      await routeRequest(pathname, req, res);
    });
  } else {
    // Handle GET and other methods
    req.body = {};
    await routeRequest(pathname, req, res);
  }
});

async function routeRequest(pathname, req, res) {
  if (pathname === '/api/pay') {
    try {
      const payHandler = require('./api/pay.js');
      await payHandler(req, res);
    } catch (err) {
      console.error('Erro na API pay:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
  } else if (pathname === '/api/test') {
    try {
      const testHandler = require('./api/test.js');
      await testHandler(req, res);
    } catch (err) {
      console.error('Erro na API test:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Teste: http://localhost:${PORT}/api/test`);
});
