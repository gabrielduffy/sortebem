-- Add pixgo_payment_id column to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pixgo_payment_id TEXT;

-- Update card prices for active/future rounds
UPDATE rounds SET card_price = 10.00 WHERE type = 'regular' AND status IN ('selling', 'scheduled', 'open');
UPDATE rounds SET card_price = 15.00 WHERE type = 'special' AND status IN ('selling', 'scheduled', 'open');

-- Update feature flag from use_asaas_pix to use_pixgo_pix
UPDATE feature_flags SET key = 'use_pixgo_pix', description = 'Usar PixGo para geração de PIX' WHERE key = 'use_asaas_pix';

-- Insert if not exists
INSERT INTO feature_flags (key, enabled, description)
VALUES ('use_pixgo_pix', false, 'Usar PixGo para geração de PIX')
ON CONFLICT (key) DO NOTHING;

-- Update create_next_rounds function with new prices (R$ 10 regular, R$ 15 special)
CREATE OR REPLACE FUNCTION public.create_next_rounds()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  last_regular_round RECORD;
  last_special_round RECORD;
  next_regular_number INTEGER;
  next_special_number INTEGER;
  now_time TIMESTAMPTZ;
  regular_price DECIMAL(10,2);
  special_price DECIMAL(10,2);
BEGIN
  now_time := NOW();
  regular_price := 10.00;
  special_price := 15.00;

  SELECT * INTO last_regular_round
  FROM rounds WHERE type = 'regular' ORDER BY created_at DESC LIMIT 1;
  
  IF last_regular_round IS NULL OR 
     (last_regular_round.selling_ends_at < now_time AND last_regular_round.status != 'drawing') THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_regular_number FROM rounds WHERE type = 'regular';
    INSERT INTO rounds (number, type, status, card_price, max_cards, starts_at, ends_at, selling_ends_at, is_selling)
    VALUES (next_regular_number, 'regular', 'selling', regular_price, 1000, now_time, 
            now_time + INTERVAL '10 minutes', now_time + INTERVAL '7 minutes', true);
  END IF;

  SELECT * INTO last_special_round
  FROM rounds WHERE type = 'special' ORDER BY created_at DESC LIMIT 1;
  
  IF last_special_round IS NULL OR 
     (last_special_round.selling_ends_at < now_time AND last_special_round.status != 'drawing') THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_special_number FROM rounds WHERE type = 'special';
    INSERT INTO rounds (number, type, status, card_price, max_cards, starts_at, ends_at, selling_ends_at, is_selling)
    VALUES (next_special_number, 'special', 'selling', special_price, 5000, now_time,
            now_time + INTERVAL '60 minutes', now_time + INTERVAL '57 minutes', true);
  END IF;

  UPDATE rounds SET is_selling = false WHERE is_selling = true AND selling_ends_at < now_time AND status = 'selling';
  UPDATE rounds SET status = 'finished', is_selling = false, finished_at = now_time
  WHERE status IN ('selling', 'drawing') AND ends_at < now_time;
END;
$function$;