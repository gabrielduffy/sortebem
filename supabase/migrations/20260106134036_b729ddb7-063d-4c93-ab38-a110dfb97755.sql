-- Criar estabelecimento Online se não existir
INSERT INTO public.establishments (name, slug, code, is_active, commission_rate)
SELECT 'Sortebem Online', 'online', 'ONLINE', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.establishments WHERE slug = 'online' OR code = 'ONLINE'
);

-- Criar prompt para geração de nomes de jogadores
INSERT INTO public.groq_prompts (name, description, system_prompt, user_prompt_template, model, temperature, max_tokens, is_active, category)
VALUES 
(
  'generate_multiple_players',
  'Gera múltiplos nomes de jogadores fictícios brasileiros para automação de bots',
  'Você é um gerador de nomes brasileiros realistas. Sua tarefa é gerar nomes completos (primeiro nome e sobrenome) que pareçam naturais e diversificados. Use nomes comuns no Brasil, incluindo variações regionais. Retorne APENAS um array JSON com os nomes, sem explicações.',
  'Gere {{quantity}} nomes brasileiros completos e realistas para jogadores do estabelecimento "{{establishment_name}}". 

REGRAS:
- Nomes devem parecer naturais e brasileiros
- Inclua diversidade de gênero
- Use sobrenomes comuns brasileiros
- Retorne APENAS o JSON array, exemplo: ["Maria Silva", "João Santos"]

Retorne o JSON:',
  'llama-3.1-70b-versatile',
  0.8,
  1024,
  true,
  'automation'
),
(
  'generate_player_name',
  'Gera um único nome de jogador fictício brasileiro',
  'Você gera nomes brasileiros realistas. Retorne APENAS o nome completo, sem explicações.',
  'Gere 1 nome brasileiro completo e realista. Retorne APENAS o nome.',
  'llama-3.1-8b-instant',
  0.9,
  50,
  true,
  'automation'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  model = EXCLUDED.model,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = now();

-- Adicionar constraint unique no name do groq_prompts se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'groq_prompts_name_key'
  ) THEN
    ALTER TABLE public.groq_prompts ADD CONSTRAINT groq_prompts_name_key UNIQUE (name);
  END IF;
END $$;