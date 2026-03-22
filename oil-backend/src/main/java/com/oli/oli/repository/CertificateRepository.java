package com.oli.oli.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.oli.oli.model.Certificate;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByType(String type);
}
