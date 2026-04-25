package com.example.demo.Repository;

import com.example.demo.Classes.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :type AND a.entityId = :id ORDER BY a.timestamp DESC")
    List<AuditLog> findByEntity(@Param("type") String type, @Param("id") Integer id);

    @Query("SELECT a FROM AuditLog a WHERE a.actor = :actor ORDER BY a.timestamp DESC")
    List<AuditLog> findByActor(@Param("actor") String actor);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :from AND :to ORDER BY a.timestamp DESC")
    List<AuditLog> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a FROM AuditLog a WHERE a.action = :action ORDER BY a.timestamp DESC")
    List<AuditLog> findByAction(@Param("action") String action);
}
