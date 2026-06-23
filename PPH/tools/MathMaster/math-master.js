/* ======================================================
   MATH-MASTER.JS – FULL CONSOLIDATED ENGINE (v2)
   Features: 3-Chance Learning, Test Penalties, Exit Logic,
   floating-point-safe answer checking, talking tutor hints.
====================================================== */

let sessionData = {
    userName: 'Student',
    category: '',
    level: 1,
    mode: 'learn',
    totalQuestions: 10,
    currentQuestionIndex: 0,
    score: 0,
    attempts: 0,
    timerInterval: null,
    timePerQuestion: 30,
    currentAnswer: null,
    display: '',
    n1: null,
    n2: null,
    results: []
};

const speech = window.speechSynthesis;
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

// --- Initialization & Navigation ---

function saveName() {
    const nameInput = document.getElementById('user-name-input').value.trim();
    if (nameInput) {
        sessionData.userName = nameInput;
        document.getElementById('name-screen').classList.add('hidden');
        document.getElementById('setup-area').classList.remove('hidden');
        document.getElementById('greeting-h2').innerText = `Hello, ${sessionData.userName}!`;
    } else {
        document.getElementById('user-name-input').focus();
    }
}

function exitSession() {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        location.reload();
    }
}

function validateSetup() {
    const cat = document.getElementById('category-select').value;
    const startBtn = document.getElementById('start-btn');
    if (cat) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
}

// Keep the level input inside its supported 1-50 range so question
// generators never receive an out-of-range value.
function clampLevel() {
    const levelInput = document.getElementById('level-select');
    let val = parseInt(levelInput.value, 10);
    if (isNaN(val)) val = 1;
    val = Math.min(50, Math.max(1, val));
    levelInput.value = val;
    return val;
}

function toggleModeOptions() {
    const mode = document.getElementById('mode-select').value;
    const timerGroup = document.getElementById('test-timer-group');
    if (mode === 'test') {
        timerGroup.classList.remove('hidden');
    } else {
        timerGroup.classList.add('hidden');
    }
}

// --- Session Logic ---

function startSession() {
    sessionData.category = document.getElementById('category-select').value;
    sessionData.level = clampLevel();
    sessionData.mode = document.getElementById('mode-select').value;
    sessionData.timePerQuestion = parseInt(document.getElementById('timer-select').value, 10) || 30;
    sessionData.currentQuestionIndex = 0;
    sessionData.score = 0;
    sessionData.results = [];

    document.getElementById('setup-area').classList.add('hidden');
    document.getElementById('practice-area').classList.remove('hidden');
    loadNextQuestion();
}

function loadNextQuestion() {
    if (sessionData.currentQuestionIndex >= sessionData.totalQuestions) {
        endSession();
        return;
    }

    sessionData.attempts = 0;
    sessionData.currentQuestionIndex++;
    document.getElementById('current-q').innerText = sessionData.currentQuestionIndex;
    document.getElementById('math-answer').value = '';
    document.getElementById('feedback-message').innerText = '';

    const q = generateMathQuestion(sessionData.category, sessionData.level);
    sessionData.currentAnswer = q.answer;
    sessionData.display = q.display;
    sessionData.n1 = q.n1;
    sessionData.n2 = q.n2;

    // aria-live="polite" on #math-display (set in HTML) announces this to
    // screen reader users; speak() additionally reads it aloud for users
    // who rely on the built-in talking tutor.
    document.getElementById('math-display').innerText = q.display;
    document.getElementById('math-answer').focus();

    speak(q.speech);

    if (sessionData.mode === 'test') {
        startQuestionTimer();
    }
}

function startQuestionTimer() {
    clearInterval(sessionData.timerInterval);
    let timeLeft = sessionData.timePerQuestion;
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.remove('hidden');
    document.getElementById('time-left').innerText = timeLeft;

    sessionData.timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;

        // Spoken countdown only at meaningful checkpoints so screen reader
        // / talking-tutor users aren't interrupted every single second.
        if (timeLeft === 10 || timeLeft === 5) {
            speak(`${timeLeft} seconds left.`);
        }

        if (timeLeft <= 0) {
            clearInterval(sessionData.timerInterval);
            recordResult('Timed Out', false);
            speak('Time is up.');
            loadNextQuestion();
        }
    }, 1000);
}

// --- Validation Logic ---

// Floating point numbers can never be compared with strict equality
// (e.g. 0.1 + 0.2 !== 0.3 in JavaScript). All MathMaster answers are
// rounded to 2 decimal places when generated, so we accept any user
// answer within a tiny tolerance of the stored answer.
const ANSWER_TOLERANCE = 0.005;

function isAnswerCorrect(userAnswer, correctAnswer) {
    if (Number.isNaN(userAnswer)) return false;
    return Math.abs(userAnswer - correctAnswer) < ANSWER_TOLERANCE;
}

