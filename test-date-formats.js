/**
 * Teste de Formatos de Data para Utmify
 * Testa múltiplos formatos para identificar qual é aceito
 */

require('dotenv').config();
const axios = require('axios');

async function testDateFormats() {
  console.log("\n🔍 TESTE DE FORMATOS DE DATA PARA UTMIFY");
  console.log("════════════════════════════════════════════════════════════\n");

  const now = new Date();
  
  // Diferentes formatos de data
  const dateFormats = {
    "UTC ISO (atual)": now.toISOString().replace('T', ' ').split('.')[0],
    "UTC ISO completo": now.toISOString(),
    "Formato dd/mm/yyyy HH:mm:ss": 
      now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR'),
    "Formato yyyy-mm-dd HH:mm:ss": 
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0'),
    "Timestamp Unix": Math.floor(now.getTime() / 1000).toString()
  };

  console.log("📅 FORMATOS DE DATA:\n");
  Object.entries(dateFormats).forEach(([format, value]) => {
    console.log(`${format}:`);
    console.log(`  ${value}\n`);
  });

  console.log("════════════════════════════════════════════════════════════\n");

  // Testar cada formato
  for (const [formatName, dateValue] of Object.entries(dateFormats)) {
    console.log(`🔄 Testando: ${formatName}`);
    console.log(`   Valor: ${dateValue}\n`);

    const orderId = `TEST_${Date.now()}_${Object.keys(dateFormats).indexOf(formatName)}`;
    
    const payload = {
      orderId: orderId,
      platform: "GlobalPay",
      paymentMethod: "pix",
      status: "waiting_payment",
      createdAt: dateValue,
      approvedDate: null,
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
        priceInCents: 8
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
        totalPriceInCents: 8,
        gatewayFeeInCents: 0,
        userCommissionInCents: 8,
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
            'x-api-token': process.env.UTMIFY_TOKEN,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: () => true
        }
      );

      if (response.status === 200 && response.data.OK === true) {
        console.log(`   ✅ SUCESSO! Order ID: ${orderId}`);
      } else {
        console.log(`   ❌ Falhou`);
        if (response.data?.data?.createdAt) {
          console.log(`      Erro de data: ${response.data.data.createdAt}`);
        } else {
          console.log(`      ${response.data?.message || response.data?.result}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    console.log("");
    await new Promise(r => setTimeout(r, 500)); // Delay entre testes
  }

  console.log("════════════════════════════════════════════════════════════\n");
}

testDateFormats();
