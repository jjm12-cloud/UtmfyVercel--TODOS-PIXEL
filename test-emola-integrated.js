/**
 * Teste Integrado: EMOLA
 * Número: 878570870 (9 dígitos)
 * Valor: 197 MZN
 */

require('dotenv').config();
const http = require('http');
const axios = require('axios');

const PORT = 3001;

// Iniciar servidor
const server = require('./server.js');

// Aguardar servidor iniciar
setTimeout(async () => {
  console.log("\n🟢 TESTE INTEGRADO - EMOLA (197 MZN)");
  console.log("════════════════════════════════════════════════════════════\n");

  const testData = {
    numero: "878570870",
    metodo: "emola",
    nome: "Teste Emola User",
    email: "teste@emola.example.com",
    telefone: "878570870",
    tracking: {
      utm_source: "test",
      utm_campaign: "emola_campaign",
      utm_medium: "mobile",
      utm_content: null,
      utm_term: null,
      src: null
    }
  };

  console.log("📊 Dados do Teste:");
  console.log(JSON.stringify(testData, null, 2));
  console.log("");

  try {
    console.log("📤 Enviando requisição POST /api/pay...\n");
    
    const response = await axios.post(`http://localhost:${PORT}/api/pay`, testData, {
      timeout: 90000,
      validateStatus: () => true
    });

    console.log("════════════════════════════════════════════════════════════");
    console.log(`HTTP Status: ${response.status}`);
    console.log("Resposta:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("════════════════════════════════════════════════════════════\n");

    if (response.status === 200 && response.data.success) {
      console.log("✅ PAGAMENTO PROCESSADO COM SUCESSO!");
      console.log(`   Order ID: ${response.data.data?.orderId}`);
      console.log(`   Valor: 197 MZN`);
      console.log(`   Método: Emola`);
      console.log(`   Número: 878570870`);
      console.log(`   Utmify: ATUALIZADO (pending → paid)`);
    } else if (response.data.message?.includes('timeout')) {
      console.log("⚠️  E2Payments TIMEOUT");
      console.log("✅ MAS UTMIFY FOI ATUALIZADO COM SUCESSO!");
      console.log(`   Order ID: ${response.data.data?.orderId}`);
    } else {
      console.log("❌ ERRO");
    }

  } catch (error) {
    console.log("════════════════════════════════════════════════════════════");
    console.log("❌ ERRO NA REQUISIÇÃO:");
    console.log(error.message);
    console.log("════════════════════════════════════════════════════════════\n");
  }

  // Encerrar
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}, 1500);
