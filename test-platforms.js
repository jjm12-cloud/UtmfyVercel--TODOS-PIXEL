/**
 * Teste: Identificar plataforma correta
 */

require('dotenv').config();
const axios = require('axios');

async function testPlatforms() {
  const platformsToTest = [
    "Google",
    "GlobalPay", 
    "CheckOut",
    "Payment",
    "Store",
    "App",
    "Web",
    "Mobile"
  ];

  console.log("\n🔍 TESTANDO PLATAFORMAS");
  console.log("════════════════════════════════════════════════════════════\n");

  for (const platform of platformsToTest) {
    const orderId = `PLAT_${platform}_${Date.now()}`;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const dataAtual = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const payload = {
      orderId: orderId,
      platform: platform,
      paymentMethod: "pix",
      status: "paid",
      createdAt: dataAtual,
      approvedDate: dataAtual,
      refundedAt: null,
      customer: {
        name: "Teste",
        email: "teste@test.com",
        phone: "855253617",
        document: null,
        country: "BR"
      },
      products: [{
        id: "test",
        name: "Test",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: 800
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
        totalPriceInCents: 800,
        gatewayFeeInCents: 24,
        userCommissionInCents: 776,
        currency: "BRL"
      },
      isTest: false
    };

    try {
      const response = await axios.post(
        'https://api.utmify.com.br/api-credentials/orders',
        payload,
        {
          headers: {
            'x-api-token': process.env.UTMIFY_TOKEN
          },
          timeout: 10000,
          validateStatus: () => true
        }
      );

      if (response.status === 200 && response.data.OK) {
        console.log(`✅ ${platform.padEnd(15)} - SUCESSO! Order: ${orderId}`);
      } else {
        console.log(`❌ ${platform.padEnd(15)} - ${response.data?.message || 'Falhou'}`);
      }
    } catch (error) {
      console.log(`❌ ${platform.padEnd(15)} - Erro: ${error.message.slice(0, 40)}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n════════════════════════════════════════════════════════════\n");
}

testPlatforms();
