package com.oli.oli.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.oli.oli.dto.CategoryDto;
import com.oli.oli.dto.ProductDto;
import com.oli.oli.model.Category;
import com.oli.oli.model.Product;
import com.oli.oli.repository.CategoryRepository;
import com.oli.oli.repository.ProductRepository;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public SearchController(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public Map<String, Object> globalSearch(@RequestParam(value = "q", required = false) String query) {
        Map<String, Object> result = new HashMap<>();

        if (!StringUtils.hasText(query)) {
            result.put("products", new ArrayList<>());
            result.put("categories", new ArrayList<>());
            result.put("totalResults", 0);
            return result;
        }

        String searchQuery = query.trim().toLowerCase();

        // Search products by name or description
        List<Product> allProducts = productRepository.findAll();
        List<ProductDto> matchedProducts = allProducts.stream()
                .filter(product -> {
                    String name = (product.getName() != null ? product.getName().toLowerCase() : "");
                    String description = (product.getDescription() != null ? product.getDescription().toLowerCase()
                            : "");
                    String shortDescription = (product.getShortDescription() != null
                            ? product.getShortDescription().toLowerCase()
                            : "");
                    return name.contains(searchQuery) || description.contains(searchQuery)
                            || shortDescription.contains(searchQuery);
                })
                .map(this::productToDto)
                .toList();

        // Search categories by name
        List<Category> allCategories = categoryRepository.findAll();
        List<CategoryDto> matchedCategories = allCategories.stream()
                .filter(category -> {
                    String name = (category.getName() != null ? category.getName().toLowerCase() : "");
                    return name.contains(searchQuery);
                })
                .map(this::categoryToDto)
                .toList();

        result.put("products", matchedProducts);
        result.put("categories", matchedCategories);
        result.put("totalResults", matchedProducts.size() + matchedCategories.size());

        return result;
    }

    private ProductDto productToDto(Product product) {
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        Long subCategoryId = product.getSubCategory() != null ? product.getSubCategory().getId() : null;

        List<String> imageUrls = new ArrayList<>();
        if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            imageUrls = Arrays.asList(product.getImageUrl().split(","));
        }

        List<String> ingredients = new ArrayList<>();
        if (product.getIngredientsCsv() != null && !product.getIngredientsCsv().isBlank()) {
            ingredients = Arrays.asList(product.getIngredientsCsv().split(","));
        }

        List<String> benefits = new ArrayList<>();
        if (product.getBenefitsCsv() != null && !product.getBenefitsCsv().isBlank()) {
            benefits = Arrays.asList(product.getBenefitsCsv().split(","));
        }

        return new ProductDto(
                product.getId(),
                categoryId,
                subCategoryId,
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getRating(),
                product.getReviewCount(),
                product.getSize(),
                product.getSaleOffer(),
                product.getTagsCsv(),
                product.isInStock(),
                product.isFeatured(),
                product.isBestseller(),
                product.isNewLaunch(),
                ingredients,
                benefits,
                product.getHowToUse(),
                imageUrls);
    }

    private CategoryDto categoryToDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getImageUrl());
    }
}
