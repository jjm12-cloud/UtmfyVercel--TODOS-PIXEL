const axios = require('axios');

// Configuração do teste
const testData = {
  nome: "Teste User",
  email: "teste@example.com",
  telefone: "855253617",
  numero: "855253617",
  metodo: "mpesa",
  tracking: {
    utm_source: "test",
    utm_campaign: "test_campaign",
    utm_medium: "test",
    utm_content: null,
    utm_term: null,
    src: null
  }
};

async function runTest() {
  console.log("\n🔵 INICIANDO TESTE DE PAGAMENTO");
  console.log("=" .repeat(60));
  console.log("Dados do Teste:");
  console.log(JSON.stringify(testData, null, 2));
  console.log("=" .repeat(60));

  try {
    console.log("\n📤 Enviando requisição para /api/pay...\n");
    
    const response = await axios.post('http://localhost:3001/api/pay', testData, {
      timeout: 60000
    });

    console.log("\n✅ SUCESSO!");
    console.log("=" .repeat(60));
    console.log("Resposta do servidor:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("=" .repeat(60));
    
  } catch (error) {
    console.log("\n❌ ERRO!");
    console.log("=" .repeat(60));
    
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Dados da resposta:");
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("Nenhuma resposta recebida:");
      console.log("Request:", error.request);
      console.log("Message:", error.message);
      console.log("Code:", error.code);
    } else {
      console.log("Erro ao fazer requisição:");
      console.log(error.message);
      console.log(error.stack);
    }
    console.log("=" .repeat(60));
    process.exit(1);
  }
}

runTest();
