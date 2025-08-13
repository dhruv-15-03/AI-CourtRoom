package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Entity
@Table(name = "app_user")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
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
    @JoinTable(
        name = "user_active_cases",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> active;
    @ManyToMany
    @JoinTable(
        name = "user_past_cases",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> pastCases;
    @ManyToMany
    @JoinTable(
        name = "user_case_requests",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "case_id")
    )
    @JsonIgnore
    private Set<Case> caseRequest;
    @ManyToMany
    @JoinTable(
        name = "user_chats",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "chat_id")
    )
    @JsonIgnore
    private Set<Chat> chats;
    @OneToMany(mappedBy = "judge")
    @JsonIgnore
    private Set<Case> judgeCases;
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
