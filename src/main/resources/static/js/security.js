const SecurityConfig = {
    maxWarnings: 3,
    modelsUrl: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
    channelName: 'quiz_security_channel'
};

const SecurityState = {
    warnings: 0,
    isExamActive: false,
    tabId: Math.random().toString(36).substring(2, 10),
    isBlocked: false
};

// --- Duplicate Tab Prevention ---
const bc = new BroadcastChannel(SecurityConfig.channelName);

// Broadcast our presence periodically mapping to localStorage
function checkDuplicateTab() {
    // If another tab has set the active tab to something else and we are in an exam
    const activeTabId = localStorage.getItem('active_quiz_tab');
    
    if (!activeTabId) {
        localStorage.setItem('active_quiz_tab', SecurityState.tabId);
    } else if (activeTabId !== SecurityState.tabId) {
        // We are a duplicate tab!
        blockDuplicateTab();
    }
}

// Listen for other tabs claiming to be active
bc.onmessage = (event) => {
    if (event.data.type === 'NEW_TAB' && SecurityState.isExamActive) {
        // Tell the new tab that an exam is already running here
        bc.postMessage({ type: 'EXAM_ALREADY_RUNNING' });
    } else if (event.data.type === 'EXAM_ALREADY_RUNNING' && !SecurityState.isExamActive) {
        blockDuplicateTab();
    }
};

bc.postMessage({ type: 'NEW_TAB' });
setInterval(checkDuplicateTab, 1000);

function blockDuplicateTab() {
    logViolationToBackend('DUPLICATE_TAB', 'User opened exam in multiple tabs');
    SecurityState.isBlocked = true;
    showSecurityOverlay("Duplicate Tab Detected", "You already have the quiz open in another tab. Close this tab immediately.", false);
}

// --- Browser Monitoring (Visibility & Focus) ---
document.addEventListener('visibilitychange', () => {
    if (document.hidden && SecurityState.isExamActive && !SecurityState.isBlocked) {
        recordWarning("You tried to switch tabs or minimize the browser.");
    }
});

window.addEventListener('blur', () => {
    if (SecurityState.isExamActive && !SecurityState.isBlocked) {
        recordWarning("You lost focus on the exam window. Do not open other applications.");
    }
});

async function logViolationToBackend(violationType, description) {
    try {
        await fetch('/security/logViolation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tabId: SecurityState.tabId,
                violationType: violationType,
                description: description
            })
        });
    } catch (e) {
        console.error("Failed to log violation", e);
    }
}

function recordWarning(reason) {
    if (!SecurityState.isExamActive || SecurityState.isBlocked) return;
    
    logViolationToBackend('BROWSER_WARNING', reason);
    SecurityState.warnings++;
    const countEl = document.getElementById('warning-count');
    if (countEl) countEl.innerText = `${SecurityState.warnings} / ${SecurityConfig.maxWarnings}`;
    
    if (SecurityState.warnings >= SecurityConfig.maxWarnings) {
        terminateExam("Too Many Warnings", "You have violated the browser monitoring policies too many times. The exam is terminated.");
    } else {
        showSecurityOverlay("Warning " + SecurityState.warnings, reason + `\n\nYou have ${SecurityConfig.maxWarnings - SecurityState.warnings} warnings left.`, true);
    }
}

function showSecurityOverlay(title, message, canAcknowledge) {
    document.getElementById('security-title').innerText = title;
    document.getElementById('security-message').innerText = message;
    
    const ackBtn = document.getElementById('security-acknowledge');
    if (canAcknowledge) {
        ackBtn.classList.remove('hidden');
        ackBtn.onclick = () => {
            document.getElementById('security-overlay').classList.add('hidden');
            // Try to request full screen again
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(e=>console.log(e));
            }
        };
    } else {
        ackBtn.classList.add('hidden');
    }
    
    document.getElementById('security-overlay').classList.remove('hidden');
}

function terminateExam(title, message) {
    logViolationToBackend('EXAM_TERMINATED', title + ': ' + message);
    SecurityState.isExamActive = false;
    SecurityState.isBlocked = true;
    
    // Auto-submit logic would go here
    if(window.submitExam) {
        window.submitExam(true);
    }
    
    showSecurityOverlay(title, message, false);
}

// --- Camera & Face Monitoring ---
async function initCamera() {
    const statusEl = document.getElementById('camera-status');
    const startBtn = document.getElementById('start-exam-btn');
    const videoEl = document.getElementById('setup-video');

    try {
        statusEl.innerText = "Requesting Camera Access...";
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoEl.srcObject = stream;
        
        statusEl.innerText = "Loading AI Face Tracking...";
        
        // Wait for video to actually be playing
        videoEl.onloadeddata = async () => {
            try {
                // Initialize face-api
                await faceapi.nets.tinyFaceDetector.loadFromUri(SecurityConfig.modelsUrl);
                
                statusEl.innerText = "Camera Ready & Tracking Active";
                statusEl.className = "status-indicator status-success";
                startBtn.disabled = false;
                
                // Set the active tab in local storage explicitly now that we are ready
                localStorage.setItem('active_quiz_tab', SecurityState.tabId);
            } catch (error) {
                console.error("Face API Load failed, falling back to basic camera", error);
                // Fallback if CDN blocked - still allow exam but without AI tracking
                statusEl.innerText = "Camera Ready (AI tracking disabled due to network)";
                statusEl.className = "status-indicator status-success";
                startBtn.disabled = false;
            }
        };

    } catch (error) {
        statusEl.innerText = "Camera Access Denied. Required for Exam.";
        statusEl.className = "status-indicator status-fail";
        console.error("Camera error:", error);
    }
}

async function startFaceTracking(videoEl) {
    const badge = document.getElementById('face-tracking-status');
    const displaySize = { width: videoEl.videoWidth, height: videoEl.videoHeight };
    
    setInterval(async () => {
        if (!SecurityState.isExamActive || SecurityState.isBlocked) return;
        
        try {
            const detections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions());
            
            if (detections.length === 0) {
                badge.className = "status-badge danger";
                badge.innerText = "NO FACE DETECTED";
                // Optionally record a warning here if out of frame for too long
                // recordWarning("Your face left the camera frame.");
            } else if (detections.length > 1) {
                badge.className = "status-badge danger";
                badge.innerText = "MULTIPLE FACES!";
            } else {
                badge.className = "status-badge success";
                badge.innerText = "TRACKING ACTIVE";
            }
        } catch (e) {
            // Ignored if AI not loaded
        }
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    // Only init if not blocked by duplicate tab check
    if (!SecurityState.isBlocked) {
        initCamera();
    }
    
    // Start Exam click
    document.getElementById('start-exam-btn').addEventListener('click', async () => {
        // Enforce Full Screen
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen request failed", e);
        }
        
        SecurityState.isExamActive = true;
        document.getElementById('init-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        
        // Transfer video stream
        const setupVideoEl = document.getElementById('setup-video');
        const quizVideoEl = document.getElementById('quiz-video');
        quizVideoEl.srcObject = setupVideoEl.srcObject;
        
        if(window.loadQuiz) {
            window.loadQuiz();
        }
        
        startFaceTracking(quizVideoEl);
    });
});

// Clear tab lock on close
window.addEventListener('beforeunload', () => {
    if (localStorage.getItem('active_quiz_tab') === SecurityState.tabId) {
        localStorage.removeItem('active_quiz_tab');
    }
});
