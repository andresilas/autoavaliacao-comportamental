let results = new Map();

// Função auxiliar: limpar resultados antigos (mantém só os últimos 24h)
function cleanOldResults() {
  const now = Date.now();
  for (const [key, value] of results.entries()) {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) {
      results.delete(key);
    }
  }
}

// Função auxiliar: obter resultado pelo e-mail
export function getResult(email) {
  cleanOldResults();
  return results.get(email);
}

// Função principal (endpoint)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, responsavel, idade, answers, score } = req.body;

  if (!email || !responsavel || !idade || !answers || score === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  let nivel = "Normal";
  let mensagem = "O comportamento observado parece dentro do esperado.";

  if (score > 30) {
    nivel = "Alerta Moderado";
    mensagem = "Alguns sinais indicam necessidade de observação mais atenta.";
  } else if (score > 45) {
    nivel = "Alto Alerta";
    mensagem = "Recomenda-se buscar avaliação profissional especializada.";
  }

  results.set(email, {
    responsavel,
    idade,
    answers,
    score,
    nivel,
    mensagem,
    timestamp: Date.now(),
  });

  return res.status(200).json({ success: true, nivel, mensagem });
}
