package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    private Long mobile;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String password;
    private Boolean isLawyer;
    private Boolean isJudge;
    @ManyToMany
    @JsonManagedReference
    private Set<Case> active;
    @ManyToMany
    @JsonManagedReference
    private Set<Case> pastCases;
    @ManyToMany
    @JsonManagedReference
    private Set<Case> caseRequest;
    @JsonManagedReference
    @ManyToMany
    private Set<Chat> chats;
    private String description;
    private String specialisation;
    private Integer fees;
    private String image;
    private String bench;
    private Integer years;
    private String court;
    public User(Long mobile,String firstName,String lastName,String email,String role,String password,String description,String specialisation, Integer fees, String image,String bench,Integer years,String court){
        if(role.equalsIgnoreCase("Lawyer")){
            isLawyer=true;
        }
        if(role.equalsIgnoreCase("judge")){
            isJudge=true;
        }
        this.mobile=mobile;
        this.firstName=firstName;
        this.lastName=lastName;
        this.email=email;
        this.role=role;
        this.court=court;
        this.password=password;
        this.description=description;
        this.specialisation=specialisation;
        this.fees=fees;
        this.image=image;
        this.bench=bench;
        this.years=years;
    }
}
