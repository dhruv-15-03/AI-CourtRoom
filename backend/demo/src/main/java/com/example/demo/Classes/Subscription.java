package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Subscription entity for managing user subscription plans
 */
@Entity
@Table(name = "subscription")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Subscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionPlan plan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;
    
    // Pricing details
    private Double amount;
    private String currency = "INR";
    
    // Payment details
    private String paymentId; // Razorpay/Stripe payment ID
    private String orderId; // Razorpay order ID
    private String paymentMethod; // UPI, Card, NetBanking, etc.
    private String paymentSignature; // For verification
    
    // Subscription period
    @Column(nullable = false)
    private LocalDateTime startDate;
    
    @Column(nullable = false)
    private LocalDateTime endDate;
    
    // AI Usage limits based on plan
    private Integer aiQueriesAllowed;
    private Integer aiQueriesUsed = 0;
    
    // Auto-renewal
    private Boolean autoRenew = false;
    
    // Timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (aiQueriesUsed == null) aiQueriesUsed = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Check if subscription is currently active
     */
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && 
               LocalDateTime.now().isBefore(endDate);
    }
    
    /**
     * Check if user can make more AI queries
     */
    public boolean canMakeQuery() {
        if (!isActive()) return false;
        if (plan == SubscriptionPlan.UNLIMITED || plan == SubscriptionPlan.UNLIMITED_YEARLY) return true;
        return aiQueriesUsed < aiQueriesAllowed;
    }
    
    /**
     * Increment AI queries used count
     */
    public void incrementQueryCount() {
        if (aiQueriesUsed == null) aiQueriesUsed = 0;
        aiQueriesUsed++;
    }
    
    /**
     * Get remaining AI queries
     */
    public Integer getRemainingQueries() {
        if (plan == SubscriptionPlan.UNLIMITED || plan == SubscriptionPlan.UNLIMITED_YEARLY) return -1; // Unlimited
        if (aiQueriesAllowed == null) return 0;
        return Math.max(0, aiQueriesAllowed - (aiQueriesUsed != null ? aiQueriesUsed : 0));
    }
}
