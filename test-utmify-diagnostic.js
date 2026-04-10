/**
 * Teste de Diagnóstico Utmify
 * Verifica exatamente o que está sendo enviado
 */

require('dotenv').config();
const axios = require('axios');

async function testUtmifyDiagnostic() {
  console.log("\n🔍 TESTE DE DIAGNÓSTICO UTMIFY");
  console.log("════════════════════════════════════════════════════════════\n");

  const orderId = `ORD${Date.now()}`;
  const valorMZN = 5;
  const valorBRL = (valorMZN * 0.016).toFixed(2);
  const valorBRLCents = Math.round(valorBRL * 100);
  
  // Data em formato UTC correto
  const now = new Date();
  const dataAtual = now.toISOString().split('T')[0] + ' ' + now.toISOString().split('T')[1].split('.')[0];

  console.log(`📋 INFORMAÇÕES DO TESTE:`);
  console.log(`   Order ID: ${orderId}`);
  console.log(`   Valor: ${valorMZN} MZN = ${valorBRL} BRL (${valorBRLCents} centavos)`);
  console.log(`   Data/Hora (UTC): ${dataAtual}`);
  console.log(`   Token: ${process.env.UTMIFY_TOKEN}`);
  console.log(`   Endpoint: https://api.utmify.com.br/api-credentials/orders\n`);

  // Payload exato que será enviado
  const payload = {
    orderId: orderId,
    platform: "GlobalPay",
    paymentMethod: "pix",
    status: "waiting_payment",
    createdAt: dataAtual,
    approvedDate: null,
    refundedAt: null,
    customer: {
      name: "Teste User",
      email: "teste@example.com",
      phone: "855253617",
      document: null,
      country: "BR"
    },
    products: [{
      id: "taxa-google-ativa",
      name: "Taxa de Ativação Google",
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: valorBRLCents
    }],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: "test",
      utm_campaign: "test_campaign",
      utm_medium: "test",
      utm_content: null,
      utm_term: null
    },
    commission: {
      totalPriceInCents: valorBRLCents,
      gatewayFeeInCents: Math.round(valorBRLCents * 0.03),
      userCommissionInCents: Math.round(valorBRLCents * 0.97),
      currency: "BRL"
    },
    isTest: true
  };

  console.log("📤 PAYLOAD (waiting_payment):\n");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\n════════════════════════════════════════════════════════════\n");

  try {
    console.log("🔄 Enviando requisição...\n");
    const response = await axios.post(
      'https://api.utmify.com.br/api-credentials/orders',
      payload,
      {
        headers: {
          'x-api-token': process.env.UTMIFY_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("✅ RESPOSTA (Status " + response.status + "):\n");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("\n════════════════════════════════════════════════════════════\n");

    if (response.data.OK === true) {
      console.log("✅ SUCESSO! O pedido foi registrado na Utmify");
      console.log(`   Verifique no painel com Order ID: ${orderId}`);
      console.log(`   Método: PIX`);
      console.log(`   Status: waiting_payment`);
    }

  } catch (error) {
    console.log("❌ ERRO:\n");
    console.log("Status:", error.response?.status);
    console.log("Mensagem:", error.response?.data?.message);
    console.log("Erro Completo:", JSON.stringify(error.response?.data, null, 2));
    console.log("\n════════════════════════════════════════════════════════════\n");
  }
}

testUtmifyDiagnostic();
