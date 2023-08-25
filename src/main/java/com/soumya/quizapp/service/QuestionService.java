package com.soumya.quizapp.service;

import com.soumya.quizapp.Question;
import com.soumya.quizapp.dao.QuestionDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    @Autowired
    QuestionDao questionDao;

    public List<Question> getAllQuestions()
    {
        questionDao.findAll();
        return null;
    }

    public List<Question> getQuestionsByCategory(String category) {
        return (List<Question>) questionDao.findByCategory(category);
    }
}
