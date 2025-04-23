package com.example.demo.Implementation;

import com.example.demo.Classes.Case;
import com.example.demo.Classes.Message;
import com.example.demo.Classes.User;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Method.UserMethods;
import com.example.demo.Repository.ChatAll;
import com.example.demo.Repository.MessageAll;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserImplementation implements UserMethods {
    @Autowired
    private UserAll userAll;
    @Autowired
    private ChatAll chatAll;
    @Autowired
    private MessageAll messageAll;
    @Override
    public List<User> getLawyers() {
        return userAll.getLawyers();
    }
    public User getFromID(Integer id){
        return userAll.getReferenceById(id);
    }
    @Override
    public List<User> getJudge() {
        return userAll.getJudges();
    }
    public User getFromJwt(String jwt){
        String userName= JwtProvider.getEmailFromJwt(jwt);
        return userAll.searchByEmail(userName);
    }
    @Override
    public User update(User user, User user1) {
        User newUser=userAll.searchByEmail(user.getEmail());
        if(user1.getDescription()!=null)
            newUser.setDescription(user1.getDescription());
        if(user1.getRole()!=null)
            newUser.setRole(user1.getRole());
        if(user1.getBench()!=null)
            newUser.setBench(user1.getBench());
        if(user1.getFees()!=0)
            newUser.setFees(user1.getFees());
        if(user1.getImage()!=null)
            newUser.setImage(user1.getImage());
        if(user1.getMobile()!=0)
            newUser.setMobile(user1.getMobile());
        if(user1.getSpecialisation()!=null)
            newUser.setSpecialisation(user1.getSpecialisation());
        if(user1.getYears()!=0)
            newUser.setYears(user1.getYears());
        if(user1.getCourt()!=null)
            newUser.setCourt(user1.getCourt());
        newUser.setIsLawyer(user1.getRole().equalsIgnoreCase("lawyer"));
        newUser.setIsJudge(user1.getRole().equalsIgnoreCase("judge"));
        if(user1.getFirstName()!=null)
            newUser.setFirstName(user1.getFirstName());
        if(user1.getLastName()!=null)
            newUser.setLastName(user1.getLastName());
        if(user1.getActive()!=null)
            newUser.setActive(user1.getActive());
        if(user1.getPastCases()!=null)
            newUser.setPastCases(user1.getPastCases());
        if(user1.getCaseRequest()!=null)
            newUser.setCaseRequest(user1.getCaseRequest());
        userAll.save(newUser);
        return null;
    }

    @Override
    public String delete(User user) {
        userAll.delete(user);
        return "Successfully deleted user";
    }

    @Override
    public List<Case> activeCase(User user) {
        return new ArrayList<>(user.getActive());
    }

    @Override
    public List<Case> caseRequest(User user) {
        return new ArrayList<>(user.getCaseRequest());
    }

    @Override
    public List<Case> pastCases(User user) {
        return new ArrayList<>(user.getPastCases());
    }
}
