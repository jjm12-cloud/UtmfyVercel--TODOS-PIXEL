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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Validar variáveis de ambiente
    const requiredEnvVars = ['E2P_CLIENT_ID', 'E2P_CLIENT_SECRET', 'E2P_MPESA_WALLET', 'E2P_EMOLA_WALLET', 'UTMIFY_TOKEN'];
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingEnvVars.length > 0) {
      console.error('Variáveis de ambiente faltando:', missingEnvVars);
      return res.status(400).json({ 
        success: false, 
        message: 'Configuração do servidor incompleta',
        missing: missingEnvVars
      });
    }

    const { numero, metodo, nome, email, telefone, tracking } = req.body;

    // Validação básica
    if (!numero || !metodo || !nome || !email || !telefone) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    // Configurações do Pedido
    const orderId = `ORD${Date.now()}`.slice(0, 20); // Limitar a 20 caracteres
    const valorMZN = 197.00;
    
    // Data em formato UTC (Utmify quer UTC)
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const dataAtual = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    // Conversão de MZN para BRL (1 MZN ≈ 0.081 BRL)
    const MZN_TO_BRL = 0.081;
    const valorBRL = valorMZN * MZN_TO_BRL;
    const valorBRLCents = Math.round(valorBRL * 100);

    // Limpeza de número para 9 dígitos (sem 258)
    let cleanNumber = numero.replace(/\D/g, '');
    if (cleanNumber.startsWith('258')) cleanNumber = cleanNumber.slice(3);
    const finalNumber = cleanNumber.slice(-9);

    // Validar número
    if (finalNumber.length !== 9) {
      return res.status(400).json({ success: false, message: 'Número de telefone inválido' });
    }

    // Log para debug
    console.log(`[${new Date().toISOString()}] Iniciando pagamento:`, {
      orderId,
      metodo,
      phone: finalNumber,
      amountMZN: valorMZN,
      amountBRL: valorBRL.toFixed(2),
      amountBRLCents: valorBRLCents
    });

    // 1. ENVIAR PARA UTMIFY (opcional, não bloqueia o fluxo)
    // Mapear método de pagamento para formato Utmify
    const utmifyPaymentMethod = metodo === 'mpesa' ? 'pix' : metodo === 'emola' ? 'pix' : 'pix'; // Todos mapeados para PIX
    
    try {
      console.log(`[${new Date().toISOString()}] 📤 Tentando enviar para Utmify (pending)...`);
      await axios.post('https://api.utmify.com.br/api-credentials/orders', {
        orderId: orderId,
        platform: "GlobalPay",
        paymentMethod: utmifyPaymentMethod,
        status: "waiting_payment",
        createdAt: dataAtual,
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: nome,
          email: email,
          phone: telefone,
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
          src: tracking?.src || null,
          sck: tracking?.sck || null,
          utm_source: tracking?.utm_source || null,
          utm_campaign: tracking?.utm_campaign || null,
          utm_medium: tracking?.utm_medium || null,
          utm_content: tracking?.utm_content || null,
          utm_term: tracking?.utm_term || null
        },
        commission: {
          totalPriceInCents: valorBRLCents,
          gatewayFeeInCents: Math.round(valorBRLCents * 0.03),
          userCommissionInCents: Math.round(valorBRLCents * 0.97),
          currency: "BRL"
        },
        isTest: false
      }, {
        headers: {
          'x-api-token': process.env.UTMIFY_TOKEN
        },
        timeout: 10000
      });
      console.log(`✅ Utmify pending enviado com sucesso para orderId: ${orderId}`);
    } catch (e) {
      console.warn(`⚠️  Utmify (pending) indisponível - continuando fluxo: ${e.response?.data?.message || e.message}`);
      // Não bloqueia o fluxo de pagamento
    }

    // 2. PROCESSAR COBRANÇA E2PAYMENTS
    console.log('Iniciando autenticação E2P...');
    
    const authResponse = await axios.post("https://e2payments.explicador.co.mz/oauth/token", {
      grant_type: "client_credentials",
      client_id: process.env.E2P_CLIENT_ID,
      client_secret: process.env.E2P_CLIENT_SECRET
    }, {
      timeout: 60000
    });

    const token = authResponse.data.access_token;
    if (!token) {
      throw new Error('Token não retornado pela E2P');
    }

    console.log('Token obtido com sucesso. Processando pagamento...');

    const wallet_id = metodo === 'mpesa' ? process.env.E2P_MPESA_WALLET : process.env.E2P_EMOLA_WALLET;

    const paymentResponse = await axios.post(
      `https://e2payments.explicador.co.mz/v1/c2b/${metodo}-payment/${wallet_id}`,
      {
        client_id: process.env.E2P_CLIENT_ID,
        amount: valorMZN.toString(),
        phone: finalNumber,
        reference: orderId
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000
      }
    );

    console.log('Pagamento processado com sucesso');

    // 3. ATUALIZAR UTMIFY COMO PAGO (opcional)
    try {
      console.log(`[${new Date().toISOString()}] 📤 Tentando enviar para Utmify (paid)...`);
      await axios.post('https://api.utmify.com.br/api-credentials/orders', {
        orderId: orderId,
        platform: "GlobalPay",
        paymentMethod: utmifyPaymentMethod,
        status: "paid",
        createdAt: dataAtual,
        approvedDate: dataAtual,
        refundedAt: null,
        customer: {
          name: nome,
          email: email,
          phone: telefone,
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
          src: tracking?.src || null,
          sck: tracking?.sck || null,
          utm_source: tracking?.utm_source || null,
          utm_campaign: tracking?.utm_campaign || null,
          utm_medium: tracking?.utm_medium || null,
          utm_content: tracking?.utm_content || null,
          utm_term: tracking?.utm_term || null
        },
        commission: {
          totalPriceInCents: valorBRLCents,
          gatewayFeeInCents: Math.round(valorBRLCents * 0.03),
          userCommissionInCents: Math.round(valorBRLCents * 0.97),
          currency: "BRL"
        },
        isTest: false
      }, {
        headers: {
          'x-api-token': process.env.UTMIFY_TOKEN
        },
        timeout: 10000
      });
      console.log(`✅ Utmify paid enviado com sucesso para orderId: ${orderId}`);
    } catch (e) {
      console.warn(`⚠️  Utmify (paid) indisponível - continuando fluxo: ${e.response?.data?.message || e.message}`);
      // Não bloqueia o fluxo de pagamento
    }

    return res.status(200).json({ 
      success: true, 
      data: paymentResponse.data,
      message: 'Pagamento processado com sucesso'
    });

  } catch (error) {
    console.error("Erro Geral:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });

    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Erro ao processar pagamento',
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
};

