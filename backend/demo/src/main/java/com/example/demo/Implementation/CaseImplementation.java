package com.example.demo.Implementation;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;
import com.example.demo.Method.CaseMethods;
import com.example.demo.Repository.CaseAll;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
public class CaseImplementation implements CaseMethods {

    @Autowired
    private CaseAll caseRepository;
    
    @Autowired
    private UserAll userRepository;

    @Override
    public Case newCase(User user, Case case1) {
        try {
            // Set default values
            if (case1.getDate() == null) {
                case1.setDate(LocalDate.now());
            }
            if (case1.getIsClose() == null) {
                case1.setIsClose(false);
            }
            if (case1.getJudgement() == null) {
                case1.setJudgement(new ArrayList<>());
            }
            
            // Save the case first
            Case savedCase = caseRepository.save(case1);
            
            // Add user to case
            if (savedCase.getUser() == null) {
                savedCase.setUser(new HashSet<>());
            }
            savedCase.getUser().add(user);
            
            // Add case to user's active cases
            if (user.getActive() == null) {
                user.setActive(new HashSet<>());
            }
            user.getActive().add(savedCase);
            
            // Save both entities
            caseRepository.save(savedCase);
            userRepository.save(user);
            
            return savedCase;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create case: " + e.getMessage());
        }
    }

    @Override
    public Optional<Case> getCaseById(Integer id) {
        return caseRepository.findById(id);
    }

