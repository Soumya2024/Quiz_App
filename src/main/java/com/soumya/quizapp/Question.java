package com.soumya.quizapp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)

    private Integer id_no;
    private String h_name;
    private String h_age;
    private String h_department;
    private String h_dateoform;
    private String h_charges;
    private String sex;
    private String difficultylevel;
    private String category;
}
