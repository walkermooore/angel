package com.angel.backend.controller;

import com.angel.backend.model.CategoryEntity;
import com.angel.backend.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<CategoryEntity> listarCategorias() {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new CategoryEntity("prata"));
            categoryRepository.save(new CategoryEntity("cosmeticos"));
        }
        return categoryRepository.findAll();
    }

    @PostMapping
    public CategoryEntity criarCategoria(@RequestBody CategoryEntity category) {
        String name = category.getName().trim().toLowerCase();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            return categoryRepository.findByNameIgnoreCase(name).orElseThrow();
        }
        return categoryRepository.save(new CategoryEntity(name));
    }

    @DeleteMapping("/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarCategoria(@PathVariable String name) {
        categoryRepository.findByNameIgnoreCase(name).ifPresent(categoryRepository::delete);
    }
}
