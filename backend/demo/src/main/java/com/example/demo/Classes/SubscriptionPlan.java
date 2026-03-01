package com.example.demo.Classes;

import java.util.Arrays;
import java.util.List;

/**
 * Subscription plan types with pricing and features
 */
public enum SubscriptionPlan {
    
    // Free plan - Limited trials
    FREE(0.0, 0, 3, "Free Trial", 
        "Get started with 3 free AI consultations",
        false, // isSingleCase
        Arrays.asList(
            "3 free AI consultations",
            "Basic case analysis",
            "Limited context in predictions",
            "Email support"
        )),
    
    // Basic/Single Case - Pay per case ₹499
    BASIC(499.0, 0, 1, "Single Case", 
        "Pay per case - Perfect for one-time legal queries",
        true, // isSingleCase
        Arrays.asList(
            "1 detailed case analysis",
            "Full context prediction",
            "Case outcome probability",
            "Key factors breakdown",
            "Similar case references",
            "Valid for 30 days"
        )),
    
    // Pro plan - ₹1999/month
    PRO(1999.0, 30, 50, "Pro Plan", 
        "For regular legal professionals - 50 cases/month",
        false,
        Arrays.asList(
            "50 AI case analyses per month",
            "Full context predictions",
            "Priority email support",
            "Document review assistance",
            "Case analytics dashboard",
            "Download analysis reports",
            "Similar case database access"
        )),
    
    // Unlimited plan - ₹4999/month
    UNLIMITED(4999.0, 30, -1, "Unlimited Plan", 
        "Enterprise grade - Unlimited access to all features",
        false,
        Arrays.asList(
            "Unlimited AI case analyses",
            "Full context with max detail",
            "24/7 premium support",
            "Document review & summarization",
            "Advanced case analytics",
            "API access for integrations",
            "Custom report generation",
            "Bulk case analysis",
            "Priority processing",
            "Dedicated account manager"
        )),
    
    // Yearly plans (20% discount)
    PRO_YEARLY(19190.0, 365, 600, "Pro Yearly", 
        "Pro plan billed yearly - Save 20%",
        false,
        Arrays.asList(
            "600 AI case analyses per year",
            "All Pro features included",
            "20% savings vs monthly",
            "Priority support",
            "Analytics dashboard"
        )),
    
    UNLIMITED_YEARLY(47990.0, 365, -1, "Unlimited Yearly", 
        "Unlimited plan billed yearly - Save 20%",
        false,
        Arrays.asList(
            "Unlimited analyses all year",
            "All Unlimited features",
            "20% savings vs monthly",
            "Premium priority support",
            "API access included"
        ));
    
    private final Double price;
    private final Integer durationDays; // 0 for single case (valid 30 days from purchase)
    private final Integer queriesAllowed; // -1 for unlimited
    private final String displayName;
    private final String description;
    private final boolean singleCase;
    private final List<String> features;
    
    SubscriptionPlan(Double price, Integer durationDays, Integer queriesAllowed, 
                     String displayName, String description, boolean singleCase,
                     List<String> features) {
        this.price = price;
        this.durationDays = durationDays;
        this.queriesAllowed = queriesAllowed;
        this.displayName = displayName;
        this.description = description;
        this.singleCase = singleCase;
        this.features = features;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public Integer getDurationDays() {
        // Single case plans are valid for 30 days
        return durationDays == 0 ? 30 : durationDays;
    }
    
    public Integer getQueriesAllowed() {
        return queriesAllowed;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public boolean isUnlimited() {
        return queriesAllowed == -1;
    }
    
    public boolean isYearly() {
        return this.name().endsWith("_YEARLY");
    }
    
    public boolean isSingleCase() {
        return singleCase;
    }
    
    public List<String> getFeatures() {
        return features;
    }
    
    public String getPriceDisplay() {
        if (price == 0) return "Free";
        if (singleCase) return "₹" + price.intValue() + "/case";
        if (isYearly()) return "₹" + price.intValue() + "/year";
        return "₹" + price.intValue() + "/month";
    }
}
