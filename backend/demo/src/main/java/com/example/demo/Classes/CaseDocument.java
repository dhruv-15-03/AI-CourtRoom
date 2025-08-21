package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_documents")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CaseDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case courtCase;
    
    @Column(nullable = false)
    private String documentName;
    
    @Column(nullable = false)
    private String documentType; // PETITION, AFFIDAVIT, EVIDENCE, ORDER, JUDGMENT, etc.
    
    private String filePath;
    private String uploadedBy; // User who uploaded
    
    @Column(nullable = false)
    private LocalDateTime uploadDate;
    
    private String description;
    private Boolean isConfidential;
    private String accessLevel; // PUBLIC, RESTRICTED, CONFIDENTIAL
    
    @PrePersist
    protected void onCreate() {
        uploadDate = LocalDateTime.now();
        isConfidential = false;
        accessLevel = "PUBLIC";
    }
}
