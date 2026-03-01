package com.example.demo.Implementation;

import com.example.demo.Classes.*;
import com.example.demo.Repository.SubscriptionRepository;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing subscriptions
 */
@Service
public class SubscriptionService {
    
    @Autowired
    private SubscriptionRepository subscriptionRepository;
    
    @Autowired
    private UserAll userRepository;
    
    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;
    
    /**
     * Get all available subscription plans
     */
    public List<Map<String, Object>> getAvailablePlans() {
        List<Map<String, Object>> plans = new ArrayList<>();
        
        for (SubscriptionPlan plan : SubscriptionPlan.values()) {
            Map<String, Object> planInfo = new HashMap<>();
            planInfo.put("id", plan.name());
            planInfo.put("name", plan.getDisplayName());
            planInfo.put("price", plan.getPrice());
            planInfo.put("priceDisplay", plan.getPriceDisplay());
            planInfo.put("durationDays", plan.getDurationDays());
            planInfo.put("queriesAllowed", plan.getQueriesAllowed());
            planInfo.put("description", plan.getDescription());
            planInfo.put("isUnlimited", plan.isUnlimited());
            planInfo.put("isYearly", plan.isYearly());
            planInfo.put("isSingleCase", plan.isSingleCase());
            planInfo.put("features", plan.getFeatures());
            planInfo.put("currency", "INR");
            plans.add(planInfo);
        }
        
        return plans;
    }
    
    /**
     * Get user's current active subscription
     */
    public Optional<Subscription> getActiveSubscription(User user) {
        return subscriptionRepository.findActiveSubscription(user, LocalDateTime.now());
    }
    
    /**
     * Get user's current active subscription by user ID
     */
    public Optional<Subscription> getActiveSubscriptionByUserId(Integer userId) {
        return subscriptionRepository.findActiveSubscriptionByUserId(userId, LocalDateTime.now());
    }
    
    /**
     * Get user's subscription history
     */
    public List<Subscription> getSubscriptionHistory(User user) {
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    /**
     * Check if user has active subscription or free trials
     */
    public Map<String, Object> checkAccess(User user) {
        Map<String, Object> access = new HashMap<>();
        
        // Check for active subscription
        Optional<Subscription> activeSubscription = getActiveSubscription(user);
        
        if (activeSubscription.isPresent()) {
            Subscription sub = activeSubscription.get();
            access.put("hasAccess", true);
            access.put("accessType", "SUBSCRIPTION");
            access.put("plan", sub.getPlan().getDisplayName());
            access.put("expiresAt", sub.getEndDate());
            access.put("queriesRemaining", sub.getRemainingQueries());
            access.put("isUnlimited", sub.getPlan().isUnlimited());
            return access;
        }
        
        // Check for free trials
        Integer freeTrials = user.getFreeTrialAttempts();
        if (freeTrials == null) {
            freeTrials = 3;
            user.setFreeTrialAttempts(freeTrials);
            userRepository.save(user);
        }
        
        if (freeTrials > 0) {
            access.put("hasAccess", true);
            access.put("accessType", "FREE_TRIAL");
            access.put("freeTrialsRemaining", freeTrials);
            return access;
        }
        
        // No access
        access.put("hasAccess", false);
        access.put("accessType", "NONE");
        access.put("message", "Please subscribe to continue using AI features");
        return access;
    }
    
    /**
     * Create a pending subscription (before payment)
     */
    @Transactional
    public Subscription createPendingSubscription(User user, SubscriptionPlan plan, String orderId) {
        Subscription subscription = new Subscription();
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.PENDING);
        subscription.setAmount(plan.getPrice());
        subscription.setCurrency("INR");
        subscription.setOrderId(orderId);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(plan.getDurationDays()));
        subscription.setAiQueriesAllowed(plan.getQueriesAllowed());
        subscription.setAiQueriesUsed(0);
        subscription.setAutoRenew(false);
        
        return subscriptionRepository.save(subscription);
    }
    
    /**
     * Activate subscription after successful payment
     */
    @Transactional
    public Subscription activateSubscription(String orderId, String paymentId, String signature, String paymentMethod) {
        Optional<Subscription> subOpt = subscriptionRepository.findByOrderId(orderId);
        
        if (subOpt.isEmpty()) {
            throw new RuntimeException("Subscription not found for order: " + orderId);
        }
        
        Subscription subscription = subOpt.get();
        
        // Update payment details
        subscription.setPaymentId(paymentId);
        subscription.setPaymentSignature(signature);
        subscription.setPaymentMethod(paymentMethod);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        
        // Reset dates from activation time
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(subscription.getPlan().getDurationDays()));
        
        return subscriptionRepository.save(subscription);
    }
    
    /**
     * Cancel subscription
     */
    @Transactional
    public Subscription cancelSubscription(Long subscriptionId, User user) {
        Optional<Subscription> subOpt = subscriptionRepository.findById(subscriptionId);
        
        if (subOpt.isEmpty()) {
            throw new RuntimeException("Subscription not found");
        }
        
        Subscription subscription = subOpt.get();
        
        // Verify ownership
        if (!subscription.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setAutoRenew(false);
        
        return subscriptionRepository.save(subscription);
    }
    
    /**
     * Use an AI query (increment usage counter)
     */
    @Transactional
    public Map<String, Object> useAIQuery(User user) {
        Map<String, Object> result = new HashMap<>();
        
        // Check for active subscription first
        Optional<Subscription> activeSubscription = getActiveSubscription(user);
        
        if (activeSubscription.isPresent()) {
            Subscription sub = activeSubscription.get();
            
            if (!sub.canMakeQuery()) {
                result.put("success", false);
                result.put("error", "Query limit reached for your plan");
                result.put("queriesRemaining", 0);
                return result;
            }
            
            sub.incrementQueryCount();
            subscriptionRepository.save(sub);
            
            result.put("success", true);
            result.put("accessType", "SUBSCRIPTION");
            result.put("queriesRemaining", sub.getRemainingQueries());
            return result;
        }
        
        // Use free trial
        Integer freeTrials = user.getFreeTrialAttempts();
        if (freeTrials == null) freeTrials = 3;
        
        if (freeTrials > 0) {
            user.setFreeTrialAttempts(freeTrials - 1);
            userRepository.save(user);
            
            result.put("success", true);
            result.put("accessType", "FREE_TRIAL");
            result.put("freeTrialsRemaining", freeTrials - 1);
            return result;
        }
        
        result.put("success", false);
        result.put("error", "No subscription or free trials available");
        return result;
    }
    
    /**
     * Update expired subscriptions (called by scheduled task)
     */
    @Transactional
    public int updateExpiredSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        
        for (Subscription sub : expired) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
        }
        
        subscriptionRepository.saveAll(expired);
        return expired.size();
    }
    
    /**
     * Get subscription statistics (admin only)
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeSubscriptions", subscriptionRepository.countActiveSubscriptions(LocalDateTime.now()));
        stats.put("totalRevenue", subscriptionRepository.getTotalRevenue());
        return stats;
    }
}
