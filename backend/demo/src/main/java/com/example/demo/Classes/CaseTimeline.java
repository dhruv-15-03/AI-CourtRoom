package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_timeline")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CaseTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case courtCase;
    
    @Column(nullable = false)
    private LocalDateTime eventDateTime;
    
    @Column(nullable = false)
    private String eventType; // FILED, NOTICE_ISSUED, HEARING_HELD, ORDER_PASSED, etc.
    
    @Column(nullable = false)
    private String eventDescription;
    
    @Lob
    private String eventDetails;
    
    private String performedBy; // Judge, Advocate, Registry, etc.
    private String documentReference; // Reference to any document created
    
    @Enumerated(EnumType.STRING)
    private EventImportance importance;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum EventImportance {
        LOW("Low"),
        MEDIUM("Medium"), 
        HIGH("High"),
        CRITICAL("Critical");
        
        private final String displayName;
        
        EventImportance(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
