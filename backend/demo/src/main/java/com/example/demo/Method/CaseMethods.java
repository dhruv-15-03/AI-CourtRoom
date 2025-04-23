package com.example.demo.Method;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;

import java.util.List;

public interface CaseMethods {
    public Case newCase(User user, Case case1);

    public String close( Case case1,User judge, String judgement);

    public String judgement( Case case1,User judge, String judgement);

    public List<Case> search(User judge, String description);

    public Case selectCaseByJudge(User judge,Case case1);

    public Case selectCaseByLawyer(User lawyer,Case case1);

    public Case removeCase(User user, Case case1);
}
