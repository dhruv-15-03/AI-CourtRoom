package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_request")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CaseRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // The client requesting a lawyer
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lawyer_id")
    private User lawyer; // The lawyer being requested
    
    @Column(nullable = false)
    private String caseTitle;
    
    @Lob
    private String caseDescription;
    
    @Enumerated(EnumType.STRING)
    private CaseType caseType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;
    
    private String urgency; // HIGH, MEDIUM, LOW
    
    private Double budget;
    
    private String contactPreference; // EMAIL, PHONE, CHAT
    
    @Column(updatable = false)
    private LocalDateTime requestedAt;
    
    private LocalDateTime respondedAt;
    
    private String lawyerResponse; // Accept/Reject message
    
    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }
    
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
    
    public enum RequestStatus {
        PENDING("Pending"),
        ACCEPTED("Accepted"),
        REJECTED("Rejected"),
        CANCELLED("Cancelled");
        
        private final String displayName;
        
        RequestStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
