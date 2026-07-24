package com.angel.backend.controller;

import com.angel.backend.model.FaqItem;
import com.angel.backend.repository.FaqRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faq")
public class FaqController {

    private final FaqRepository faqRepository;

    public FaqController(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    @GetMapping
    public List<FaqItem> listarFaqs() {
        if (faqRepository.count() == 0) {
            faqRepository.save(new FaqItem("Quais são as formas de pagamento?", "Aceitamos Pix, Cartão de Crédito em até 6x e Boleto Bancário."));
            faqRepository.save(new FaqItem("As peças possuem garantia?", "Sim! Todas as nossas joias em Prata 925 acompanham certificado de garantia vitalícia do metal."));
            faqRepository.save(new FaqItem("Qual é o prazo de entrega?", "O prazo varia de acordo com o seu CEP e a modalidade escolhida no momento do checkout."));
        }
        return faqRepository.findAll();
    }

    @PostMapping
    public FaqItem criarFaq(@RequestBody FaqItem item) {
        return faqRepository.save(item);
    }

    @PutMapping("/{id}")
    public FaqItem atualizarFaq(@PathVariable UUID id, @RequestBody FaqItem item) {
        FaqItem existing = faqRepository.findById(id).orElseThrow();
        existing.setQuestion(item.getQuestion());
        existing.setAnswer(item.getAnswer());
        return faqRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarFaq(@PathVariable UUID id) {
        faqRepository.deleteById(id);
    }
}
