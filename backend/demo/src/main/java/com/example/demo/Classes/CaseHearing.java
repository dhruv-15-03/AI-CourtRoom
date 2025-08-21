package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_hearings")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CaseHearing {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case courtCase;
    
    @Column(nullable = false)
    private LocalDateTime hearingDateTime;
    
    @Column(nullable = false)
    private String courtRoom;
    
    @Enumerated(EnumType.STRING)
    private HearingType hearingType;
    
    @Enumerated(EnumType.STRING)
    private HearingStatus status;
    
    @Lob
    private String purpose; // e.g., "Arguments on maintainability", "Evidence recording"
    
    @Lob
    private String proceedings; // What happened in the hearing
    
    @Lob
    private String orderPassed; // Any order passed during hearing
    
    private LocalDateTime nextHearingDate;
    private String adjournmentReason;
    
    @ManyToOne
    private User presidingJudge;
    
    private String presentAdvocates; // Comma-separated list of present advocates
    private String absentParties; // If any party was absent
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum HearingType {
        ADMISSION("Admission Hearing"),
        INTERIM("Interim Application"),
        EVIDENCE("Evidence Recording"),
        CROSS_EXAMINATION("Cross Examination"),
        ARGUMENTS("Final Arguments"),
        JUDGMENT("Judgment Pronouncement"),
        MISCELLANEOUS("Miscellaneous Application"),
        STATUS_REPORT("Status Report"),
        COMPLIANCE("Compliance Report");
        
        private final String displayName;
        
        HearingType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum HearingStatus {
        SCHEDULED("Scheduled"),
        COMPLETED("Completed"),
        ADJOURNED("Adjourned"),
        CANCELLED("Cancelled"),
        POSTPONED("Postponed"),
        IN_PROGRESS("In Progress");
        
        private final String displayName;
        
        HearingStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