function checkAnswer() {
    const userVal = document.getElementById('math-answer').value.trim();
    const userAnswer = parseFloat(userVal);
    const feedback = document.getElementById('feedback-message');

    clearInterval(sessionData.timerInterval);

    if (isAnswerCorrect(userAnswer, sessionData.currentAnswer)) {
        sessionData.score++;
        recordResult(userVal, true);
        playTone(880, 0.2, 0.1);
        feedback.innerText = 'Correct!';
        feedback.style.color = '#16a34a';
        speak('Correct!');
        setTimeout(loadNextQuestion, 800);
    } else {
        sessionData.attempts++;

        if (sessionData.mode === 'test') {
            sessionData.score -= 0.25;
            recordResult(userVal || 'No answer', false);
            feedback.innerText = `Incorrect. The answer was ${sessionData.currentAnswer}`;
            speak(`Incorrect. The answer was ${sessionData.currentAnswer}`);
            setTimeout(loadNextQuestion, 1500);
        } else {
            if (sessionData.attempts < 3) {
                let remaining = 3 - sessionData.attempts;
                feedback.innerText = `Wrong! ${remaining} chance(s) left.`;
                feedback.style.color = '#dc2626';
                speak(`Wrong. You have ${remaining} ${remaining === 1 ? 'chance' : 'chances'} left. Try the Hint button for help.`);
                document.getElementById('math-answer').value = '';
                document.getElementById('math-answer').focus();
            } else {
                recordResult(userVal || 'No answer', false);
                feedback.innerText = `Chances over. The answer is ${sessionData.currentAnswer}`;
                speak(`Three attempts used. The correct answer is ${sessionData.currentAnswer}`);
                setTimeout(loadNextQuestion, 2000);
            }
        }
    }
    document.getElementById('live-score').innerText = sessionData.score;
}

// --- Reporting & Assets ---

function recordResult(ans, isCorrect) {
    sessionData.results.push({
        q: sessionData.display,
        a: ans,
        correct: sessionData.currentAnswer,
        status: isCorrect ? 'status-correct' : 'status-wrong'
    });
}

function endSession() {
    clearInterval(sessionData.timerInterval);
    document.getElementById('practice-area').classList.add('hidden');
    document.getElementById('report-area').classList.remove('hidden');

    const finalScore = Math.max(0, sessionData.score);
    const percentage = (finalScore / sessionData.totalQuestions) * 100;

    document.getElementById('final-stats').innerText =
        `${sessionData.userName}, your final score is ${finalScore} / ${sessionData.totalQuestions}.`;

    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';
    sessionData.results.forEach((res, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${i + 1}</td>
            <td>${escapeHtml(res.q)}</td>
            <td class="${res.status}">${escapeHtml(String(res.a))}</td>
            <td>${escapeHtml(String(res.correct))}</td>`;
        tbody.appendChild(row);
    });

    const certBtn = document.getElementById('cert-btn');
    if (percentage >= 70 && sessionData.mode === 'test') {
        certBtn.classList.remove('hidden');
        certBtn.style.display = 'block';
    } else {
        certBtn.classList.add('hidden');
        certBtn.style.display = 'none';
    }

    document.getElementById('result-title').focus();
}

// Basic HTML-escaping so user-typed answers can never break the results table.
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function repeatQuestion() {
    speak(sessionData.display);
}

function speak(text) {
    if (!speech) return;
    if (speech.speaking) speech.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 0.9;
    speech.speak(ut);
}

function playTone(freq, dur, vol) {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = freq;
        g.gain.value = vol;
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    } catch (e) { /* Audio not available — fail silently, speech/visual feedback still works */ }
}

function generateCertificate() {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 20; ctx.strokeRect(20, 20, 760, 560);

    ctx.textAlign = 'center'; ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 40px sans-serif'; ctx.fillText('CERTIFICATE OF MASTERY', 400, 150);
    ctx.font = '24px sans-serif'; ctx.fillText('This is proudly awarded to', 400, 220);
    ctx.font = 'italic bold 35px serif'; ctx.fillStyle = '#2563eb'; ctx.fillText(sessionData.userName, 400, 280);
    ctx.fillStyle = '#1e293b'; ctx.font = '22px sans-serif';
    ctx.fillText(`For completing Level ${sessionData.level} ${sessionData.category}`, 400, 350);
    ctx.fillText(`With a score of ${Math.max(0, sessionData.score)} out of ${sessionData.totalQuestions}`, 400, 400);

    const link = document.createElement('a');
    link.download = `MathMaster_${sessionData.userName}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// Global Listener for Enter key inside the answer field (keydown, not the
// deprecated keypress event)
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const practiceArea = document.getElementById('practice-area');
    if (practiceArea && !practiceArea.classList.contains('hidden') && document.activeElement.id === 'math-answer') {
        checkAnswer();
    }
});
