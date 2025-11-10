import { Resend } from 'resend';
import { getResult } from './save-result';

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

            // Tentar buscar resultado salvo
            const savedResult = getResult(buyerEmail);

            if (savedResult) {
                      const { responsavel, idade, score, nivel, mensagem } = savedResult;

                      // Enviar email com dados reais
                      await resend.emails.send({
                                  from: 'Autoavaliação Comportamental <onboarding@resend.dev>',
                                  to: buyerEmail,
                                  subject: `Resultado do Teste - ${nivel}`,
                                  html: `
                                              <h2>Resultado do Teste</h2>
                                                          <p><strong>Responsável:</strong> ${responsavel}</p>
                                                                      <p><strong>Idade da Criança:</strong> ${idade} anos</p>
                                                                                  <p><strong>Pontuação:</strong> ${score}</p>
                                                                                              <p><strong>Nível:</strong> ${nivel}</p>
                                                                                                          <p>${mensagem}</p>
                                                                                                                      <a href="https://autoavaliacao-comportamental.vercel.app/resultado?email=${encodeURIComponent(buyerEmail)}">
                                                                                                                                    👉 Acessar Resultado Completo
                                                                                                                                                </a>
                                                                                                                                                          `,
                                });

                      console.log(`Email enviado com dados reais para ${buyerEmail}`);
                    } else {
                      console.warn(`Nenhum resultado encontrado para ${buyerEmail}. Enviando email genérico.`);
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
