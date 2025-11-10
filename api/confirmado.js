// API Serverless para webhook Hotmart com envio automático de PDF por e-mail
import { Resend } from 'resend';
import { getResult } from './save-result';
import PDFDocument from 'pdfkit';

const resend = new Resend(process.env.RESEND_API_KEY);

// Função para gerar PDF usando PDFKit
async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    const { responsavel, crianca, idade, pontuacao, categoria, nivel, explicacao } = data;
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    // Coletar chunks do PDF
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
    
    // Cabeçalho
    doc.fontSize(24)
       .fillColor('#1565c0')
       .text('Relatório de Autoavaliação', { align: 'center' });
    
    doc.fontSize(18)
       .text('Comportamental Infantil', { align: 'center' });
    
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor('#1976d2')
       .lineWidth(3)
       .stroke();
    
    doc.moveDown(1.5);
    
    // Informações do relatório
    doc.fontSize(12)
       .fillColor('#333');
    
    doc.text(`Responsável: ${responsavel}`, { continued: false });
    doc.moveDown(0.5);
    doc.text(`Criança: ${crianca}`);
    doc.moveDown(0.5);
    doc.text(`Idade: ${idade} anos`);
    doc.moveDown(0.5);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
    
    doc.moveDown(2);
    
    // Box do resultado
    const boxY = doc.y;
    doc.rect(50, boxY, 495, 150)
       .fillAndStroke('#667eea', '#764ba2');
    
    doc.fillColor('#ffffff')
       .fontSize(48)
       .text(`${pontuacao}`, 50, boxY + 20, { width: 495, align: 'center' });
    
    doc.fontSize(14)
       .text('pontos', { width: 495, align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(22)
       .text(categoria, { width: 495, align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(14)
       .text(nivel, { width: 495, align: 'center' });
    
    doc.moveDown(4);
    
    // Explicação
    const explY = doc.y;
    doc.rect(46, explY - 5, 503, doc.heightOfString(explicacao, { width: 480 }) + 30)
       .fillAndStroke('#fff3cd', '#ffc107');
    
    doc.fillColor('#333')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Interpretação do Resultado', 55, explY + 5);
    
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .fontSize(11)
       .text(explicacao, { width: 480, align: 'justify' });
    
    doc.moveDown(3);
    
    // Rodapé
    doc.fontSize(10)
       .fillColor('#666')
       .text('⚠️ Aviso Importante:', { continued: false });
    
    doc.moveDown(0.5);
    doc.fontSize(9)
       .text('Este relatório é apenas educativo e informativo. Não substitui avaliação médica ou psicológica profissional.', { align: 'center' });
    doc.text('Em caso de dúvidas ou preocupações, consulte um profissional qualificado.', { align: 'center' });
    
    // Finalizar PDF
    doc.end();
  });
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

    // Gerar PDF
    const pdfBuffer = await generatePDF(savedData);

    console.log('PDF gerado, enviando e-mail...');

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
          content: pdfBuffer,
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
