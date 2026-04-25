package com.example.demo.Method;

import com.example.demo.Classes.AuditLog;
import com.example.demo.Repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Thin helper to write audit entries from any controller / service.
 */
@Service
public class AuditService {

    @Autowired
    private AuditLogRepository repo;

    public AuditLog log(String actor, Integer userId, String role,
                        String action, String entityType, Integer entityId,
                        String details, String ipAddress) {
        AuditLog entry = new AuditLog();
        entry.setActor(actor);
        entry.setUserId(userId);
        entry.setRole(role);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        entry.setIpAddress(ipAddress);
        return repo.save(entry);
    }
}
