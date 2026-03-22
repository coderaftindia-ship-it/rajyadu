package com.oli.oli.dto;

import java.math.BigDecimal;

import java.util.List;

public record ProductDto(
        Long id,
        Long categoryId,
        Long subCategoryId,
        String name,
        String slug,
        String shortDescription,
        String description,
        BigDecimal price,
        BigDecimal originalPrice,
        Double rating,
        Integer reviewCount,
        String size,
        String saleOffer,
        String tags,
        Boolean inStock,
        Boolean featured,
        Boolean bestseller,
        Boolean newLaunch,
        List<String> ingredients,
        List<String> benefits,
        String howToUse,
        List<String> imageUrls) {
}
