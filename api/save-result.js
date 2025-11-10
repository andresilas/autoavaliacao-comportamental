// API Serverless para salvar resultados temporariamente (Vercel)
const savedResults = new Map();

// Limpar dados antigos (24 horas)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of savedResults.entries()) {
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      savedResults.delete(email);
    }
  }
}, 60 * 60 * 1000);

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
    const { email, responsavel, idade, answers, score, nivel, mensagem } = req.body;

    // Validação básica
    if (!email || !responsavel || !idade || !answers || score === undefined) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Salvar dados temporariamente
    savedResults.set(email, {
      email,
      responsavel,
      idade,
      answers,
      score,
      nivel,
      mensagem,
      timestamp: Date.now()
    });

    console.log(`Resultado salvo para: ${email}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Dados salvos com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao salvar resultado:', error);
    return res.status(500).json({ error: 'Erro ao processar dados' });
  }
}

// Exportar função auxiliar para obter resultados
export function getResult(email) {
  return savedResults.get(email);
}
