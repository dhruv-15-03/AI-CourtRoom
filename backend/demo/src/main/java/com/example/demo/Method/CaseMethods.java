package com.example.demo.Method;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;

public interface CaseMethods {
    public Case newCase(User user, Case case1);

    public String close(User user, Case case1,User judge, String judgement);



}
