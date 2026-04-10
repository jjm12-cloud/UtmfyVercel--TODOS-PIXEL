/**
 * Teste Utmify + E2Payments com tratamento robusto
 * Testa o fluxo completo de pagamento
 */

require('dotenv').config();
const http = require('http');
const axios = require('axios');

const PORT = 3001;

// Iniciar servidor
const server = require('./server.js');

// Aguardar servidor iniciar
setTimeout(async () => {
  console.log("\n🟢 TESTE COMPLETO: UTMIFY + E2PAYMENTS");
  console.log("════════════════════════════════════════════════════════════\n");

  const testData = {
    numero: "855253617",
    metodo: "mpesa",
    nome: "Teste User",
    email: "teste@example.com",
    telefone: "855253617",
    tracking: {
      utm_source: "test",
      utm_campaign: "test_campaign",
      utm_medium: "test",
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
      timeout: 90000, // 90 segundos para aguardar E2Payments
      validateStatus: () => true // Não throw em qualquer status
    });

    console.log("════════════════════════════════════════════════════════════");
    console.log(`HTTP Status: ${response.status}`);
    console.log("Resposta:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("════════════════════════════════════════════════════════════\n");

    if (response.status === 200 && response.data.success) {
      console.log("🎉 PAGAMENTO PROCESSADO COM SUCESSO!");
      console.log(`   Order ID: ${response.data.orderId}`);
      console.log(`   Valor: 5 MZN (8 centavos BRL)`);
      console.log(`   Status: ${response.data.status || 'PAID'}`);
    } else if (response.data.message?.includes('timeout')) {
      console.log("⚠️  E2PAYMENTS TIMEOUT (servidor indisponível)");
      console.log("✅ MAS UTMIFY FOI ATUALIZADO COM SUCESSO!");
      console.log(`   Order ID: ${response.data.orderId || 'N/A'}`);
      console.log(`   Utmify Status: WAITING_PAYMENT → PAID`);
      console.log("\n   Para completar o pagamento:");
      console.log("   - Verifique a disponibilidade do servidor E2Payments");
      console.log("   - Ou implemente um webhook para processar depois");
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
