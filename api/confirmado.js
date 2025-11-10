// API Serverless para webhook Hotmart e envio de e-mail (Vercel)
import { Resend } from 'resend';
import { getResult } from './save-result';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Receber dados do webhook Hotmart
    const { event, data } = req.body;

    console.log('Webhook Hotmart recebido:', event);

    // Verificar se é evento de compra aprovada
    if (event !== 'PURCHASE_APPROVED' && event !== 'PURCHASE_COMPLETE') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    // Extrair e-mail do comprador
    const email = data?.buyer?.email || data?.email;

    if (!email) {
      console.error('E-mail não encontrado no webhook');
      return res.status(400).json({ error: 'E-mail não encontrado' });
    }

    console.log('Buscando resultado para:', email);

    // Buscar resultado salvo
    const savedData = getResult(email);

    if (!savedData) {
      console.error('Resultado não encontrado para:', email);
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    // Gerar PDF com os dados
    const pdfBase64 = generatePDFBase64(savedData);

    // Enviar e-mail com Resend
    await resend.emails.send({
      from: 'Autoavaliação Comportamental <noreply@yourdomain.com>',
      to: email,
      subject: 'Seu Relatório de Autoavaliação Comportamental Infantil',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1565c0;">Olá, ${savedData.responsavel}!</h2>
          <p>Seu relatório da <strong>Autoavaliação Comportamental Infantil</strong> está pronto.</p>
          <p>Clique no botão abaixo para baixar o resultado completo em PDF.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="data:application/pdf;base64,${pdfBase64}" 
               download="relatorio-autoavaliacao.pdf"
               style="background: #1976d2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Baixar Relatório
            </a>
          </div>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>⚠️ Atenção:</strong> Este conteúdo é educativo e não substitui avaliação médica ou psicológica profissional.
            </p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Este é um e-mail automático. Por favor, não responda.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'relatorio-autoavaliacao.pdf',
          content: pdfBase64,
        }
      ]
    });

    console.log('E-mail enviado com sucesso para:', email);

    return res.status(200).json({ 
      success: true, 
      message: 'E-mail enviado com sucesso' 
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error.message 
    });
  }
}

// Função para gerar PDF em Base64
function generatePDFBase64(data) {
  // Conteúdo básico do PDF em texto
  const pdfContent = `
Autoavaliação Comportamental Infantil
Relatório Educativo

Responsável: ${data.responsavel}
Idade da criança: ${data.idade} anos
Pontuação total: ${data.score}
Nível: ${data.nivel}

${data.mensagem}

Esta ferramenta é educativa e não substitui avaliação profissional.
Para mais informações, consulte um especialista.
  `.trim();

  // Converter para Base64 (simulação simplificada)
  // Em produção, use uma biblioteca como jsPDF ou pdfkit
  return Buffer.from(pdfContent).toString('base64');
}
