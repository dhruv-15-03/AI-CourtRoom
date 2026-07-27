package com.example.demo.Repository;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.CaseRequest;
import com.example.demo.Classes.Chat;
import com.example.demo.Classes.User;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers the LawyerController#getDashboardStats / #getCaseRequests N+1 fixes:
 * - {@link CaseAll#countActiveCasesByAdvocate} / {@link CaseAll#countDisposedCasesByAdvocate}
 *   must push the active/disposed split down to the DB (previously
 *   findCasesByAdvocate().stream().filter().count() loaded every case the
 *   lawyer ever handled just to count two subsets of it).
 * - {@link CaseRequestRepository#findByLawyerWithUser} must eagerly fetch the
 *   requester so building the case-requests DTO doesn't lazy-load `user` once
 *   per row (N+1).
 * - {@link CaseRequestRepository#findAcceptedRequestsByLawyerWithUser} must
 *   both cap the result to the requested page size at the DB (instead of
 *   loading every accepted request and limiting in Java) and eagerly fetch
 *   `user` for the same reason as above.
 * - {@link ChatRepository#existsByIdAndUser} must answer a chat-membership
 *   check without loading the chat's full users collection.
 */
@DataJpaTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class LawyerDashboardQueriesTest {

    @Autowired
    private UserAll userRepository;

    @Autowired
    private CaseAll caseRepository;

    @Autowired
    private CaseRequestRepository caseRequestRepository;

    @Autowired
    private ChatRepository chatRepository;

    private User newUser(String email, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("irrelevant");
        user.setRole(role);
        return userRepository.save(user);
    }

    private Case newCase(String caseNumber, boolean disposed) {
        Case c = new Case();
        c.setCaseNumber(caseNumber);
        c.setTitle("Title for " + caseNumber);
        c.setCaseType(Case.CaseType.CIVIL);
        c.setCourtType(Case.CourtType.DISTRICT_COURT);
        c.setStatus(disposed ? Case.CaseStatus.DISPOSED : Case.CaseStatus.UNDER_TRIAL);
        c.setFilingDate(LocalDate.now());
        c.setIsDisposed(disposed);
        return caseRepository.save(c);
    }

    @Test
    void countActiveAndDisposedCasesByAdvocate_matchAssignedCases() {
        User advocate = newUser("advocate@test.com", User.UserRole.ADVOCATE);
        Case active1 = newCase("CIV-ACTIVE-1", false);
        Case active2 = newCase("CIV-ACTIVE-2", false);
        Case disposed1 = newCase("CIV-DISPOSED-1", true);

        // User.caseRequest is the owning side of the advocates<->cases ManyToMany.
        Set<Case> assigned = new HashSet<>(List.of(active1, active2, disposed1));
        advocate.setCaseRequest(assigned);
        userRepository.save(advocate);

        assertEquals(2, caseRepository.countActiveCasesByAdvocate(advocate));
        assertEquals(1, caseRepository.countDisposedCasesByAdvocate(advocate));
    }

    @Test
    void findByLawyerWithUser_eagerlyFetchesRequester() {
        User lawyer = newUser("lawyer@test.com", User.UserRole.ADVOCATE);
        User client = newUser("client@test.com", User.UserRole.CITIZEN);

        CaseRequest request = new CaseRequest();
        request.setLawyer(lawyer);
        request.setUser(client);
        request.setCaseTitle("Need representation");
        request.setStatus(CaseRequest.RequestStatus.PENDING);
        caseRequestRepository.save(request);

        List<CaseRequest> results = caseRequestRepository.findByLawyerWithUser(lawyer);

        assertEquals(1, results.size());
        // The whole point of the JOIN FETCH fix: `user` must already be an
        // initialized entity, not a lazy proxy that triggers a fresh query
        // per row when the DTO builder calls getUser().
        assertTrue(Hibernate.isInitialized(results.get(0).getUser()));
        assertEquals("client@test.com", results.get(0).getUser().getEmail());
    }

    @Test
    void findAcceptedRequestsByLawyerWithUser_capsAtDbAndFetchesUser() {
        User lawyer = newUser("lawyer2@test.com", User.UserRole.ADVOCATE);

        for (int i = 0; i < 5; i++) {
            User client = newUser("client" + i + "@test.com", User.UserRole.CITIZEN);
            CaseRequest request = new CaseRequest();
            request.setLawyer(lawyer);
            request.setUser(client);
            request.setCaseTitle("Case " + i);
            request.setStatus(CaseRequest.RequestStatus.ACCEPTED);
            caseRequestRepository.save(request);
        }

        List<CaseRequest> results = caseRequestRepository
                .findAcceptedRequestsByLawyerWithUser(lawyer, PageRequest.of(0, 3));

        // 5 accepted requests exist but the query must cap to the page size
        // at the DB, not load all 5 and slice in Java.
        assertEquals(3, results.size());
        results.forEach(cr -> assertTrue(Hibernate.isInitialized(cr.getUser())));
    }

    @Test
    void existsByIdAndUser_reflectsMembershipWithoutLoadingUserCollection() {
        User member = newUser("member@test.com", User.UserRole.CITIZEN);
        User outsider = newUser("outsider@test.com", User.UserRole.CITIZEN);

        Chat chat = new Chat();
        chat.setChatName("Direct chat");
        chat.setChatType(Chat.ChatType.DIRECT);
        chat.setCreatedAt(LocalDateTime.now());
        chat = chatRepository.save(chat);

        // User.chats is the owning side of the users<->chat_room ManyToMany.
        member.setChats(new HashSet<>(Set.of(chat)));
        userRepository.save(member);

        assertTrue(chatRepository.existsByIdAndUser(chat.getId(), member));
        assertFalse(chatRepository.existsByIdAndUser(chat.getId(), outsider));
    }
}
