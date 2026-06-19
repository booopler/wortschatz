// DOM Element Declarations
const mainTitle = document.getElementById('mainTitle');
const topSessionTimer = document.getElementById('topSessionTimer');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');

const diffBtns = document.querySelectorAll('.diff-btn');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const restartButton = document.getElementById('restartButton');

const wordSlot = document.getElementById('wordSlot');
const optionsContainer = document.getElementById('optionsContainer');
const wordTimerValue = document.getElementById('wordTimerValue');
const wordText = document.getElementById('wordText');

const accuracyPercentText = document.getElementById('accuracyPercent');

// Game State Variables
let sessionTimeLeft = 0;
let wordTimeLeft = 10;
let sessionInterval = null;
let wordInterval = null;
let questionTimeout = null;

let currentWordPair = null;
let correctCount = 0;
let totalCount = 0;
let answerSelected = false;
let selectedDuration = "300"; 
let endlessElapsedTime = 0;    

// Event Listeners
startButton.addEventListener('click', startGame);
stopButton.addEventListener('click', stopGame);
restartButton.addEventListener('click', showSetup);

diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        diffBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedDuration = e.target.getAttribute('data-val');
    });
});

// Universal Transition Controller
function transitionTo(hideEls, showEls, action) {
    hideEls.forEach(el => {
        if (!el.classList.contains('hidden')) {
            el.classList.add('fade-out-anim');
            el.classList.remove('fade-in-anim');
        }
    });
    
    setTimeout(() => {
        hideEls.forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('fade-out-anim');
        });
        
        if (action) action();
        
        showEls.forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('fade-in-anim');
        });
    }, 400);
}

function startGame() {
    if (questionTimeout) clearTimeout(questionTimeout);
    
    transitionTo([setupScreen, resultsScreen, mainTitle], [gameScreen, topSessionTimer], () => {
        correctCount = 0;
        totalCount = 0;
        endlessElapsedTime = 0; 
        
        if (selectedDuration === "infinite") {
            sessionTimeLeft = Infinity;
        } else {
            sessionTimeLeft = parseInt(selectedDuration, 10);
        }

        updateSessionTimerDisplay();
        
        sessionInterval = setInterval(() => {
            if (sessionTimeLeft === Infinity) {
                endlessElapsedTime++; 
            } else {
                sessionTimeLeft--;   
            }
            
            updateSessionTimerDisplay();
            
            if (sessionTimeLeft <= 0 && sessionTimeLeft !== Infinity) {
                endGame();
            }
        }, 1000);

        nextQuestion();
    });
}

function stopGame() {
    if (sessionInterval) clearInterval(sessionInterval);
    if (wordInterval) clearInterval(wordInterval);
    if (questionTimeout) clearTimeout(questionTimeout);
    
    transitionTo([gameScreen, topSessionTimer], [setupScreen, mainTitle], () => {
        mainTitle.innerText = "Wortschatz";
    });
}

function updateSessionTimerDisplay() {
    const timeToFormat = sessionTimeLeft === Infinity ? endlessElapsedTime : sessionTimeLeft;
    const minutes = Math.floor(timeToFormat / 60);
    const seconds = timeToFormat % 60;
    topSessionTimer.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function nextQuestion() {
    if (sessionTimeLeft <= 0 && sessionTimeLeft !== Infinity) return;
    
    answerSelected = false;
    optionsContainer.innerHTML = '';
    wordTimeLeft = 10;
    
    wordTimerValue.innerText = wordTimeLeft;
    wordTimerValue.classList.remove('warning');
    wordTimerValue.classList.add('hidden'); 

    const randomIndex = Math.floor(Math.random() * vocabularyList.length);
    currentWordPair = vocabularyList[randomIndex];

    spinWordSlot(currentWordPair.word);
}

function spinWordSlot(finalWord) {
    wordSlot.classList.remove('correct', 'wrong');
    wordSlot.classList.add('spinning');
    
    let currentIntervalDelay = 40;
    let elapsedTime = 0;
    const targetDuration = 1200; 

    function runSpinLoop() {
        const tempIndex = Math.floor(Math.random() * vocabularyList.length);
        wordText.innerText = vocabularyList[tempIndex].word;
        elapsedTime += currentIntervalDelay;

        if (elapsedTime > targetDuration * 0.7) {
            currentIntervalDelay += 40;
        } else if (elapsedTime > targetDuration * 0.4) {
            currentIntervalDelay += 15;
        }

        if (elapsedTime < targetDuration) {
            setTimeout(runSpinLoop, currentIntervalDelay);
        } else {
            wordSlot.classList.remove('spinning');
            wordText.innerText = finalWord; 
            wordTimerValue.classList.remove('hidden'); 
            generateOptions();
            startWordTimer();
        }
    }
    
    setTimeout(runSpinLoop, currentIntervalDelay);
}

function generateOptions() {
    let options = [currentWordPair.translation];
    
    const wrongPool = vocabularyList.filter(item => 
        item.translation !== currentWordPair.translation && 
        item.type === currentWordPair.type
    );
    
    wrongPool.sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(3, wrongPool.length); i++) {
        options.push(wrongPool[i].translation);
    }

    options.sort(() => 0.5 - Math.random());

    optionsContainer.innerHTML = '';
    options.forEach(optionText => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = optionText;
        btn.addEventListener('click', () => handleSelection(btn, optionText));
        optionsContainer.appendChild(btn);
    });
}

