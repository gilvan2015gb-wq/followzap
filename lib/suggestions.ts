type Categoria = 'preco' | 'indecisao' | 'confianca' | 'entrega' | 'funcao'

const gatilhos: Record<Categoria, string[]> = {
  preco:     ['caro', 'preço', 'valor'],
  indecisao: ['vou pensar', 'depois vejo', 'mais tarde'],
  confianca: ['é confiável', 'seguro', 'chega', 'golpe'],
  entrega:   ['prazo', 'demora', 'entrega'],
  funcao:    ['funciona', 'resolve', 'é bom'],
}

const sugestoes: Record<Categoria, string> = {
  preco:     'Entendo. Muita gente pensa isso no começo 😊 Quer que eu te explique rapidinho a diferença?',
  indecisao: 'Claro 😊 Só pra eu te ajudar melhor: sua dúvida é sobre o valor, entrega ou se realmente funciona?',
  confianca: 'Fica tranquilo 😊 A ideia é te dar segurança no processo e deixar tudo claro antes de finalizar.',
  entrega:   'A entrega depende da sua região, mas eu posso verificar e já te orientar certinho.',
  funcao:    'Sim 😊 A ideia é justamente ajudar nesse problema de forma prática no dia a dia.',
}

export function detectarSugestao(texto: string): string | null {
  const lower = texto.toLowerCase()

  for (const categoria in gatilhos) {
    const cat = categoria as Categoria
    const encontrou = gatilhos[cat].some(palavra => lower.includes(palavra))
    if (encontrou) return sugestoes[cat]
  }

  return null
}