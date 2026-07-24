package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "about_settings")
public class AboutSettings {

    @Id
    private Long id = 1L;

    private String subtitle = "Nossa história";

    @Column(columnDefinition = "TEXT")
    private String title = "Beleza é fazer do essencial algo memorável.";

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop";

    @Column(columnDefinition = "TEXT")
    private String paragraph1 = "A Angel nasceu em 2019 do desejo de criar peças que atravessassem o tempo — joias em prata 925 e cosméticos pensados para o cuidado diário, sem excessos.";

    @Column(columnDefinition = "TEXT")
    private String paragraph2 = "Cada colar, anel ou frasco é escolhido a dedo. Trabalhamos com ateliês independentes no Brasil e na Europa, garantindo materiais certificados, acabamentos impecáveis e uma produção consciente.";

    @Column(columnDefinition = "TEXT")
    private String paragraph3 = "Acreditamos que sofisticação não é sobre acumular, é sobre escolher bem. É por isso que nossa coleção é curta, curada e feita para durar.";

    private String stat1Number = "2019";
    private String stat1Label = "Fundação";

    private String stat2Number = "12k+";
    private String stat2Label = "Clientes";

    private String stat3Number = "100%";
    private String stat3Label = "Prata 925";

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