function startWordTimer() {
    if (wordInterval) clearInterval(wordInterval);
    
    wordInterval = setInterval(() => {
        wordTimeLeft--;
        
        if (wordTimeLeft <= 0) {
            wordTimerValue.innerText = ''; 
            clearInterval(wordInterval);
            handleTimeout();
        } else {
            wordTimerValue.innerText = wordTimeLeft;
        }
        
        if (wordTimeLeft <= 3 && wordTimeLeft > 0) {
            wordTimerValue.classList.add('warning');
        }
    }, 1000);
}

function fadeOutAndNext() {
    optionsContainer.classList.add('fade-out-anim');
    questionTimeout = setTimeout(() => {
        optionsContainer.classList.remove('fade-out-anim');
        nextQuestion();
    }, 400);
}

function handleSelection(selectedButton, chosenText) {
    if (answerSelected) return;
    answerSelected = true;
    clearInterval(wordInterval);
    totalCount++;

    const actionButtons = optionsContainer.querySelectorAll('.option-btn');
    actionButtons.forEach(btn => btn.disabled = true);

    if (chosenText === currentWordPair.translation) {
        correctCount++;
        selectedButton.classList.add('correct');
        wordSlot.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
        wordSlot.classList.add('wrong');
        actionButtons.forEach(btn => {
            if (btn.innerText === currentWordPair.translation) {
                btn.classList.add('correct');
            }
        });
    }

    questionTimeout = setTimeout(fadeOutAndNext, 1100);
}

function handleTimeout() {
    if (answerSelected) return;
    answerSelected = true;
    totalCount++;

    const actionButtons = optionsContainer.querySelectorAll('.option-btn');
    actionButtons.forEach(btn => {
        btn.disabled = true;
        if (btn.innerText === currentWordPair.translation) {
            btn.classList.add('correct');
        }
    });

    wordSlot.classList.add('wrong');
    questionTimeout = setTimeout(fadeOutAndNext, 1100);
}

function endGame() {
    if (sessionInterval) clearInterval(sessionInterval);
    if (wordInterval) clearInterval(wordInterval);
    if (questionTimeout) clearTimeout(questionTimeout);
    
    transitionTo([gameScreen, topSessionTimer], [resultsScreen, mainTitle], () => {
        mainTitle.innerText = "Spiel vorbei!"; 
        const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
        accuracyPercentText.innerText = `${accuracy}%`;
        
        accuracyPercentText.className = 'accuracy-number'; 
        if (accuracy >= 90) accuracyPercentText.classList.add('acc-green');
        else if (accuracy >= 75) accuracyPercentText.classList.add('acc-yellow-green');
        else if (accuracy >= 60) accuracyPercentText.classList.add('acc-yellow');
        else if (accuracy >= 40) accuracyPercentText.classList.add('acc-orange');
        else accuracyPercentText.classList.add('acc-red');
    });
}

function showSetup() {
    transitionTo([resultsScreen], [setupScreen], () => {
        mainTitle.innerText = "Wortschatz"; 
    });
}