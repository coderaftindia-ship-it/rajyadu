package com.oli.oli.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.oli.oli.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlug(String slug);

    @Query("SELECT p FROM Product p " +
            "LEFT JOIN p.category c " +
            "LEFT JOIN p.subCategory sc " +
            "WHERE (:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')) OR " +
            "(p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))) AND " +
            "(:categoryId IS NULL OR c.id = :categoryId) AND " +
            "(:subCategoryId IS NULL OR sc.id = :subCategoryId) AND " +
            "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
            "(:inStock IS NULL OR p.inStock = :inStock) AND " +
            "(:featured IS NULL OR p.featured = :featured)")
    List<Product> findByFilters(@Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("subCategoryId") Long subCategoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            @Param("featured") Boolean featured);

    @Query("SELECT DISTINCT p.tagsCsv FROM Product p WHERE p.tagsCsv IS NOT NULL AND p.tagsCsv != ''")
    List<String> findAllTags();

    @Query("SELECT DISTINCT p.size FROM Product p WHERE p.size IS NOT NULL AND p.size != '' ORDER BY p.size")
    List<String> findDistinctSizes();
}
