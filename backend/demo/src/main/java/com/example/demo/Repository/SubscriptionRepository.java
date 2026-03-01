package com.example.demo.Repository;

import com.example.demo.Classes.Subscription;
import com.example.demo.Classes.SubscriptionStatus;
import com.example.demo.Classes.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    /**
     * Find all subscriptions for a user
     */
    List<Subscription> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Find subscriptions by user ID
     */
    List<Subscription> findByUserIdOrderByCreatedAtDesc(Integer userId);
    
    /**
     * Find active subscription for a user
     */
    @Query("SELECT s FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE' AND s.endDate > :now ORDER BY s.endDate DESC")
    Optional<Subscription> findActiveSubscription(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * Find active subscription by user ID
     */
    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' AND s.endDate > :now ORDER BY s.endDate DESC")
    Optional<Subscription> findActiveSubscriptionByUserId(@Param("userId") Integer userId, @Param("now") LocalDateTime now);
    
    /**
     * Find by payment ID (for Razorpay verification)
     */
    Optional<Subscription> findByPaymentId(String paymentId);
    
    /**
     * Find by order ID (for Razorpay verification)
     */
    Optional<Subscription> findByOrderId(String orderId);
    
    /**
     * Find subscriptions expiring soon (for reminder emails)
     */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate BETWEEN :now AND :expiryDate")
    List<Subscription> findExpiringSoon(@Param("now") LocalDateTime now, @Param("expiryDate") LocalDateTime expiryDate);
    
    /**
     * Find expired subscriptions that need status update
     */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate < :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);
    
    /**
     * Find subscriptions by status
     */
    List<Subscription> findByStatus(SubscriptionStatus status);
    
    /**
     * Count active subscriptions
     */
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate > :now")
    Long countActiveSubscriptions(@Param("now") LocalDateTime now);
    
    /**
     * Get total revenue
     */
    @Query("SELECT SUM(s.amount) FROM Subscription s WHERE s.status = 'ACTIVE'")
    Double getTotalRevenue();
}
