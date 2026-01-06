-- Atualizar prompts para usar modelo atual do Groq (llama-3.3-70b-versatile)
UPDATE groq_prompts 
SET model = 'llama-3.3-70b-versatile', updated_at = now()
WHERE model = 'llama-3.1-70b-versatile';

-- Atualizar também qualquer outro modelo desatualizado
UPDATE groq_prompts 
SET model = 'llama-3.3-70b-versatile', updated_at = now()
WHERE model LIKE 'llama-3.1%';