-- Catálogo de preços "de fábrica" do SIM Budget System (o mesmo catálogo que
-- existia no modo de demonstração local). É OPCIONAL — o schema.sql principal
-- não roda isso automaticamente, porque a tabela price_list deve começar
-- vazia. Rode este arquivo no SQL Editor do Supabase só se quiser começar
-- com uma base de preços pronta em vez de cadastrar tudo manualmente.
--
-- Rode só uma vez: não há chave única em price_list.name, então rodar de
-- novo duplica os itens.

insert into price_list (category, name, cost_base, price_base, fee_percent, tax_percent, sale_price, cost_price, active) values
('Pré Produção', 'Roteiro', 1600, 2400, 15, 7, 2928, 1600, true),
('Pré Produção', 'Storyboard', 1200, 1800, 15, 7, 2196, 1200, true),
('Pré Produção', 'Produtor', 1500, 2250, 15, 7, 2745, 1500, true),
('Pré Produção', 'Produtor Executivo', 2800, 4200, 15, 7, 5124, 2800, true),

('Produção', 'Diretor', 2000, 3000, 15, 7, 3660, 2000, true),
('Produção', 'Filmmaker', 900, 1350, 15, 7, 1647, 900, true),
('Produção', 'Diretor de Fotografia', 2200, 3300, 15, 7, 4026, 2200, true),
('Produção', 'Assistente de Câmera', 750, 1125, 15, 7, 1372.5, 750, true),
('Produção', 'Assistente de Direção', 900, 1350, 15, 7, 1647, 900, true),
('Produção', 'Logger', 600, 900, 15, 7, 1098, 600, true),
('Produção', 'Gaffer', 1400, 2100, 15, 7, 2562, 1400, true),
('Produção', 'Operador de Áudio', 1100, 1650, 15, 7, 2013, 1100, true),
('Produção', 'Drone / FPV', 1800, 2700, 15, 7, 3294, 1800, true),

('Fotografia', 'Fotógrafo', 1500, 2250, 15, 7, 2745, 1500, true),
('Fotografia', 'Assistente de Fotografia', 650, 975, 15, 7, 1189.5, 650, true),

('Pós Produção', 'Edição de Vídeo', 2000, 3000, 15, 7, 3660, 2000, true),
('Pós Produção', 'Edição Sameday', 2600, 3900, 15, 7, 4758, 2600, true),
('Pós Produção', 'Motion', 1800, 2700, 15, 7, 3294, 1800, true),
('Pós Produção', 'VFX', 3000, 4500, 15, 7, 5490, 3000, true),

('Reels', 'Edição de Reel', 90, 135, 15, 7, 164.7, 90, true),
('Reels', 'Motion Design Reel', 160, 240, 15, 7, 292.8, 160, true),
('Reels', 'Color Grading Reel', 110, 165, 15, 7, 201.3, 110, true),

('Finalização', 'Color Grading', 1500, 2250, 15, 7, 2745, 1500, true),
('Finalização', 'Sound Design', 1200, 1800, 15, 7, 2196, 1200, true),
('Finalização', 'Trilha', 1700, 2550, 15, 7, 3111, 1700, true),
('Finalização', 'Locução', 800, 1200, 15, 7, 1464, 800, true),

('Logística', 'Alimentação', 500, 750, 15, 7, 915, 500, true),
('Logística', 'Catering', 1300, 1950, 15, 7, 2379, 1300, true),
('Logística', 'Transporte Van', 700, 1050, 15, 7, 1281, 700, true),
('Logística', 'Transporte Uber', 300, 450, 15, 7, 549, 300, true),
('Logística', 'Hospedagem', 650, 975, 15, 7, 1189.5, 650, true),

('Equipamentos', 'Câmera', 700, 1050, 15, 7, 1281, 700, true),
('Equipamentos', 'Lentes', 350, 525, 15, 7, 640.5, 350, true),
('Equipamentos', 'Iluminação', 500, 750, 15, 7, 915, 500, true),
('Equipamentos', 'Drone', 800, 1200, 15, 7, 1464, 800, true),
('Equipamentos', 'Estabilizador / Gimbal', 280, 420, 15, 7, 512.4, 280, true),
('Equipamentos', 'Áudio / Microfones', 250, 375, 15, 7, 457.5, 250, true),
('Equipamentos', 'Tripé / Suportes', 100, 150, 15, 7, 183, 100, true),
('Equipamentos', 'Cartões / Storage', 150, 225, 15, 7, 274.5, 150, true),

('Equipe', 'Diretor', 1500, 2250, 15, 7, 2745, 1500, true),
('Equipe', 'Diretor de Fotografia', 1200, 1800, 15, 7, 2196, 1200, true),
('Equipe', 'Filmmaker', 900, 1350, 15, 7, 1647, 900, true),
('Equipe', 'Operador de Câmera', 600, 900, 15, 7, 1098, 600, true),
('Equipe', 'Assistente de Câmera', 350, 525, 15, 7, 640.5, 350, true),
('Equipe', 'Fotógrafo', 900, 1350, 15, 7, 1647, 900, true),
('Equipe', 'Produtor', 700, 1050, 15, 7, 1281, 700, true),
('Equipe', 'Operador de Áudio', 500, 750, 15, 7, 915, 500, true),
('Equipe', 'Gaffer / Elétrica', 550, 825, 15, 7, 1006.5, 550, true),
('Equipe', 'Piloto de Drone', 700, 1050, 15, 7, 1281, 700, true),

('Extras', 'Verba Extra', 2500, 2500, 0, 0, 2500, 2500, true),
('Extras', 'Material Bruto', 0, 0, 0, 0, 0, 0, true);
