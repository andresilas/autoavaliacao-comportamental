export default async function handler(req, res) {
  // Verificar se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter o corpo da requisição
    const body = req.body;
    
    // Registrar no console para debug
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));
    
    // Responder com sucesso
    return res.status(200).json({ 
      message: 'OK', 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
