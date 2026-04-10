require('dotenv').config();
const axios = require('axios');

module.exports = async (req, res) => {
  // Adicionar métodos Express-like ao res
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
    };
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const envVars = {
    E2P_CLIENT_ID: process.env.E2P_CLIENT_ID ? '✓ Presente' : '✗ Faltando',
    E2P_CLIENT_SECRET: process.env.E2P_CLIENT_SECRET ? '✓ Presente' : '✗ Faltando',
    E2P_MPESA_WALLET: process.env.E2P_MPESA_WALLET ? '✓ Presente' : '✗ Faltando',
    E2P_EMOLA_WALLET: process.env.E2P_EMOLA_WALLET ? '✓ Presente' : '✗ Faltando',
    UTMIFY_TOKEN: process.env.UTMIFY_TOKEN ? '✓ Presente' : '✗ Faltando'
  };

  const allPresent = Object.values(envVars).every(v => v.includes('✓'));

  // Testar conexão com Utmify
  let utmifyStatus = 'Não testado';
  try {
    const testOrder = await axios.post('https://api.utmify.com.br/api-credentials/orders', {
      orderId: `TEST_${Date.now()}`,
      platform: "GlobalPay",
      paymentMethod: "pix",
      status: "test",
      createdAt: new Date().toISOString(),
      customer: {
        name: "Test User",
        email: "test@test.com",
        phone: "999999999",
        country: "MZ"
      },
      products: [{
        id: "test",
        name: "Test Product",
        quantity: 1,
        priceInCents: 100
      }]
    }, {
      headers: {
        'x-api-token': process.env.UTMIFY_TOKEN
      },
      timeout: 10000
    });
    utmifyStatus = '✓ Conectado com sucesso';
  } catch (e) {
    utmifyStatus = `✗ Erro: ${e.response?.status || e.code} - ${e.response?.data?.message || e.message}`;
  }

  res.status(200).json({
    success: allPresent,
    message: allPresent ? 'Todas as variáveis estão configuradas' : 'Faltam variáveis de ambiente',
    variables: envVars,
    utmifyTest: utmifyStatus,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
};
