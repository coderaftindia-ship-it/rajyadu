package com.oli.oli.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.oli.oli.dto.CertificateDto;
import com.oli.oli.model.Certificate;
import com.oli.oli.repository.CertificateRepository;
import com.oli.oli.service.FileStorageService;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateRepository certificateRepository;
    private final FileStorageService fileStorageService;

    public CertificateController(CertificateRepository certificateRepository, FileStorageService fileStorageService) {
        this.certificateRepository = certificateRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public List<CertificateDto> list() {
        return certificateRepository.findAll().stream().map(CertificateController::toDto).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CertificateDto upsert(
            @RequestParam("type") String type,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("file") MultipartFile file
    ) {
        String normalizedType = type == null ? "" : type.trim().toUpperCase();
        if (!"LAB_TEST".equals(normalizedType) && !"FSSAI".equals(normalizedType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported certificate type");
        }

        Certificate cert = certificateRepository.findByType(normalizedType).orElseGet(Certificate::new);

        if (cert.getId() != null && cert.getFileUrl() != null) {
            fileStorageService.deleteIfExistsByUrl(cert.getFileUrl());
        }

        cert.setType(normalizedType);
        cert.setTitle(title);
        cert.setFileUrl(fileStorageService.storeDocument(file, "certificates"));

        Certificate saved = certificateRepository.save(cert);
        return toDto(saved);
    }

    private static CertificateDto toDto(Certificate c) {
        return new CertificateDto(
                c.getId(),
                c.getType(),
                c.getTitle(),
                c.getFileUrl(),
                c.getLastUpdated() != null ? c.getLastUpdated().toString() : null
        );
    }
}
