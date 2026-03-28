package com.soumya.quizapp.dao;

import com.soumya.quizapp.CheatingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CheatingLogDao extends JpaRepository<CheatingLog, Integer> {
}
