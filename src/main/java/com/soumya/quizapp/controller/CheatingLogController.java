package com.soumya.quizapp.controller;

import com.soumya.quizapp.CheatingLog;
import com.soumya.quizapp.service.CheatingLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("security")
public class CheatingLogController {

    @Autowired
    CheatingLogService cheatingLogService;

    @PostMapping("logViolation")
    public ResponseEntity<String> logViolation(@RequestBody CheatingLog log) {
        cheatingLogService.recordViolation(log);
        return ResponseEntity.ok("Violation recorded");
    }
}
