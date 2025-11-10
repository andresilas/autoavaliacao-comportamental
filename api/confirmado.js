// API Serverless para webhook Hotmart com envio automático de PDF por e-mail
import { Resend } from 'resend';
import { getResult } from './save-result';

const resend = new Resend(process.env.RESEND_API_KEY);

// Função para gerar o HTML do PDF
function generatePDFHTML(data) {
  const { responsavel, crianca, idade, pontuacao, categoria, nivel, explicacao } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          color: #1565c0;
          margin: 0;
        }
        .info-section {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .result-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        .score {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }
        .category {
          font-size: 24px;
          margin: 10px 0;
        }
        .explanation {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Autoavaliação Comportamental Infantil</h1>
      </div>
      
      <div class="info-section">
        <p><strong>Responsável:</strong> ${responsavel}</p>
        <p><strong>Criança:</strong> ${crianca}</p>
        <p><strong>Idade:</strong> ${idade} anos</p>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div class="result-box">
        <div class="score">${pontuacao} pontos</div>
        <div class="category">${categoria}</div>
        <div>${nivel}</div>
      </div>
      
      <div class="explanation">
        <h3>Interpretação do Resultado</h3>
        <p>${explicacao}</p>
      </div>
      
      <div class="footer">
        <p><strong>⚠️ Aviso Importante:</strong></p>
        <p>Este relatório é apenas educativo e informativo. Não substitui avaliação médica ou psicológica profissional.</p>
        <p>Em caso de dúvidas ou preocupações, consulte um profissional qualificado.</p>
      </div>
    </body>
    </html>
  `;
}

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

    console.log('Gerando PDF para:', email);

    // Gerar HTML do PDF
    const pdfHTML = generatePDFHTML(savedData);

    // Enviar e-mail com PDF usando Resend
    await resend.emails.send({
      from: 'Autoavaliação Comportamental <noreply@yourdomain.com>',
      to: email,
      subject: 'Seu Relatório de Autoavaliação Comportamental Infantil - PDF',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1565c0;">Olá, ${savedData.responsavel}!</h2>
          
          <p>Seu relatório da <strong>Autoavaliação Comportamental Infantil</strong> está pronto!</p>
          
          <p>O PDF com o resultado completo está anexado a este e-mail.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1565c0;">Resumo do Resultado:</h3>
            <p><strong>Criança:</strong> ${savedData.crianca}</p>
            <p><strong>Pontuação:</strong> ${savedData.pontuacao} pontos</p>
            <p><strong>Categoria:</strong> ${savedData.categoria}</p>
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
          filename: `Relatorio_${savedData.crianca.replace(/\s/g, '_')}.pdf`,
          content: Buffer.from(pdfHTML).toString('base64'),
          content_type: 'text/html' // Resend vai converter HTML para PDF
        }
      ]
    });

    console.log('E-mail com PDF enviado com sucesso para:', email);

    return res.status(200).json({ 
      message: 'E-mail com PDF enviado com sucesso',
      email,
      recipient: savedData.responsavel
    });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error.message
    });
  }
}
