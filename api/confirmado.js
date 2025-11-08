const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Garantir que o corpo venha como JSON
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Webhook recebido:', body);

    const { buyer } = body || {};
    const emailCliente = buyer?.email || 'teste@example.com';
    const nomeCliente = buyer?.name || 'Cliente';

    const data = await resend.emails.send({
      from: 'Autoavaliação <no-reply@seu-dominio.com>',
      to: emailCliente,
      subject: 'Seu acesso ao Teste Educativo Online 🎓',
      html: `
        <h2>Olá, ${nomeCliente}!</h2>
        <p>Seu pagamento foi aprovado ✅</p>
        <p>Aqui está o link para acessar o teste:</p>
        <a href="https://autoavaliacao-comportamental.vercel.app" target="_blank">
          👉 Clique aqui para iniciar o teste
        </a>
        <br><br>
        <p>Qualquer dúvida, estamos à disposição!</p>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
