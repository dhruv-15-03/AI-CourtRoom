package com.example.demo.Method;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.User;

import java.util.List;

public interface UserMethods {
    public List<User> getLawyers();

    public List<User> getJudge();
    public User update(User user);
    public String delete(User user);
    public List<Case> activeCase(User user);
    public List<Case> caseRequest(User user);
    public List<Case> pendingCase(User user);
}
