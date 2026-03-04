/**
 * Math Quiz PWA - Core Logic
 * Debugged and Enhanced for local 'Live Server' environments.
 */

(function () {
    // Game State
    let currentMode = 'addition';
    let difficulty = localStorage.getItem('math_difficulty') || 'easy';

    let state = {
        num1: 0,
        num2: 0,
        operator: '+',
        answer: 0,
        score: 0,
        audioContext: null,
        stats: JSON.parse(localStorage.getItem('math_stats')) || {
            total: 0,
            correct: 0,
            wrong: 0,
            modes: {
                addition: 0,
                subtraction: 0,
                multiplication: 0,
                division: 0
            }
        },
        backgroundInitialized: false
    };

    // DOM References (assigned in init)
    let els = {};

    /**
     * Set the current game mode and navigate to game screen
     * EXPOSED GLOBALLY for user debugging and inline handlers
     */
    window.setMode = function (mode) {
        console.log(`Setting mode to: ${mode}`);
        initAudio(); // Initialize audio on first interaction
        currentMode = mode;
        state.score = 0;
        if (els.scoreVal) els.scoreVal.textContent = '0';

        updateDifficultyUI();

        if (els.homeScreen) els.homeScreen.classList.remove('active');
        if (els.gameScreen) els.gameScreen.classList.add('active');
        if (els.dashboardScreen) els.dashboardScreen.classList.remove('active');

        generateQuestion();
    };

    /**
     * Initialization Function
     */
    function init() {
        console.log("Math Quiz PWA Initializing...");

        // Map DOM Elements safely
        const ids = [
            'home-screen', 'game-screen', 'dashboard-screen',
            'game-diff-label', 'back-btn', 'dashboard-btn',
            'dash-back-btn', 'reset-btn', 'main-play-btn',
            'score-val', 'num1', 'num2', 'operator',
            'answer-input', 'feedback', 'stat-total',
            'stat-correct', 'stat-wrong', 'stat-accuracy',
            'bar-chart', 'bg-animations'
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                els[id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = el;
            } else {
                console.warn(`Element with id '${id}' not found.`);
            }
        });

        const modeButtons = document.querySelectorAll('.mode-btn');
        const difficultyButtons = document.querySelectorAll('.diff-btn');

        // Event Listeners - Difficulty
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                difficulty = btn.dataset.diff;
                localStorage.setItem('math_difficulty', difficulty);
                updateDifficultyUI();
            });
        });

        // Event Listeners - Modes
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                window.setMode(btn.dataset.mode);
            });
        });

        // Event Listeners - Navigation
        if (els.backBtn) {
            els.backBtn.addEventListener('click', () => {
                if (els.gameScreen) els.gameScreen.classList.remove('active');
                if (els.homeScreen) els.homeScreen.classList.add('active');
            });
        }

        if (els.dashboardBtn) {
            els.dashboardBtn.addEventListener('click', () => {
                renderDashboard();
                if (els.homeScreen) els.homeScreen.classList.remove('active');
                if (els.dashboardScreen) els.dashboardScreen.classList.add('active');
            });
        }

        if (els.dashBackBtn) {
            els.dashBackBtn.addEventListener('click', () => {
                if (els.dashboardScreen) els.dashboardScreen.classList.remove('active');
                if (els.homeScreen) els.homeScreen.classList.add('active');
            });
        }

        if (els.mainPlayBtn) {
            els.mainPlayBtn.addEventListener('click', () => {
                window.setMode('mix');
            });
        }

        // Event Listeners - Game
        if (els.resetBtn) {
            els.resetBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to reset all stats?")) {
                    state.stats = {
                        total: 0, correct: 0, wrong: 0,
                        modes: { addition: 0, subtraction: 0, multiplication: 0, division: 0 }
                    };
                    saveStats();
                    renderDashboard();
                }
            });
        }

        if (els.answerInput) {
            els.answerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') checkAnswer();
            });
            // Focus input on load
            setTimeout(() => els.answerInput.focus(), 500);
        }

        // Initial Start State
        updateDifficultyUI();
        initBackground();
    }

    // --- Helper Functions ---

    const saveStats = () => localStorage.setItem('math_stats', JSON.stringify(state.stats));

    const updateDifficultyUI = () => {
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === difficulty);
        });
        if (els.gameDiffLabel) els.gameDiffLabel.textContent = difficulty;
    };

    const renderDashboard = () => {
        const { total, correct, wrong, modes } = state.stats;
        if (els.statTotal) els.statTotal.textContent = total;
        if (els.statCorrect) els.statCorrect.textContent = correct;
        if (els.statWrong) els.statWrong.textContent = wrong;

        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        if (els.statAccuracy) els.statAccuracy.textContent = `${accuracy}%`;

        if (els.barChart) {
            els.barChart.innerHTML = '';
            const maxVal = Math.max(...Object.values(modes), 5);
            Object.entries(modes).forEach(([mode, value]) => {
                const height = (value / maxVal) * 100;
                const barWrapper = document.createElement('div');
                barWrapper.className = 'bar-wrapper';
                barWrapper.innerHTML = `
                    <div class="bar" style="height: ${height}%" data-value="${value}"></div>
                    <span class="bar-label">${mode.charAt(0).toUpperCase()}</span>
                `;
                els.barChart.appendChild(barWrapper);
            });
        }
    };

    const initAudio = () => {
        if (!state.audioContext) {
            try {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("AudioContext could not be initialized", e);
            }
        }
    };

    const initBackground = () => {
        if (state.backgroundInitialized || !els.bgAnimations) return;
        const count = 15;
        const symbols = ['1', '2', '3', '4', '5', '+', '-', '×', '÷', '?', '⭐', '✨'];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            const isStar = Math.random() > 0.7;
            el.className = isStar ? 'bouncing-star' : 'floating-number';
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            el.style.left = `${Math.random() * 100}vw`;
            el.style.top = `${Math.random() * 100}vh`;
            el.style.animationDelay = `${Math.random() * 20}s`;
            el.style.fontSize = `${1 + Math.random() * 2}rem`;
            els.bgAnimations.appendChild(el);
        }
        state.backgroundInitialized = true;
    };

    const createConfetti = () => {
        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement('div');
            Object.assign(confetti.style, {
                position: 'fixed', width: '10px', height: '10px',
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                left: '50%', top: '50%', zIndex: '1000', pointerEvents: 'none', borderRadius: '2px'
            });
            document.body.appendChild(confetti);
            const angle = Math.random() * Math.PI * 2;
            const tx = Math.cos(angle) * 200 * Math.random();
            const ty = Math.sin(angle) * 200 * Math.random();
            confetti.animate([
                { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], { duration: 1000 + Math.random() * 1000, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)', fill: 'forwards' })
                .onfinish = () => confetti.remove();
        }
    };

    const showFeedbackIcon = (type) => {
        const icon = document.createElement('div');
        icon.className = `feedback-icon ${type}`;
        icon.textContent = type === 'correct' ? '✅' : '❌';
        Object.assign(icon.style, {
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) scale(0)', fontSize: '8rem',
            zIndex: '100', transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'none', opacity: '0'
        });
        const container = document.querySelector('.quiz-container');
        if (container) {
            container.appendChild(icon);
            requestAnimationFrame(() => {
                icon.style.transform = 'translate(-50%, -50%) scale(1)';
                icon.style.opacity = '1';
            });
            setTimeout(() => {
                icon.style.transform = 'translate(-50%, -50%) scale(0)';
                icon.style.opacity = '0';
                setTimeout(() => icon.remove(), 500);
            }, 800);
        }
    };

    const playSound = (type) => {
        if (!state.audioContext) return;
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        osc.connect(gain);
        gain.connect(state.audioContext.destination);
        if (type === 'correct') {
            osc.frequency.setValueAtTime(523.25, state.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, state.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, state.audioContext.currentTime);
            osc.start(); osc.stop(state.audioContext.currentTime + 0.4);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, state.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(110, state.audioContext.currentTime + 0.3);
            gain.gain.setValueAtTime(0.05, state.audioContext.currentTime);
            osc.start(); osc.stop(state.audioContext.currentTime + 0.3);
        }
    };

    const generateQuestion = () => {
        let modeToUse = currentMode === 'mix' ?
            ['addition', 'subtraction', 'multiplication', 'division'][Math.floor(Math.random() * 4)] :
            currentMode;

        let min = difficulty === 'hard' ? 50 : (difficulty === 'medium' ? 10 : 1);
        let max = difficulty === 'hard' ? 100 : (difficulty === 'medium' ? 50 : 10);
        const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        let n1, n2, op, ans;
        switch (modeToUse) {
            case 'addition': n1 = getRandom(min, max); n2 = getRandom(min, max); op = '+'; ans = n1 + n2; break;
            case 'subtraction': n1 = getRandom(min + 10, max + 20); n2 = getRandom(min, n1); op = '-'; ans = n1 - n2; break;
            case 'multiplication':
                n1 = difficulty === 'easy' ? getRandom(1, 9) : getRandom(2, 12);
                n2 = difficulty === 'easy' ? getRandom(1, 9) : getRandom(2, 10);
                op = '×'; ans = n1 * n2; break;
            case 'division': ans = getRandom(1, 9); n2 = getRandom(1, 9); n1 = ans * n2; op = '÷'; break;
            default: n1 = 1; n2 = 1; op = '+'; ans = 2;
        }

        state.num1 = n1; state.num2 = n2; state.operator = op; state.answer = ans;
        if (els.num1) els.num1.textContent = n1;
        if (els.num2) els.num2.textContent = n2;
        if (els.operator) els.operator.textContent = op;
        if (els.answerInput) { els.answerInput.value = ''; els.answerInput.focus(); }
        if (els.feedback) { els.feedback.textContent = ''; els.feedback.className = 'feedback'; }
    };

    const checkAnswer = () => {
        if (!els.answerInput) return;
        const userAns = parseInt(els.answerInput.value);
        if (isNaN(userAns)) return;
        state.stats.total++;
        if (userAns === state.answer) {
            state.score++; state.stats.correct++;
            state.stats.modes[currentMode === 'mix' ? 'addition' : currentMode]++;
            if (els.scoreVal) els.scoreVal.textContent = state.score;
            if (els.feedback) { els.feedback.textContent = "Awesome! 🎉"; els.feedback.className = 'feedback correct'; }
            playSound('correct'); createConfetti(); showFeedbackIcon('correct');
            setTimeout(generateQuestion, 1200);
        } else {
            state.stats.wrong++;
            if (els.feedback) { els.feedback.textContent = "Oops! Try again"; els.feedback.className = 'feedback wrong'; }
            playSound('wrong'); showFeedbackIcon('wrong');
            if (els.answerInput) els.answerInput.parentElement.classList.add('shake');
            setTimeout(() => { if (els.answerInput) { els.answerInput.parentElement.classList.remove('shake'); els.answerInput.value = ''; els.answerInput.focus(); } }, 500);
        }
        saveStats();
    };

    // Robust Initialization check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
