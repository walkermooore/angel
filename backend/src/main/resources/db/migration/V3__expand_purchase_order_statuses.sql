ALTER TABLE purchase_order
    DROP CONSTRAINT IF EXISTS purchase_order_status_check;

ALTER TABLE purchase_order
    ADD CONSTRAINT purchase_order_status_check
    CHECK (
        status IN (
            'PENDENTE',
            'PAGO',
            'ENVIADO',
            'PRONTO_PARA_RETIRADA',
            'CONCLUIDO',
            'CANCELADO'
        )
    );
