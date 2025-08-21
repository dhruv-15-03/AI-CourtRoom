package com.example.demo.Repository;

import com.example.demo.Classes.CaseDocument;
import com.example.demo.Classes.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaseDocumentRepository extends JpaRepository<CaseDocument, Integer> {
    
    @Query("SELECT d FROM CaseDocument d WHERE d.courtCase = :case ORDER BY d.uploadDate DESC")
    List<CaseDocument> findByCourtCaseOrderByDateDesc(@Param("case") Case courtCase);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.documentType = :type")
    List<CaseDocument> findByDocumentType(@Param("type") String type);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.uploadedBy = :uploadedBy")
    List<CaseDocument> findByUploadedBy(@Param("uploadedBy") String uploadedBy);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.isConfidential = :confidential")
    List<CaseDocument> findByConfidentiality(@Param("confidential") Boolean confidential);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.accessLevel = :accessLevel")
    List<CaseDocument> findByAccessLevel(@Param("accessLevel") String accessLevel);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.uploadDate BETWEEN :start AND :end ORDER BY d.uploadDate DESC")
    List<CaseDocument> findByUploadDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT d FROM CaseDocument d WHERE d.documentName LIKE :name")
    List<CaseDocument> findByDocumentNameContaining(@Param("name") String name);
    
    @Query("SELECT COUNT(d) FROM CaseDocument d WHERE d.courtCase = :case")
    long countByCourtCase(@Param("case") Case courtCase);
    
    @Query("SELECT COUNT(d) FROM CaseDocument d WHERE d.documentType = :type")
    long countByDocumentType(@Param("type") String type);
}
