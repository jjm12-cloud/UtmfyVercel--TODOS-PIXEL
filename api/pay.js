require('dotenv').config();
const axios = require('axios');

// Função para ler UTMs do cookie gravado pelo script UTMfy
function getUTMsFromCookie(req) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const cookies = {};
    cookieHeader.split(';').forEach(c => {
      const [key, ...val] = c.trim().split('=');
      if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
    });

    // UTMfy grava as UTMs no cookie chamado 'utmify' em JSON
    if (cookies['utmify']) {
      return JSON.parse(cookies['utmify']);
    }

    // Fallback: ler cada UTM individualmente se estiverem em cookies separados
    return {
      utm_source:   cookies['utm_source']   || null,
      utm_medium:   cookies['utm_medium']   || null,
      utm_campaign: cookies['utm_campaign'] || null,
      utm_content:  cookies['utm_content']  || null,
      utm_term:     cookies['utm_term']     || null,
      src:          cookies['src']          || null,
      sck:          cookies['sck']          || null,
    };
  } catch (e) {
    console.warn('⚠️  Não foi possível ler UTMs do cookie:', e.message);
    return {
      utm_source: null, utm_medium: null, utm_campaign: null,
      utm_content: null, utm_term: null, src: null, sck: null
    };
  }
}

module.exports = async (req, res) => {
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

    const { numero, metodo, nome, email, telefone } = req.body;
    // ✅ UTMs lidas do cookie UTMfy — não dependem do frontend
    const tracking = getUTMsFromCookie(req);
    console.log('📌 UTMs capturadas do cookie:', tracking);

    if (!numero || !metodo || !nome || !email || !telefone) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    const orderId = `ORD${Date.now()}`.slice(0, 20);
    const valorMZN = 197.00;

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dataAtual = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

    const MZN_TO_BRL = 0.081;
    const valorBRL = valorMZN * MZN_TO_BRL;
    const valorBRLCents = Math.round(valorBRL * 100);

    let cleanNumber = numero.replace(/\D/g, '');
    if (cleanNumber.startsWith('258')) cleanNumber = cleanNumber.slice(3);
    const finalNumber = cleanNumber.slice(-9);

    if (finalNumber.length !== 9) {
      return res.status(400).json({ success: false, message: 'Número de telefone inválido' });
    }

    console.log(`[${new Date().toISOString()}] Iniciando pagamento:`, {
      orderId, metodo, phone: finalNumber,
      amountMZN: valorMZN, amountBRL: valorBRL.toFixed(2)
    });

    const utmifyPayload = (status, approvedDate) => ({
      orderId,
      platform: "GlobalPay",
      paymentMethod: "pix",
      status,
      createdAt: dataAtual,
      approvedDate: approvedDate || null,
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
        src:          tracking.src          || null,
        sck:          tracking.sck          || null,
        utm_source:   tracking.utm_source   || null,
        utm_campaign: tracking.utm_campaign || null,
        utm_medium:   tracking.utm_medium   || null,
        utm_content:  tracking.utm_content  || null,
        utm_term:     tracking.utm_term     || null
      },
      commission: {
        totalPriceInCents:      valorBRLCents,
        gatewayFeeInCents:      Math.round(valorBRLCents * 0.03),
        userCommissionInCents:  Math.round(valorBRLCents * 0.97),
        currency: "BRL"
      },
      isTest: false
    });

    // 1. UTMIFY — waiting_payment
    try {
      await axios.post('https://api.utmify.com.br/api-credentials/orders',
        utmifyPayload("waiting_payment", null),
        { headers: { 'x-api-token': process.env.UTMIFY_TOKEN }, timeout: 10000 }
      );
      console.log(`✅ Utmify waiting_payment enviado: ${orderId}`);
    } catch (e) {
      console.warn(`⚠️  Utmify (pending) falhou: ${e.response?.data?.message || e.message}`);
    }

    // 2. E2PAYMENTS — autenticação
    console.log('Iniciando autenticação E2P...');
    const authResponse = await axios.post("https://e2payments.explicador.co.mz/oauth/token", {
      grant_type: "client_credentials",
      client_id: process.env.E2P_CLIENT_ID,
      client_secret: process.env.E2P_CLIENT_SECRET
    }, { timeout: 60000 });

    const token = authResponse.data.access_token;
    if (!token) throw new Error('Token não retornado pela E2P');

    const wallet_id = metodo === 'mpesa' ? process.env.E2P_MPESA_WALLET : process.env.E2P_EMOLA_WALLET;

    const paymentResponse = await axios.post(
      `https://e2payments.explicador.co.mz/v1/c2b/${metodo}-payment/${wallet_id}`,
      { client_id: process.env.E2P_CLIENT_ID, amount: valorMZN.toString(), phone: finalNumber, reference: orderId },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 }
    );

    console.log('✅ Pagamento E2P processado com sucesso');

    // 3. UTMIFY — paid
    try {
      await axios.post('https://api.utmify.com.br/api-credentials/orders',
        utmifyPayload("paid", dataAtual),
        { headers: { 'x-api-token': process.env.UTMIFY_TOKEN }, timeout: 10000 }
      );
      console.log(`✅ Utmify paid enviado: ${orderId}`);
    } catch (e) {
      console.warn(`⚠️  Utmify (paid) falhou: ${e.response?.data?.message || e.message}`);
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
