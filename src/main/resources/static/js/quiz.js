let currentQuestionIndex = 0;
let questions = [];
let userAnswers = {};
let examTimer;
let totalTime = 30 * 60; // 30 minutes in seconds

async function loadQuiz() {
    try {
        const response = await fetch('/Hospital2/hos2');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questions = await response.json();
        
        if (questions && questions.length > 0) {
            renderQuestion();
            startTimer();
            
            document.getElementById('prev-btn').addEventListener('click', handlePrev);
            document.getElementById('next-btn').addEventListener('click', handleNext);
            document.getElementById('submit-exam-btn').addEventListener('click', () => submitExam(false));
        } else {
            document.getElementById('question-text').innerText = "No questions found from API.";
        }
    } catch (error) {
        console.error("Failed to load questions:", error);
        document.getElementById('question-text').innerText = "Failed to load questions from server. Ensure API is running.";
    }
}

function renderQuestion() {
    if (questions.length === 0) return;
    
    const question = questions[currentQuestionIndex];
    document.getElementById('question-number').innerText = `Question ${currentQuestionIndex + 1} / ${questions.length}`;
    document.getElementById('question-text').innerText = question.h_name || question.questionTitle || question.title || "Untitled Question";
    
    // Create options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Support custom hospital backend format and standard options
    const possibleOptions = ['h_age', 'h_department', 'h_dateoform', 'h_charges', 'option1', 'option2', 'option3', 'option4'];
    let renderedCount = 0;
    
    possibleOptions.forEach((optKey, index) => {
        if (question[optKey]) {
            renderedCount++;
            const btn = document.createElement('button');
            btn.className = `option-btn ${userAnswers[currentQuestionIndex] === question[optKey] ? 'selected' : ''}`;
            
            // Generate label (A, B, C, D)
            const labelStr = String.fromCharCode(65 + index);
            
            btn.innerHTML = `
                <div class="option-label">${labelStr}</div>
                <div class="option-text">${question[optKey]}</div>
            `;
            
            btn.onclick = () => selectOption(question[optKey]);
            optionsContainer.appendChild(btn);
        }
    });

    // Toggle button states
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('next-btn').innerText = "Finish";
    } else {
        document.getElementById('next-btn').innerText = "Next";
    }
}

function selectOption(value) {
    userAnswers[currentQuestionIndex] = value;
    renderQuestion(); // Re-render to highlight selected
}

function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        submitExam(false);
    }
}

function handlePrev() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function startTimer() {
    examTimer = setInterval(() => {
        if (totalTime <= 0) {
            clearInterval(examTimer);
            submitExam(true);
            return;
        }
        
        totalTime--;
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        
        document.getElementById('timer').innerText = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
        if (totalTime < 300) {
            // Less than 5 mins, turn timer red
            document.getElementById('timer').style.color = "var(--danger)";
        }
    }, 1000);
}

function submitExam(isForced = false) {
    clearInterval(examTimer);
    SecurityState.isExamActive = false; // Disable security checks
    
    // Calculate score
    let score = 0;
    questions.forEach((q, index) => {
        if (userAnswers[index] === q.rightAnswer || userAnswers[index] === q.correctAnswer || userAnswers[index] === q.sex) {
            score++;
        }
    });
    
    // Exit full screen
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    } catch(e) {}
    
    // Stop camera streams
    try {
        const quizVideoEl = document.getElementById('quiz-video');
        if (quizVideoEl && quizVideoEl.srcObject) {
            const tracks = quizVideoEl.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        const setupVideoEl = document.getElementById('setup-video');
        if (setupVideoEl && setupVideoEl.srcObject) {
            const tracks = setupVideoEl.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    } catch (e) {
        console.error("Failed to stop camera tracks", e);
    }

    // Hide overlay if forced submission
    if (isForced) {
        document.getElementById('security-overlay').classList.add('hidden');
    }

    // Show results
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    
    if (isForced) {
        document.getElementById('result-message').innerText = 
            "Your exam was terminated due to policy violations (Cheating or Time out).";
        document.getElementById('result-message').style.color = "var(--danger)";
    }
    
    document.getElementById('final-score').innerText = `${score} / ${questions.length}`;
}

// Attach to window so security context can call these
window.loadQuiz = loadQuiz;
window.submitExam = submitExam;
