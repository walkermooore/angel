package com.angel.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "home_settings")
public class HomeSettings {

    @Id
    private Long id = 1L;

    private String heroTitle;

    @Column(columnDefinition = "TEXT")
    private String heroDescription;

    @Column(columnDefinition = "TEXT")
    private String heroImage;

    @ElementCollection
    @CollectionTable(name = "home_values")
    private List<ValueItem> values;

    @ElementCollection
    private List<String> highlightIds;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValueItem {
        private String id;
        private String title;
        private String subtitle;
    }
}
