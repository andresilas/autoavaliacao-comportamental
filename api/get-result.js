import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email não fornecido' });
  }

  try {
    // Buscar resultado do Redis usando o email como chave
    const result = await kv.get(`result:${email}`);

    if (!result) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    // Calcular score e nível
    const score = result.respostas.filter(r => r === 'sim').length;
    
    let nivel, mensagem;
    if (score <= 10) {
      nivel = 'Baixo';
      mensagem = 'Com base nas respostas fornecidas, a criança apresenta poucos sinais típicos do espectro autista. Este é um resultado positivo, mas lembre-se de que esta ferramenta é educativa e não substitui uma avaliação profissional.';
    } else if (score <= 24) {
      nivel = 'Moderado';
      mensagem = 'As respostas indicam alguns sinais que podem estar relacionados ao espectro autista. Recomendamos buscar orientação de um profissional especializado (pediatra, neurologista ou psicólogo infantil) para uma avaliação mais detalhada.';
    } else {
      nivel = 'Alto';
      mensagem = 'As respostas indicam vários sinais que podem estar associados ao espectro autista. É importante consultar um profissional especializado o quanto antes para uma avaliação completa e, se necessário, iniciar intervenções adequadas.';
    }

    return res.status(200).json({
      responsavel: result.responsavel,
      idade: result.idade,
      email: result.email,
      score,
      nivel,
      mensagem,
      respostas: result.respostas
    });

  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    return res.status(500).json({ error: 'Erro ao buscar resultado' });
  }
}
