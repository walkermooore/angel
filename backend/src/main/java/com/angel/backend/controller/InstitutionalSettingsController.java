package com.angel.backend.controller;

import com.angel.backend.model.InstitutionalSettings;
import com.angel.backend.repository.InstitutionalSettingsRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/paginas-institucionais")
public class InstitutionalSettingsController {

    private static final long SETTINGS_ID = 1L;
    private final InstitutionalSettingsRepository repository;

    public InstitutionalSettingsController(InstitutionalSettingsRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public InstitutionalSettings getSettings() {
        return repository.findById(SETTINGS_ID).orElseGet(this::defaults);
    }

    @PutMapping
    public InstitutionalSettings updateSettings(@RequestBody InstitutionalSettings request) {
        InstitutionalSettings settings = repository.findById(SETTINGS_ID).orElseGet(InstitutionalSettings::new);
        settings.setId(SETTINGS_ID);
        settings.setTermsContent(requiredOrDefault(request.getTermsContent(), defaults().getTermsContent()));
        settings.setExchangesContent(requiredOrDefault(request.getExchangesContent(), defaults().getExchangesContent()));
        settings.setPrivacyContent(requiredOrDefault(request.getPrivacyContent(), defaults().getPrivacyContent()));
        return repository.save(settings);
    }

    private String requiredOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private InstitutionalSettings defaults() {
        InstitutionalSettings settings = new InstitutionalSettings();
        settings.setId(SETTINGS_ID);
        settings.setTermsContent("""
            Bem-vinda à loja online da Angell. Ao acessar e utilizar este site, você concorda com os seguintes termos e condições:

            1. Propriedade Intelectual
            Todo o conteúdo visual, fotografias, marcas, nomes comerciais e design do site são de propriedade exclusiva da marca Angell. É proibida a reprodução sem autorização prévia por escrito.

            2. Informações dos Produtos e Preços
            Trabalhamos para garantir que todas as descrições, preços e disponibilidades dos produtos estejam corretos. Reservamo-nos o direito de corrigir eventuais erros tipográficos de preço sem aviso prévio.

            3. Garantia das Joias em Prata 925
            Garantimos a autenticidade do teor da Prata 925 de nossas peças. A garantia não cobre mau uso, quedas, arranhões ou exposição a reagentes químicos agressivos.
            """.trim());
        settings.setExchangesContent("""
            Queremos que você fique 100% satisfeita com sua compra na Angell. Caso precise trocar ou devolver um produto, siga as orientações abaixo:

            1. Prazo para Devolução por Arrependimento
            Você tem até 7 (sete) dias corridos após o recebimento do pedido para solicitar a devolução total ou parcial dos produtos por arrependimento, conforme previsto no Código de Defesa do Consumidor.

            2. Prazo para Trocas
            As solicitações de troca por outro modelo ou tamanho podem ser feitas em até 30 (trinta) dias corridos a contar do recebimento da encomenda.

            3. Condições dos Produtos
            O produto deve ser devolvido em sua embalagem original, acompanhado da nota fiscal/certificado de garantia da prata 925, sem indícios de uso ou avaria.

            4. Como Solicitar
            Envie uma mensagem via WhatsApp para nosso atendimento pelo número [contato removido] informando o número do seu pedido e o motivo da troca.
            """.trim());
        settings.setPrivacyContent("""
            A Angell compromete-se com a segurança e a privacidade dos dados de nossos clientes durante todo o processo de navegação e compra pelo site.

            1. Coleta de Informações
            Coletamos dados estritamente necessários para o processamento de compras, entrega de pedidos e comunicação referente aos seus pedidos.

            2. Uso e Proteção dos Dados
            Seus dados pessoais não serão vendidos, trocados ou divulgados para terceiros, exceto quando essas informações são necessárias para o processo de entrega ou cobrança.

            3. Segurança
            Adotamos medidas técnicas e administrativas para proteger as informações contra acessos não autorizados, perda, alteração ou divulgação indevida.
            """.trim());
        return settings;
    }
}
