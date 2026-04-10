/**
 * Teste do fluxo COMPLETO da Utmify
 * - Envia pedido com status "waiting_payment"
 * - Envia pedido com status "paid"
 */

require('dotenv').config();
const axios = require('axios');

async function testUtmifyFlow() {
  console.log("\n🟢 TESTE COMPLETO DO FLUXO UTMIFY (5 MZN → 8 centavos BRL)");
  console.log("════════════════════════════════════════════════════════════\n");

  const orderId = `ORD${Date.now()}`;
  const valorMZN = 5;
  const valorBRL = (valorMZN * 0.016).toFixed(2);
  const valorBRLCents = Math.round(valorBRL * 100);
  const dataAtual = new Date().toISOString().split('T')[0] + ' ' + new Date().toISOString().split('T')[1].split('.')[0];

  console.log(`📋 Informações do Pedido:`);
  console.log(`   Order ID: ${orderId}`);
  console.log(`   Valor: ${valorMZN} MZN = ${valorBRL} BRL (${valorBRLCents} centavos)`);
  console.log(`   Data: ${dataAtual}`);
  console.log(`   Token Utmify: ${process.env.UTMIFY_TOKEN}\n`);

  try {
    // 1. Enviar como "waiting_payment"
    console.log("⏳ [1/2] Enviando pedido com status: WAITING_PAYMENT\n");
    
    const pendingPayload = {
      orderId: orderId,
      platform: "GlobalPay",
      paymentMethod: "boleto",
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

    console.log("Payload enviado:");
    console.log(JSON.stringify(pendingPayload, null, 2));
    console.log("");

    const pendingResponse = await axios.post(
      'https://api.utmify.com.br/api-credentials/orders',
      pendingPayload,
      {
        headers: {
          'x-api-token': process.env.UTMIFY_TOKEN
        },
        timeout: 10000
      }
    );

    console.log("✅ RESPOSTA PENDING:");
    console.log(JSON.stringify(pendingResponse.data, null, 2));
    console.log("");

    // 2. Aguardar 2 segundos
    console.log("⏳ Aguardando 2 segundos...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Enviar como "paid"
    console.log("✨ [2/2] Enviando pedido com status: PAID\n");

    const paidPayload = {
      orderId: orderId,
      platform: "GlobalPay",
      paymentMethod: "boleto",
      status: "paid",
      createdAt: dataAtual,
      approvedDate: dataAtual,
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

    console.log("Payload enviado:");
    console.log(JSON.stringify(paidPayload, null, 2));
    console.log("");

    const paidResponse = await axios.post(
      'https://api.utmify.com.br/api-credentials/orders',
      paidPayload,
      {
        headers: {
          'x-api-token': process.env.UTMIFY_TOKEN
        },
        timeout: 10000
      }
    );

    console.log("✅ RESPOSTA PAID:");
    console.log(JSON.stringify(paidResponse.data, null, 2));
    console.log("");

    console.log("════════════════════════════════════════════════════════════");
    console.log("🎉 SUCESSO! Fluxo Utmify completo funcionando!");
    console.log("════════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.log("════════════════════════════════════════════════════════════");
    console.log("❌ ERRO NA REQUISIÇÃO:");
    console.log(JSON.stringify({
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    }, null, 2));
    console.log("════════════════════════════════════════════════════════════\n");
    process.exit(1);
  }
}

testUtmifyFlow();
