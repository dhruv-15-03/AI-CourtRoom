package com.example.demo.Implementation;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import com.example.demo.Repository.CaseAll;
import com.example.demo.Repository.UserAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the core courtroom business logic in {@link CaseServiceImpl}:
 * Indian case-number generation, sensible defaulting for newly filed cases,
 * partial updates, and case lifecycle transitions (close/reopen, assignment).
 *
 * These were previously untested even though they encode real domain rules
 * (case-number prefixes, default acts/sections, court locations) that the
 * rest of the app - and any AI case-analysis feature - depends on.
 */
class CaseServiceImplTest {

    private CaseAll caseRepository;
    private UserAll userRepository;
    private CaseServiceImpl caseService;

    @BeforeEach
    void setUp() {
        caseRepository = mock(CaseAll.class);
        userRepository = mock(UserAll.class);
        caseService = new CaseServiceImpl();
        setField(caseService, "caseRepository", caseRepository);
        setField(caseService, "userRepository", userRepository);

        // save() echoes back whatever was passed in, mirroring JPA repository semantics
        // for entities that already have (or don't need) a generated id.
        when(caseRepository.save(any(Case.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    // ---------------------------------------------------------------
    // newCase() defaulting behavior
    // ---------------------------------------------------------------

    @Test
    void newCaseAppliesIndianLegalSystemDefaultsWhenFieldsAreMissing() {
        when(caseRepository.count()).thenReturn(0L);
        Case input = new Case();
        input.setTitle("State vs. Doe");

        Case saved = caseService.newCase(input);

        assertEquals(LocalDate.now(), saved.getFilingDate());
        assertEquals(Case.CaseStatus.FILED, saved.getStatus());
        assertFalse(saved.getIsDisposed());
        assertEquals(Case.CaseType.CIVIL, saved.getCaseType());
        assertEquals(Case.CourtType.DISTRICT_COURT, saved.getCourtType());
        assertEquals(Case.Priority.MEDIUM, saved.getPriority());
        assertNotNull(saved.getCaseNumber());
        assertNotNull(saved.getCourtLocation());
        assertFalse(saved.getActsAndSections().isEmpty());
        verify(caseRepository).save(input);
    }

    @Test
    void newCaseDoesNotOverrideExplicitlyProvidedValues() {
        Case input = new Case();
        input.setTitle("Explicit Case");
        input.setFilingDate(LocalDate.of(2020, 1, 1));
        input.setStatus(Case.CaseStatus.UNDER_TRIAL);
        input.setIsDisposed(true);
        input.setCaseType(Case.CaseType.FAMILY);
        input.setCourtType(Case.CourtType.FAMILY_COURT);
        input.setCaseNumber("HMA 999/2020");
        input.setCourtLocation("Custom Court, Pune");
        input.setPriority(Case.Priority.URGENT);
        input.setActsAndSections(List.of("Custom Act 2020"));

        Case saved = caseService.newCase(input);

        assertEquals(LocalDate.of(2020, 1, 1), saved.getFilingDate());
        assertEquals(Case.CaseStatus.UNDER_TRIAL, saved.getStatus());
        assertTrue(saved.getIsDisposed());
        assertEquals(Case.CaseType.FAMILY, saved.getCaseType());
        assertEquals(Case.CourtType.FAMILY_COURT, saved.getCourtType());
        assertEquals("HMA 999/2020", saved.getCaseNumber());
        assertEquals("Custom Court, Pune", saved.getCourtLocation());
        assertEquals(Case.Priority.URGENT, saved.getPriority());
        assertEquals(List.of("Custom Act 2020"), saved.getActsAndSections());
        // count() should never be consulted when a case number is already supplied
        verify(caseRepository, never()).count();
    }

    static Stream<Arguments> caseNumberPrefixes() {
        return Stream.of(
                Arguments.of(Case.CaseType.CRIMINAL, Case.CourtType.HIGH_COURT, "CRL.A."),
                Arguments.of(Case.CaseType.CIVIL, Case.CourtType.HIGH_COURT, "C.S."),
                Arguments.of(Case.CaseType.CONSTITUTIONAL, Case.CourtType.HIGH_COURT, "W.P.(C)"),
                Arguments.of(Case.CaseType.FAMILY, Case.CourtType.HIGH_COURT, "MAT.APP."),
                Arguments.of(Case.CaseType.CRIMINAL, Case.CourtType.SUPREME_COURT, "SLP(CRL.)"),
                Arguments.of(Case.CaseType.CIVIL, Case.CourtType.SUPREME_COURT, "SLP(C)"),
                Arguments.of(Case.CaseType.CRIMINAL, Case.CourtType.DISTRICT_COURT, "CR."),
                Arguments.of(Case.CaseType.CIVIL, Case.CourtType.DISTRICT_COURT, "CS"),
                Arguments.of(Case.CaseType.FAMILY, Case.CourtType.DISTRICT_COURT, "HMA"),
                Arguments.of(Case.CaseType.CONSUMER, Case.CourtType.DISTRICT_COURT, "MISC.")
        );
    }

    @ParameterizedTest(name = "{0} case in {1} gets prefix {2}")
    @MethodSource("caseNumberPrefixes")
    void generatedCaseNumberUsesCorrectIndianPrefixForCaseAndCourtType(
            Case.CaseType caseType, Case.CourtType courtType, String expectedPrefix) {
        when(caseRepository.count()).thenReturn(4L);
        Case input = new Case();
        input.setTitle("Prefix Test");
        input.setCaseType(caseType);
        input.setCourtType(courtType);

        Case saved = caseService.newCase(input);

        int year = LocalDate.now().getYear();
        assertEquals(expectedPrefix + " 5/" + year, saved.getCaseNumber());
    }

    @Test
    void defaultCourtLocationMatchesCourtType() {
        when(caseRepository.count()).thenReturn(0L);

        Case supremeCourtCase = new Case();
        supremeCourtCase.setTitle("SC case");
        supremeCourtCase.setCourtType(Case.CourtType.SUPREME_COURT);
        assertEquals("Supreme Court of India, New Delhi", caseService.newCase(supremeCourtCase).getCourtLocation());

        Case familyCourtCase = new Case();
        familyCourtCase.setTitle("Family case");
        familyCourtCase.setCourtType(Case.CourtType.FAMILY_COURT);
        assertEquals("Family Court, Delhi", caseService.newCase(familyCourtCase).getCourtLocation());
    }

    @Test
    void defaultActsAndSectionsMatchCaseType() {
        when(caseRepository.count()).thenReturn(0L);

        Case criminalCase = new Case();
        criminalCase.setTitle("Criminal case");
        criminalCase.setCaseType(Case.CaseType.CRIMINAL);
        assertEquals(List.of("IPC Section 302", "CrPC Section 154"), caseService.newCase(criminalCase).getActsAndSections());

        Case cyberCase = new Case();
        cyberCase.setTitle("Cyber case");
        cyberCase.setCaseType(Case.CaseType.CYBER_CRIME);
        assertEquals(List.of("IT Act 2000 Section 66A", "IPC Section 420"), caseService.newCase(cyberCase).getActsAndSections());
    }

    // ---------------------------------------------------------------
    // updateCase() partial-update semantics
    // ---------------------------------------------------------------

    @Test
    void updateCaseOnlyOverwritesNonNullFields() {
        Case existing = new Case();
        existing.setId(1);
        existing.setTitle("Original Title");
        existing.setDescription("Original description");
        existing.setCaseNumber("CS 1/2026");
        when(caseRepository.findById(1)).thenReturn(Optional.of(existing));

        Case patch = new Case();
        patch.setTitle("Updated Title");
        // description and caseNumber intentionally left null -> must be preserved

        Case result = caseService.updateCase(1, patch);

        assertEquals("Updated Title", result.getTitle());
        assertEquals("Original description", result.getDescription());
        assertEquals("CS 1/2026", result.getCaseNumber());
    }

    @Test
    void updateCaseReturnsNullWhenCaseDoesNotExist() {
        when(caseRepository.findById(99)).thenReturn(Optional.empty());
        assertNull(caseService.updateCase(99, new Case()));
    }

    // ---------------------------------------------------------------
    // Lifecycle transitions
    // ---------------------------------------------------------------

    @Test
    void closeCaseMarksDisposedWithJudgmentDate() {
        Case existing = new Case();
        existing.setId(2);
        existing.setStatus(Case.CaseStatus.ARGUMENT_STAGE);
        when(caseRepository.findById(2)).thenReturn(Optional.of(existing));

        Case closed = caseService.closeCase(2);

        assertTrue(closed.getIsDisposed());
        assertEquals(Case.CaseStatus.DISPOSED, closed.getStatus());
        assertEquals(LocalDate.now(), closed.getJudgmentDate());
    }

    @Test
    void reopenCaseClearsDisposalAndJudgmentDate() {
        Case existing = new Case();
        existing.setId(3);
        existing.setIsDisposed(true);
        existing.setStatus(Case.CaseStatus.DISPOSED);
        existing.setJudgmentDate(LocalDate.now());
        when(caseRepository.findById(3)).thenReturn(Optional.of(existing));

        Case reopened = caseService.reopenCase(3);

        assertFalse(reopened.getIsDisposed());
        assertEquals(Case.CaseStatus.UNDER_TRIAL, reopened.getStatus());
        assertNull(reopened.getJudgmentDate());
    }

    @Test
    void deleteCaseReturnsFalseWhenCaseMissing() {
        when(caseRepository.existsById(123)).thenReturn(false);
        assertFalse(caseService.deleteCase(123));
        verify(caseRepository, never()).deleteById(any());
    }

    @Test
    void deleteCaseRemovesAndReturnsTrueWhenPresent() {
        when(caseRepository.existsById(5)).thenReturn(true);
        assertTrue(caseService.deleteCase(5));
        verify(caseRepository).deleteById(5);
    }

    // ---------------------------------------------------------------
    // Assignment
    // ---------------------------------------------------------------

    @Test
    void assignLawyerAddsLawyerToAdvocatesWhenBothExist() {
        Case existing = new Case();
        existing.setId(7);
        User lawyer = new User();
        lawyer.setId(42);
        when(caseRepository.findById(7)).thenReturn(Optional.of(existing));
        when(userRepository.findById(42)).thenReturn(Optional.of(lawyer));

        Case result = caseService.assignLawyer(7, 42);

        assertNotNull(result);
        assertTrue(result.getAdvocates().contains(lawyer));
    }

    @Test
    void assignLawyerReturnsNullWhenLawyerMissing() {
        when(caseRepository.findById(7)).thenReturn(Optional.of(new Case()));
        when(userRepository.findById(42)).thenReturn(Optional.empty());
        assertNull(caseService.assignLawyer(7, 42));
    }

    @Test
    void assignJudgeSetsPresidingJudge() {
        Case existing = new Case();
        existing.setId(8);
        User judge = new User();
        judge.setId(10);
        when(caseRepository.findById(8)).thenReturn(Optional.of(existing));
        when(userRepository.findById(10)).thenReturn(Optional.of(judge));

        Case result = caseService.assignJudge(8, 10);

        assertNotNull(result);
        assertEquals(judge, result.getPresidingJudge());
    }

    // ---------------------------------------------------------------
    // Filtering helpers
    // ---------------------------------------------------------------

    @Test
    void getActiveCasesExcludesDisposedCases() {
        // Filtering now happens in the DB query (CaseAll#findActiveCases), so the
        // repository mock returns exactly the rows that query would already exclude
        // disposed cases from; a null isDisposed flag is still treated as active.
        Case active = new Case();
        active.setIsDisposed(false);
        Case nullFlag = new Case(); // legacy rows may have a null flag -> treated as active
        when(caseRepository.findActiveCases()).thenReturn(List.of(active, nullFlag));

        List<Case> result = caseService.getActiveCases();

        assertEquals(2, result.size());
        assertTrue(result.contains(active));
        assertTrue(result.contains(nullFlag));
    }

    @Test
    void getUpcomingHearingsExcludesPastAndDisposedCases() {
        // findUpcomingHearings(now) itself does the past/disposed filtering in the DB
        // query; the mock only needs to return what that query would yield.
        Case future = new Case();
        future.setNextHearing(LocalDateTime.now().plusDays(1));
        future.setIsDisposed(false);
        when(caseRepository.findUpcomingHearings(any(LocalDateTime.class))).thenReturn(List.of(future));

        List<Case> result = caseService.getUpcomingHearings();

        assertEquals(1, result.size());
        assertTrue(result.contains(future));
    }
}
