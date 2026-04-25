package com.example.demo.Classes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Phase 4 — Immutable audit trail for all critical court operations.
 * Every mutation (case create/update, hearing schedule, judgment, etc.)
 * gets an entry here for compliance and transparency.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_entity", columnList = "entityType, entityId"),
        @Index(name = "idx_audit_user", columnList = "userId"),
        @Index(name = "idx_audit_ts", columnList = "timestamp"),
})
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    /** Who performed the action (user email or "system"). */
    @Column(nullable = false)
    private String actor;

    /** Numeric user id (nullable — system actions have none). */
    private Integer userId;

    /** Role at the time of action: judge / lawyer / user / system. */
    private String role;

    /** High-level action verb: CREATE, UPDATE, CLOSE, SCHEDULE_HEARING, etc. */
    @Column(nullable = false, length = 64)
    private String action;

    /** Entity type: CASE, HEARING, USER, DOCUMENT. */
    @Column(nullable = false, length = 32)
    private String entityType;

    /** Primary key of the affected entity. */
    private Integer entityId;

    /** JSON summary of what changed. */
    @Lob
    private String details;

    /** Client IP address. */
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
