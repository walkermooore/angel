-- Produtos cadastrados durante a implantação do controle de estoque receberam
-- quantidade zero por padrão. Restaura somente itens nunca vendidos ou reservados.
UPDATE product
SET stock_quantity = 100
WHERE stock_quantity = 0
  AND reserved_quantity = 0
  AND sold_quantity = 0;
