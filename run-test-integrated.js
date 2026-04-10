#!/usr/bin/env node

// Start server and run test
const http = require('http');
require('dotenv').config();

// Importar handlers
const payHandler = require('./api/pay.js');
const testHandler = require('./api/test.js');

const server = http.createServer(async (req, res) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  const pathname = req.url.split('?')[0];

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }

      await handleRequest(pathname, req, res);
    });
  } else {
    req.body = {};
    await handleRequest(pathname, req, res);
  }
});

async function handleRequest(pathname, req, res) {
  try {
    if (pathname === '/api/pay') {
      await payHandler(req, res);
    } else if (pathname === '/api/test') {
      await testHandler(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}

const PORT = 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/pay`);
  console.log(`   - GET  http://localhost:${PORT}/api/test\n`);
  
  // Executar teste após 1 segundo
  setTimeout(() => {
    runTest();
  }, 1000);
});

// Função para executar o teste
async function runTest() {
  const axios = require('axios');
  
  const testData = {
    nome: "Teste User",
    email: "teste@example.com",
    telefone: "855253617",
    numero: "855253617",
    metodo: "mpesa",
    tracking: {
      utm_source: "test",
      utm_campaign: "test_campaign",
      utm_medium: "test",
      utm_content: null,
      utm_term: null,
      src: null
    }
  };

  console.log("════════════════════════════════════════════════════════════");
  console.log("🔵 INICIANDO TESTE DE PAGAMENTO COM UTMIFY");
  console.log("════════════════════════════════════════════════════════════");
  console.log("📊 Dados do Teste:");
  console.log(JSON.stringify(testData, null, 2));
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    console.log("📤 Enviando requisição POST /api/pay...\n");
    
    const response = await axios.post('http://localhost:3001/api/pay', testData, {
      timeout: 60000
    });

    console.log("\n✅ RESPOSTA RECEBIDA COM SUCESSO!");
    console.log("════════════════════════════════════════════════════════════");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("════════════════════════════════════════════════════════════");
    
  } catch (error) {
    console.log("\n❌ ERRO NA REQUISIÇÃO!");
    console.log("════════════════════════════════════════════════════════════");
    
    if (error.response) {
      console.log("HTTP Status:", error.response.status);
      console.log("Resposta:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("Tipo: Nenhuma resposta recebida");
      console.log("Mensagem:", error.message);
      console.log("Código:", error.code);
    } else {
      console.log("Tipo: Erro ao fazer requisição");
      console.log("Mensagem:", error.message);
    }
    console.log("════════════════════════════════════════════════════════════");
  }
  
  // Encerrar após 5 segundos
  setTimeout(() => {
    console.log("\n🛑 Encerrando teste...\n");
    process.exit(0);
  }, 5000);
}
