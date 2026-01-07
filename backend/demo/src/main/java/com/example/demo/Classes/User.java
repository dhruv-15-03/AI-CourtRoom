package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "app_user")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Version
    private Long version;
    
    // Basic Information
    private Long mobile;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    
    // Professional Identity
    @Column(nullable = false)
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = UserRoleDeserializer.class)
    @jakarta.persistence.Convert(converter = UserRoleConverter.class)
    private UserRole role;
    
    // Legal Professional Details
    private Boolean isLawyer;
    private Boolean isJudge;
    
    // Lawyer-specific fields
    private String barCouncilId; // e.g., "D/1234/2020" for Delhi Bar Council
    private String enrollmentNumber;
    private LocalDate enrollmentDate;
    private String barCouncilState; // State Bar Council
    
    // Judge-specific fields
    private String judgeRank; // District Judge, Additional Judge, Chief Justice, etc.
    private String appointmentOrder;
    private LocalDate appointmentDate;
    private String jurisdiction; // Area of jurisdiction
    
    // Court Assignment
    private String court; // Court name where assigned
    private String courtType; // District Court, High Court, etc.
    private String courtLocation; // Mumbai, Delhi, etc.
    private String bench; // Single Judge, Division Bench, etc.
    
    // Professional Details
    private String description;
    private String specialisation; // Criminal Law, Civil Law, Constitutional Law, etc.
    private Integer experience; // Years of experience
    private Integer fees; // For lawyers
    private String image; // Profile image
    
    // Qualifications
    @ElementCollection
    @CollectionTable(name = "user_qualifications")
    private Set<String> qualifications; // LLB, LLM, PhD in Law, etc.
    
    @ElementCollection
    @CollectionTable(name = "user_practice_areas")
    private Set<String> practiceAreas; // Multiple areas of practice
    
    // Professional Statistics
    private Integer casesHandled;
    private Integer casesWon;
    private Double successRate;
    private Double averageRating;
    
    // Contact and Address
    private String officeAddress;
    private String chamberNumber;
    private String alternateContact;
    private String emergencyContact;
    
    // Case Relations (Updated field names for consistency)
    @ManyToMany
    @JoinTable(
        name = "user_active_cases",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> active;
    
    @ManyToMany
    @JoinTable(
        name = "user_past_cases",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> pastCases;
    
    @ManyToMany
    @JoinTable(
        name = "user_case_requests",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> caseRequest;
    
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "user_chats",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "chat_id")
    )
    @JsonIgnore
    private Set<Chat> chats;
    
    @OneToMany(mappedBy = "presidingJudge")
    @JsonIgnore
    private Set<Case> presidingCases;
    
    @ManyToMany(mappedBy = "benchJudges")
    @JsonIgnore
    private Set<Case> benchCases;
    
    // Account Management
    private Boolean isActive;
    private Boolean isVerified;
    private LocalDateTime lastLogin;
    private Integer freeTrialAttempts;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        isActive = true;
        isVerified = false;
        casesHandled = 0;
        casesWon = 0;
        successRate = 0.0;
        averageRating = 0.0;
        freeTrialAttempts = 3;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructor for backward compatibility
    public User(Long mobile, String firstName, String lastName, String email, String role, String password, 
                String description, String specialisation, Integer fees, String image, String bench, 
                Integer years, String court) {
        this.mobile = mobile;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.description = description;
        this.specialisation = specialisation;
        this.fees = fees;
        this.image = image;
        this.bench = bench;
        this.experience = years;
        this.court = court;
        
        // Set role enum and flags
        if (role.equalsIgnoreCase("Lawyer")) {
            this.role = UserRole.ADVOCATE;
            this.isLawyer = true;
            this.isJudge = false;
        } else if (role.equalsIgnoreCase("Judge")) {
            this.role = UserRole.JUDGE;
            this.isJudge = true;
            this.isLawyer = false;
        } else {
            this.role = UserRole.CITIZEN;
            this.isLawyer = false;
            this.isJudge = false;
        }
    }
    
    // Utility methods
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    public String getDisplayTitle() {
        if (role == UserRole.JUDGE) {
            return "Hon'ble " + (judgeRank != null ? judgeRank + " " : "") + getFullName();
        } else if (role == UserRole.ADVOCATE) {
            return "Adv. " + getFullName();
        }
        return getFullName();
    }
    
    // Enum for User Roles in Indian Legal System
    public enum UserRole {
        CITIZEN("Citizen"),
        ADVOCATE("Advocate"),
        SENIOR_ADVOCATE("Senior Advocate"),
        ADDITIONAL_SOLICITOR_GENERAL("Additional Solicitor General"),
        SOLICITOR_GENERAL("Solicitor General"),
        ATTORNEY_GENERAL("Attorney General"),
        PUBLIC_PROSECUTOR("Public Prosecutor"),
        DISTRICT_JUDGE("District Judge"),
        ADDITIONAL_DISTRICT_JUDGE("Additional District Judge"),
        SESSIONS_JUDGE("Sessions Judge"),
        MAGISTRATE("Magistrate"),
        HIGH_COURT_JUDGE("High Court Judge"),
        CHIEF_JUSTICE_HIGH_COURT("Chief Justice High Court"),
        SUPREME_COURT_JUDGE("Supreme Court Judge"),
        CHIEF_JUSTICE_INDIA("Chief Justice of India"),
        JUDGE("Judge"),
        COURT_CLERK("Court Clerk"),
        REGISTRAR("Registrar"),
        COURT_MASTER("Court Master"),
        ADMIN("Administrator");
        
        private final String displayName;
        
        UserRole(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
