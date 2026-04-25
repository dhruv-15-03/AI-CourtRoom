package com.example.demo.Controller;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.CaseHearing;
import com.example.demo.Classes.User;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Method.CaseService;
import com.example.demo.Repository.CaseHearingRepository;
import com.example.demo.Repository.UserAll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Phase 4 — Full hearing lifecycle management.
 * Provides CRUD, scheduling, adjournment, and real-time push for courtroom ops.
 */
@RestController
@RequestMapping("/api/hearings")
@CrossOrigin(origins = {"http://localhost:3000",
        "https://ai-court-room-iota.vercel.app",
        "https://ai-courtroom.vercel.app"})
public class HearingController {

    @Autowired
    private CaseHearingRepository hearingRepo;

    @Autowired
    private CaseService caseService;

    @Autowired
    private UserAll userRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // ── helpers ─────────────────────────────────────────────────────

    private Map<String, Object> toMap(CaseHearing h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", h.getId());
        m.put("caseId", h.getCourtCase() != null ? h.getCourtCase().getId() : null);
        m.put("caseNumber", h.getCourtCase() != null ? h.getCourtCase().getCaseNumber() : "");
        m.put("caseTitle", h.getCourtCase() != null ? h.getCourtCase().getTitle() : "");
        m.put("hearingDateTime", h.getHearingDateTime() != null ? h.getHearingDateTime().toString() : null);
        m.put("courtRoom", h.getCourtRoom());
        m.put("hearingType", h.getHearingType() != null ? h.getHearingType().name() : null);
        m.put("hearingTypeDisplay", h.getHearingType() != null ? h.getHearingType().getDisplayName() : "");
        m.put("status", h.getStatus() != null ? h.getStatus().name() : null);
        m.put("statusDisplay", h.getStatus() != null ? h.getStatus().getDisplayName() : "");
        m.put("purpose", h.getPurpose());
        m.put("proceedings", h.getProceedings());
        m.put("orderPassed", h.getOrderPassed());
        m.put("nextHearingDate", h.getNextHearingDate() != null ? h.getNextHearingDate().toString() : null);
        m.put("adjournmentReason", h.getAdjournmentReason());
        m.put("presidingJudge", h.getPresidingJudge() != null ? h.getPresidingJudge().getFirstName() + " " +
                (h.getPresidingJudge().getLastName() != null ? h.getPresidingJudge().getLastName() : "") : null);
        m.put("presidingJudgeId", h.getPresidingJudge() != null ? h.getPresidingJudge().getId() : null);
        m.put("presentAdvocates", h.getPresentAdvocates());
        m.put("absentParties", h.getAbsentParties());
        m.put("createdAt", h.getCreatedAt() != null ? h.getCreatedAt().toString() : null);
        return m;
    }

