// Endpoint para receber webhooks da Hotmart
// URL: https://autoavaliacao-comportamental.vercel.app/api/confirmado

export default async function handler(req, res) {
  // Permitir apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    // Registrar o corpo da requisição no console
    console.log('=== WEBHOOK HOTMART RECEBIDO ===' );
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('================================');

    // Responder com sucesso
    return res.status(200).json({ 
      message: 'OK',
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}
