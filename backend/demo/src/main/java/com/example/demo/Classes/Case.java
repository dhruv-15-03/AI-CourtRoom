package com.example.demo.Classes;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Case {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    private String description;
    private LocalDate date;
    private LocalDate next;
    @ManyToMany
    @JsonBackReference
    private Set<User> user;
    @ManyToMany
    @JsonBackReference
    private Set<User> lawyer;
    @ManyToOne
    @JsonBackReference
    private User judge;
    @ElementCollection
    private List<String> judgement;
    private Boolean isClose;
}
