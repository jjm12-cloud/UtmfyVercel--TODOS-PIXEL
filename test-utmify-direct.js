require('dotenv').config();
const axios = require('axios');

async function testUtmifyDirect() {
  console.log("\n🔵 TESTE DIRETO DA API UTMIFY");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`Token: ${process.env.UTMIFY_TOKEN}`);
  console.log(`Endpoint: https://api.utmify.com.br/api-credentials/orders`);
  console.log("════════════════════════════════════════════════════════════\n");

  // Payload simples baseado na documentação
  const payload = {
    orderId: `TEST_${Date.now()}`,
    platform: "TestPlatform",
    paymentMethod: "boleto",
    status: "paid",
    createdAt: "2026-01-12 10:54:34",
    approvedDate: "2026-01-12 10:54:34",
    refundedAt: null,
    customer: {
      name: "Test User",
      email: "test@test.com",
      phone: "11999999999",
      document: null,
      country: "BR"
    },
    products: [{
      id: "test-product",
      name: "Test Product",
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: 1000
    }],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null
    },
    commission: {
      totalPriceInCents: 1000,
      gatewayFeeInCents: 30,
      userCommissionInCents: 970,
      currency: "BRL"
    },
    isTest: true
  };

  console.log("📤 Payload enviado:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\n════════════════════════════════════════════════════════════\n");

  try {
    console.log("🔄 Enviando requisição com header 'x-api-token'...\n");
    const response = await axios.post('https://api.utmify.com.br/api-credentials/orders', payload, {
      headers: {
        'x-api-token': process.env.UTMIFY_TOKEN
      },
      timeout: 10000
    });

    console.log("✅ SUCESSO!");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log("❌ ERRO");
    console.log("Status:", error.response?.status);
    console.log("Error Data:", JSON.stringify(error.response?.data, null, 2));
    console.log("Error Message:", error.message);
    console.log("Error Code:", error.code);
    
    // Se o erro for 404, tenta diferentes variações
    if (error.response?.status === 404 || error.response?.data?.message === 'API_CREDENTIAL_NOT_FOUND') {
      console.log("\n════════════════════════════════════════════════════════════");
      console.log("🔍 Token não encontrado. Testando variações de header...\n");
      
      // Tenta com 'x-api-key'
      try {
        console.log("🔄 Tentativa 2: header 'x-api-key'...");
        const response2 = await axios.post('https://api.utmify.com.br/api-credentials/orders', payload, {
          headers: {
            'x-api-key': process.env.UTMIFY_TOKEN
          },
          timeout: 10000
        });
        console.log("✅ Funcionou com 'x-api-key'!");
        console.log(JSON.stringify(response2.data, null, 2));
      } catch (e2) {
        console.log("❌ 'x-api-key' também falhou:", e2.response?.status, e2.response?.data?.message);
      }

      // Tenta com 'Authorization: Bearer'
      try {
        console.log("\n🔄 Tentativa 3: header 'Authorization: Bearer'...");
        const response3 = await axios.post('https://api.utmify.com.br/api-credentials/orders', payload, {
          headers: {
            'Authorization': `Bearer ${process.env.UTMIFY_TOKEN}`
          },
          timeout: 10000
        });
        console.log("✅ Funcionou com 'Authorization: Bearer'!");
        console.log(JSON.stringify(response3.data, null, 2));
      } catch (e3) {
        console.log("❌ 'Authorization: Bearer' também falhou:", e3.response?.status, e3.response?.data?.message);
      }

      // Tenta com token no body
      try {
        console.log("\n🔄 Tentativa 4: token no body...");
        const payloadWithToken = { ...payload, apiToken: process.env.UTMIFY_TOKEN };
        const response4 = await axios.post('https://api.utmify.com.br/api-credentials/orders', payloadWithToken, {
          timeout: 10000
        });
        console.log("✅ Funcionou com token no body!");
        console.log(JSON.stringify(response4.data, null, 2));
      } catch (e4) {
        console.log("❌ Token no body também falhou:", e4.response?.status, e4.response?.data?.message);
      }
    }
  }
}

testUtmifyDirect();
