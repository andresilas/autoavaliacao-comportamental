// API Serverless para salvar resultados usando Vercel KV (Redis)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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

      // Salvar dados no Vercel KV com expiração de 48 horas
      const data = {
        email,
        responsavel,
        idade,
        answers,
        score,
        nivel,
        mensagem,
        timestamp: Date.now()
      };

      // Salvar com chave baseada no email e expiração de 48 horas (172800 segundos)
      await kv.set(`result:${email}`, JSON.stringify(data), { ex: 172800 });

      console.log(`Resultado salvo para: ${email}`);

      return res.status(200).json({ 
        success: true, 
        message: 'Dados salvos com sucesso' 
      });

    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      return res.status(500).json({ error: 'Erro ao processar dados', details: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: 'Email não fornecido' });
      }

      // Buscar dados do Vercel KV
      const dataString = await kv.get(`result:${email}`);

      if (!dataString) {
        return res.status(404).json({ error: 'Resultado não encontrado' });
      }

      const data = JSON.parse(dataString);

      return res.status(200).json(data);

    } catch (error) {
      console.error('Erro ao buscar resultado:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Exportar função auxiliar para obter resultados (para uso em outras APIs)
export async function getResult(email) {
  try {
    const dataString = await kv.get(`result:${email}`);
    if (!dataString) return null;
    return JSON.parse(dataString);
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    return null;
  }
}
