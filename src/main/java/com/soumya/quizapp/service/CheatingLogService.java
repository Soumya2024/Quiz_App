package com.soumya.quizapp.service;

import com.soumya.quizapp.CheatingLog;
import com.soumya.quizapp.dao.CheatingLogDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CheatingLogService {
    @Autowired
    CheatingLogDao cheatingLogDao;

    public void recordViolation(CheatingLog log) {
        log.setTimestamp(LocalDateTime.now());
        cheatingLogDao.save(log);
    }
}
