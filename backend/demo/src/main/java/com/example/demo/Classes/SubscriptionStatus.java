package com.example.demo.Classes;

/**
 * Subscription status types
 */
public enum SubscriptionStatus {
    
    PENDING("Payment pending"),
    ACTIVE("Subscription active"),
    EXPIRED("Subscription expired"),
    CANCELLED("Subscription cancelled"),
    PAYMENT_FAILED("Payment failed"),
    REFUNDED("Payment refunded");
    
    private final String description;
    
    SubscriptionStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
