import { Resend } from 'resend';

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

    // Extrair dados do comprador do webhook da Hotmart
    const buyerName = body.data?.buyer?.name || body.buyer?.name || 'Cliente';
    const buyerEmail = body.data?.buyer?.email || body.buyer?.email;
    
    // Se temos um e-mail válido, enviar e-mail de confirmação
    if (buyerEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const resultUrl = `https://autoavaliacao-comportamental.vercel.app/?pagamento=confirmado&email=${encodeURIComponent(buyerEmail)}`;
      
      await resend.emails.send({
        from: 'Autoavaliação Comportamental <onboarding@resend.dev>',
        to: buyerEmail,
        subject: 'Acesso liberado - Autoavaliação Comportamental Infantil',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1565c0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🧩 Autoavaliação Comportamental Infantil</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${buyerName}</strong>!</p>
                  
                  <p>Obrigado por adquirir o teste <strong>Autoavaliação Comportamental Infantil</strong>.</p>
                  
                  <p>Seu pagamento foi confirmado com sucesso! Agora você já pode acessar o questionário completo e, após responder, visualizar o resultado detalhado e baixar o relatório em PDF.</p>
                  
                  <p style="text-align: center;">
                    <a href="${resultUrl}" class="button">Acessar o Teste</a>
                  </p>
                  
                  <p><strong>O que você vai ter acesso:</strong></p>
                  <ul>
                    <li>Questionário completo com 20 perguntas</li>
                    <li>Resultado detalhado e personalizado</li>
                    <li>Relatório em PDF para download</li>
                    <li>Orientações baseadas na pontuação</li>
                  </ul>
                  
                  <p><em>Lembre-se: Esta é uma ferramenta educativa e não substitui avaliação médica ou psicológica profissional.</em></p>
                </div>
                <div class="footer">
                  <p>Qualquer dúvida, responda este e-mail.</p>
                  <p>© 2025 Autoavaliação Comportamental Infantil</p>
                </div>
              </div>
            </body>
          </html>
        `
      });
      
      console.log(`E-mail enviado com sucesso para ${buyerEmail}`);
    }
    
    // Responder com sucesso
    return res.status(200).json({ 
      message: 'OK', 
      received: true,
      timestamp: new Date().toISOString(),
      emailSent: !!buyerEmail
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
