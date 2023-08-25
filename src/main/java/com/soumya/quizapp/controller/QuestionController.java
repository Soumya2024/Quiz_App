package com.soumya.quizapp.controller;

import com.soumya.quizapp.Question;
import com.soumya.quizapp.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("Hospital2")
public class QuestionController {
    @Autowired
    QuestionService qestionService;
    @GetMapping("hos2")
    public List<Question> getAllQuestions() {
        return qestionService.getAllQuestions();
    }

    @GetMapping("category/{category}")
    public List<Question> getQuestionsByCategory(@PathVariable String category){
    return qestionService.getQuestionsByCategory(category);
    }
}

//    public List<Question> getAllQuestions(QuestionController questionService) {
////        QuestionController questionService = null;
//        return questionService.getAllQuestions();
//    }

