package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "court_case")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Case {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    // Case Identification
    @Column(unique = true, nullable = false)
    private String caseNumber; // e.g., "CRL.A. 123/2025", "CS 456/2025"
    
    @Column(nullable = false)
    private String title; // e.g., "State of Maharashtra vs. Rajesh Kumar"
    
    @Lob
    private String description;
    
    // Case Classification  
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseType caseType; // CIVIL, CRIMINAL, CONSTITUTIONAL, etc.
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourtType courtType; // SUPREME_COURT, HIGH_COURT, DISTRICT_COURT, etc.
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus status; // FILED, ADMITTED, UNDER_TRIAL, JUDGMENT_RESERVED, etc.
    
    @Enumerated(EnumType.STRING)
    private Priority priority; // HIGH, MEDIUM, LOW
    
    // Legal Details
    @ElementCollection
    @CollectionTable(name = "case_acts_sections")
    private List<String> actsAndSections; // e.g., "IPC Section 302", "CrPC Section 154"
    
    private String plaintiffPetitioner;
    private String defendantRespondent;
    
    // Court Assignment
    private String courtRoom;
    private String courtLocation; // e.g., "Delhi High Court", "Mumbai Sessions Court"
    
    // Dates
    @Column(nullable = false)
    private LocalDate filingDate;
    private LocalDate admissionDate;
    private LocalDateTime nextHearing;
    private LocalDate judgmentDate;
    
    // Case Relations
    @ManyToMany(mappedBy = "active")
    private Set<User> petitioners; // Citizens/clients
    
    @ManyToMany(mappedBy = "caseRequest")
    private Set<User> advocates; // Lawyers representing
    
    @ManyToOne
    private User presidingJudge;
    
    @ManyToMany
    @JoinTable(name = "case_bench")
    private Set<User> benchJudges; // For multi-judge benches
    
    // Case Documents and Orders
    @ElementCollection
    @CollectionTable(name = "case_orders")
    private List<String> orders; // Court orders and interim orders
    
    @ElementCollection
    @CollectionTable(name = "case_judgments")
    private List<String> finalJudgments;
    
    @ElementCollection
    @CollectionTable(name = "case_documents")
    private List<String> documents; // Filed documents, evidence
    
    // Case Progress
    private Boolean isDisposed;
    private String disposalType; // JUDGMENT, SETTLEMENT, WITHDRAWAL, etc.
    private Boolean appealFiled;
    private String appealDetails;
    
    // Financial
    private Double courtFees;
    private Double compensationAmount;
    
    // Case History
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private String lastAction;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // Enums for Indian Legal System
    public enum CaseType {
        CIVIL("Civil"),
        CRIMINAL("Criminal"), 
        CONSTITUTIONAL("Constitutional"),
        REVENUE("Revenue"),
        LABOUR("Labour & Industrial"),
        FAMILY("Family"),
        CONSUMER("Consumer"),
        ELECTION("Election"),
        TAX("Tax"),
        ENVIRONMENTAL("Environmental"),
        INTELLECTUAL_PROPERTY("Intellectual Property"),
        CYBER_CRIME("Cyber Crime"),
        ECONOMIC_OFFENCE("Economic Offence"),
        BANKING("Banking"),
        REAL_ESTATE("Real Estate");
        
        private final String displayName;
        
        CaseType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum CourtType {
        SUPREME_COURT("Supreme Court of India"),
        HIGH_COURT("High Court"),
        DISTRICT_COURT("District Court"),
        SESSIONS_COURT("Sessions Court"),
        MAGISTRATE_COURT("Magistrate Court"),
        FAMILY_COURT("Family Court"),
        CONSUMER_COURT("Consumer Court"),
        LABOUR_COURT("Labour Court"),
        REVENUE_COURT("Revenue Court"),
        TRIBUNAL("Tribunal");
        
        private final String displayName;
        
        CourtType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum CaseStatus {
        FILED("Filed"),
        ADMITTED("Admitted"),
        NOTICE_ISSUED("Notice Issued"),
        APPEARANCE("Appearance"),
        UNDER_TRIAL("Under Trial"),
        EVIDENCE_STAGE("Evidence Stage"),
        ARGUMENT_STAGE("Argument Stage"),
        JUDGMENT_RESERVED("Judgment Reserved"),
        DISPOSED("Disposed"),
        APPEAL_PENDING("Appeal Pending"),
        STAYED("Stayed"),
        ADJOURNED("Adjourned"),
        TRANSFER_PENDING("Transfer Pending");
        
        private final String displayName;
        
        CaseStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum Priority {
        HIGH("High"),
        MEDIUM("Medium"),
        LOW("Low"),
        URGENT("Urgent");
        
        private final String displayName;
        
        Priority(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