    @Override
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }

    @Override
    public Case updateCase(Integer id, Case updatedCase) {
        Optional<Case> existingCaseOpt = caseRepository.findById(id);
        if (existingCaseOpt.isPresent()) {
            Case existing = existingCaseOpt.get();
            
            // Update allowed fields
            if (updatedCase.getDescription() != null) {
                existing.setDescription(updatedCase.getDescription());
            }
            if (updatedCase.getNext() != null) {
                existing.setNext(updatedCase.getNext());
            }
            if (updatedCase.getIsClose() != null) {
                existing.setIsClose(updatedCase.getIsClose());
            }
            if (updatedCase.getJudgement() != null) {
                existing.setJudgement(updatedCase.getJudgement());
            }
            
            return caseRepository.save(existing);
        }
        throw new RuntimeException("Case not found with id: " + id);
    }

    @Override
    public Case removeCase(User user, Case case1) {
        try {
            // Remove case from user's active cases
            if (user.getActive() != null) {
                user.getActive().remove(case1);
                userRepository.save(user);
            }
            
            // Remove user from case
            if (case1.getUser() != null) {
                case1.getUser().remove(user);
                return caseRepository.save(case1);
            }
            
            return case1;
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove case: " + e.getMessage());
        }
    }

    @Override
    public boolean deleteCase(Integer id) {
        try {
            if (caseRepository.existsById(id)) {
                caseRepository.deleteById(id);
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete case: " + e.getMessage());
        }
    }

    @Override
    public String close(Case case1, User judge, String judgement) {
        try {
            case1.setIsClose(true);
            case1.setJudge(judge);
            
            if (judgement != null && !judgement.trim().isEmpty()) {
                if (case1.getJudgement() == null) {
                    case1.setJudgement(new ArrayList<>());
                }
                case1.getJudgement().add(judgement);
            }
            
            caseRepository.save(case1);
            return "Case closed successfully";
        } catch (Exception e) {
            return "Failed to close case: " + e.getMessage();
        }
    }

    @Override
    public Case reopenCase(Integer caseId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isPresent()) {
            Case case1 = caseOpt.get();
            case1.setIsClose(false);
            return caseRepository.save(case1);
        }
        throw new RuntimeException("Case not found with id: " + caseId);
    }

    @Override
    public String judgement(Case case1, User judge, String judgement) {
        try {
            if (case1.getJudgement() == null) {
                case1.setJudgement(new ArrayList<>());
            }
            case1.getJudgement().add(judgement);
            case1.setJudge(judge);
            
            caseRepository.save(case1);
            return "Judgement added successfully";
        } catch (Exception e) {
            return "Failed to add judgement: " + e.getMessage();
        }
    }

    @Override
    public Case addJudgement(Integer caseId, String judgement) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isPresent()) {
            Case case1 = caseOpt.get();
            
            if (case1.getJudgement() == null) {
                case1.setJudgement(new ArrayList<>());
            }
            case1.getJudgement().add(judgement);
            
            return caseRepository.save(case1);
        }
        throw new RuntimeException("Case not found with id: " + caseId);
    }

    @Override
    public Case selectCaseByJudge(User judge, Case case1) {
        try {
            if (judge.getIsJudge() == null || !judge.getIsJudge()) {
                throw new RuntimeException("User is not a judge");
            }
            
            case1.setJudge(judge);
            return caseRepository.save(case1);
        } catch (Exception e) {
            throw new RuntimeException("Failed to assign judge: " + e.getMessage());
        }
    }

    @Override
    public Case selectCaseByLawyer(User lawyer, Case case1) {
        try {
            if (lawyer.getIsLawyer() == null || !lawyer.getIsLawyer()) {
                throw new RuntimeException("User is not a lawyer");
            }
            
            if (case1.getLawyer() == null) {
                case1.setLawyer(new HashSet<>());
            }
            case1.getLawyer().add(lawyer);
            
            return caseRepository.save(case1);
        } catch (Exception e) {
            throw new RuntimeException("Failed to assign lawyer: " + e.getMessage());
        }
    }

    @Override
    public Case assignLawyerToCase(Integer caseId, Integer lawyerId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        Optional<User> lawyerOpt = userRepository.findById(lawyerId);
        
        if (caseOpt.isPresent() && lawyerOpt.isPresent()) {
            Case case1 = caseOpt.get();
            User lawyer = lawyerOpt.get();
            
            if (lawyer.getIsLawyer() == null || !lawyer.getIsLawyer()) {
                throw new RuntimeException("User is not a lawyer");
            }
            
            if (case1.getLawyer() == null) {
                case1.setLawyer(new HashSet<>());
            }
            case1.getLawyer().add(lawyer);
            
            return caseRepository.save(case1);
        }
        throw new RuntimeException("Case or Lawyer not found");
    }

    @Override
    public Case assignJudgeToCase(Integer caseId, Integer judgeId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        Optional<User> judgeOpt = userRepository.findById(judgeId);
        
        if (caseOpt.isPresent() && judgeOpt.isPresent()) {
            Case case1 = caseOpt.get();
            User judge = judgeOpt.get();
            
            if (judge.getIsJudge() == null || !judge.getIsJudge()) {
                throw new RuntimeException("User is not a judge");
            }
            
            case1.setJudge(judge);
            return caseRepository.save(case1);
        }
        throw new RuntimeException("Case or Judge not found");
    }

    @Override
    public List<Case> search(User judge, String description) {
        return caseRepository.searchByName("%" + description + "%");
    }

    @Override
    public List<Case> searchCasesByDescription(String query) {
        return caseRepository.searchByName("%" + query + "%");
    }

    @Override
    public List<Case> getActiveCases() {
        return caseRepository.findActiveCases();
    }

    @Override
    public List<Case> getClosedCases() {
        return caseRepository.findClosedCases();
    }

    @Override
    public List<Case> getCasesByUser(User user) {
        return caseRepository.findCasesByUser(user);
    }

    @Override
    public List<Case> getCasesByLawyer(User lawyer) {
        return caseRepository.findCasesByLawyer(lawyer);
    }

    @Override
    public List<Case> getCasesByJudge(User judge) {
        return caseRepository.findCasesByJudge(judge);
    }

    @Override
    public List<Case> getCasesByDateRange(LocalDate startDate, LocalDate endDate) {
        return caseRepository.findCasesByDateRange(startDate, endDate);
    }

    @Override
    public List<Case> getUpcomingHearings() {
        return caseRepository.findUpcomingHearings(LocalDate.now());
    }

    @Override
    public Case setNextHearingDate(Integer caseId, LocalDate nextDate) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isPresent()) {
            Case case1 = caseOpt.get();
            case1.setNext(nextDate);
            return caseRepository.save(case1);
        }
        throw new RuntimeException("Case not found with id: " + caseId);
    }

    @Override
    public List<Case> getCasesByNextHearingDate(LocalDate date) {
        return caseRepository.findCasesByNextHearingDate(date);
    }

    @Override
    public long countActiveCases() {
        return caseRepository.countActiveCases();
    }

    @Override
    public long countClosedCases() {
        return caseRepository.countClosedCases();
    }

    @Override
    public long countCasesByUser(User user) {
        return getCasesByUser(user).size();
    }

    @Override
    public boolean existsById(Integer id) {
        return caseRepository.existsById(id);
    }
}
