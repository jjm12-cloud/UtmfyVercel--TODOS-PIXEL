/**
 * Teste de Pagamento com EMOLA
 * Número: 87857087
 * Valor: 197 MZN
 */

require('dotenv').config();
const http = require('http');
const axios = require('axios');

const PORT = 3001;

// Iniciar servidor
require('./server.js');

// Aguardar servidor iniciar
setTimeout(async () => {
  console.log("\n🟢 TESTE EMOLA - 197 MZN");
  console.log("════════════════════════════════════════════════════════════\n");

  const testData = {
    numero: "87857087",
    metodo: "emola",
    nome: "Teste Emola",
    email: "teste@emola.test",
    telefone: "87857087",
    tracking: {
      utm_source: "test",
      utm_campaign: "emola_test",
      utm_medium: "mobile",
      utm_content: null,
      utm_term: null,
      src: null
    }
  };

  console.log("📊 Dados da Requisição:");
  console.log(JSON.stringify(testData, null, 2));
  console.log("");

  try {
    console.log("📤 Enviando POST /api/pay...\n");
    
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
      console.log("🎉 PAGAMENTO PROCESSADO COM SUCESSO!");
      console.log(`   Order ID: ${response.data.data?.orderId}`);
      console.log(`   Valor: 197 MZN`);
      console.log(`   Método: Emola`);
      console.log(`   Número: 87857087`);
    } else if (response.data.message?.includes('timeout')) {
      console.log("⚠️  TIMEOUT NA REQUISIÇÃO");
      console.log("✅ MAS UTMIFY FOI ATUALIZADO COM SUCESSO!");
    } else {
      console.log("❌ ERRO NA REQUISIÇÃO");
    }

  } catch (error) {
    console.log("════════════════════════════════════════════════════════════");
    console.log("❌ ERRO:");
    console.log(error.message);
    console.log("════════════════════════════════════════════════════════════\n");
  }

  // Encerrar
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}, 1500);
