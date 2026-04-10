/**
 * Teste Debug: Verificar qual plataforma/produto funciona
 */

require('dotenv').config();
const axios = require('axios');

async function testSimplifiedPayload() {
  console.log("\n🔍 TESTE COM PAYLOAD SIMPLIFICADO");
  console.log("════════════════════════════════════════════════════════════\n");

  const orderId = `TEST_${Date.now()}`;
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const dataAtual = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  // Payload MINIMALISTA
  const payload = {
    orderId: orderId,
    paymentMethod: "pix",
    status: "paid",
    createdAt: dataAtual,
    customer: {
      name: "Teste",
      email: "teste@test.com",
      phone: "855253617"
    },
    products: [{
      quantity: 1,
      priceInCents: 800
    }],
    commission: {
      totalPriceInCents: 800,
      currency: "BRL"
    }
  };

  console.log("📤 PAYLOAD MINIMALISTA:\n");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\n════════════════════════════════════════════════════════════\n");

  try {
    console.log("🔄 Enviando...\n");
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

    console.log(`Status: ${response.status}\n`);
    console.log("Resposta:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("\n════════════════════════════════════════════════════════════\n");

    if (response.status === 200 && response.data.OK) {
      console.log(`✅ SUCESSO! Verifique no painel com Order: ${orderId}`);
    } else {
      console.log("❌ Falhou");
      if (response.data?.data) {
        console.log("Erros específicos:", response.data.data);
      }
    }

  } catch (error) {
    console.log("❌ Erro:", error.message);
  }
}

testSimplifiedPayload();