    private void pushNotification(String topic, Object payload) {
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend(topic, payload);
        }
    }

    // ── CRUD ─────────────────────────────────────────────────────────

    /**
     * Schedule a new hearing for a case. Judge-only.
     */
    @PostMapping
    public ResponseEntity<?> createHearing(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Only judges can schedule hearings"));
            }

            Integer caseId = (Integer) data.get("caseId");
            if (caseId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "caseId is required"));
            }
            Optional<Case> caseOpt = caseService.getCaseById(caseId);
            if (caseOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Case not found"));
            }

            CaseHearing h = new CaseHearing();
            h.setCourtCase(caseOpt.get());
            h.setHearingDateTime(LocalDateTime.parse((String) data.get("hearingDateTime")));
            h.setCourtRoom((String) data.getOrDefault("courtRoom", "Court Room 1"));
            if (data.get("hearingType") != null) {
                h.setHearingType(CaseHearing.HearingType.valueOf((String) data.get("hearingType")));
            }
            h.setStatus(CaseHearing.HearingStatus.SCHEDULED);
            h.setPurpose((String) data.get("purpose"));
            h.setPresidingJudge(judge);

            CaseHearing saved = hearingRepo.save(h);

            // Also update case.nextHearing
            Case c = caseOpt.get();
            c.setNextHearing(saved.getHearingDateTime());
            caseService.updateCase(c.getId(), c);

            // Push real-time notification
            pushNotification("/group/hearings",
                    Map.of("type", "HEARING_SCHEDULED",
                            "hearing", toMap(saved),
                            "message", "New hearing scheduled for " + c.getCaseNumber()));

            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a single hearing by id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getHearing(@PathVariable Integer id) {
        return hearingRepo.findById(id)
                .map(h -> ResponseEntity.ok(toMap(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List all hearings for a case.
     */
    @GetMapping("/case/{caseId}")
    public ResponseEntity<?> getHearingsForCase(@PathVariable Integer caseId) {
        Optional<Case> caseOpt = caseService.getCaseById(caseId);
        if (caseOpt.isEmpty()) return ResponseEntity.notFound().build();
        List<Map<String, Object>> list = hearingRepo.findByCourtCaseOrderByDateDesc(caseOpt.get())
                .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * Upcoming hearings (all or for a specific judge).
     */
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcoming(
            @RequestHeader(value = "Authorization", required = false) String jwt) {
        List<CaseHearing> list;
        if (jwt != null) {
            try {
                String email = JwtProvider.getEmailFromJwt(jwt);
                User judge = userRepository.searchByEmail(email);
                if (judge != null && Boolean.TRUE.equals(judge.getIsJudge())) {
                    list = hearingRepo.findByDateRange(LocalDateTime.now(),
                            LocalDateTime.now().plusDays(30)).stream()
                            .filter(h -> h.getPresidingJudge() != null
                                    && h.getPresidingJudge().getId().equals(judge.getId()))
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(list.stream().map(this::toMap).collect(Collectors.toList()));
                }
            } catch (Exception ignored) { }
        }
        list = hearingRepo.findUpcomingHearings(LocalDateTime.now());
        return ResponseEntity.ok(list.stream().map(this::toMap).collect(Collectors.toList()));
    }

    /**
     * Hearings for a specific date (calendar view).
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<?> getByDate(@PathVariable String date) {
        LocalDate d = LocalDate.parse(date);
        List<Map<String, Object>> list = hearingRepo.findByHearingDate(d)
                .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * Update hearing details (proceedings, order, status progress, etc.).
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHearing(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Only judges can update hearings"));
            }
            Optional<CaseHearing> opt = hearingRepo.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            CaseHearing h = opt.get();

            if (data.containsKey("status")) {
                h.setStatus(CaseHearing.HearingStatus.valueOf((String) data.get("status")));
            }
            if (data.containsKey("proceedings")) h.setProceedings((String) data.get("proceedings"));
            if (data.containsKey("orderPassed")) h.setOrderPassed((String) data.get("orderPassed"));
            if (data.containsKey("purpose")) h.setPurpose((String) data.get("purpose"));
            if (data.containsKey("courtRoom")) h.setCourtRoom((String) data.get("courtRoom"));
            if (data.containsKey("hearingType")) {
                h.setHearingType(CaseHearing.HearingType.valueOf((String) data.get("hearingType")));
            }
            if (data.containsKey("presentAdvocates")) h.setPresentAdvocates((String) data.get("presentAdvocates"));
            if (data.containsKey("absentParties")) h.setAbsentParties((String) data.get("absentParties"));

            CaseHearing saved = hearingRepo.save(h);
            pushNotification("/group/hearings",
                    Map.of("type", "HEARING_UPDATED", "hearing", toMap(saved)));
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Adjourn a hearing — sets status, reason, and optionally the new date.
     */
    @PostMapping("/{id}/adjourn")
    public ResponseEntity<?> adjournHearing(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            Optional<CaseHearing> opt = hearingRepo.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            CaseHearing h = opt.get();

            h.setStatus(CaseHearing.HearingStatus.ADJOURNED);
            h.setAdjournmentReason((String) data.get("reason"));
            if (data.get("nextHearingDate") != null) {
                LocalDateTime next = LocalDateTime.parse((String) data.get("nextHearingDate"));
                h.setNextHearingDate(next);
                // Auto-schedule the next hearing
                CaseHearing nh = new CaseHearing();
                nh.setCourtCase(h.getCourtCase());
                nh.setHearingDateTime(next);
                nh.setCourtRoom(h.getCourtRoom());
                nh.setHearingType(h.getHearingType());
                nh.setStatus(CaseHearing.HearingStatus.SCHEDULED);
                nh.setPresidingJudge(judge);
                nh.setPurpose("Adjourned from hearing #" + h.getId());
                hearingRepo.save(nh);
                // Update case.nextHearing
                h.getCourtCase().setNextHearing(next);
                caseService.updateCase(h.getCourtCase().getId(), h.getCourtCase());
            }
            hearingRepo.save(h);
            pushNotification("/group/hearings",
                    Map.of("type", "HEARING_ADJOURNED",
                            "hearing", toMap(h),
                            "reason", h.getAdjournmentReason()));
            return ResponseEntity.ok(toMap(h));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Complete a hearing — record proceedings + order + mark COMPLETED.
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeHearing(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> data) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User judge = userRepository.searchByEmail(email);
            if (judge == null || !Boolean.TRUE.equals(judge.getIsJudge())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            Optional<CaseHearing> opt = hearingRepo.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            CaseHearing h = opt.get();

            h.setStatus(CaseHearing.HearingStatus.COMPLETED);
            if (data.containsKey("proceedings")) h.setProceedings((String) data.get("proceedings"));
            if (data.containsKey("orderPassed")) h.setOrderPassed((String) data.get("orderPassed"));
            if (data.containsKey("presentAdvocates")) h.setPresentAdvocates((String) data.get("presentAdvocates"));
            if (data.containsKey("absentParties")) h.setAbsentParties((String) data.get("absentParties"));

            hearingRepo.save(h);
            pushNotification("/group/hearings",
                    Map.of("type", "HEARING_COMPLETED", "hearing", toMap(h)));
            return ResponseEntity.ok(toMap(h));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Calendar stats — hearing counts per date in a range.
     */
    @GetMapping("/calendar-stats")
    public ResponseEntity<?> calendarStats(
            @RequestParam String from, @RequestParam String to) {
        LocalDate start = LocalDate.parse(from);
        LocalDate end = LocalDate.parse(to);
        List<CaseHearing> range = hearingRepo.findByDateRange(
                start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        Map<String, Long> counts = range.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getHearingDateTime().toLocalDate().toString(),
                        Collectors.counting()));
        return ResponseEntity.ok(counts);
    }

    /**
     * Court room availability check.
     */
    @GetMapping("/room-availability")
    public ResponseEntity<?> roomAvailability(
            @RequestParam String courtRoom, @RequestParam String date) {
        LocalDate d = LocalDate.parse(date);
        List<Map<String, Object>> booked = hearingRepo.findByCourtRoomAndDate(courtRoom, d)
                .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
                "courtRoom", courtRoom,
                "date", date,
                "hearingsBooked", booked.size(),
                "hearings", booked));
    }
}
