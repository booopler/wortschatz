const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxwwszGlaXfRK-0Z2GFmeJu4aPbzAgcetOpvy95MnZdH3M9lM_fX_WXh_PwIovCY7gS/exec";

const submitScoreBtn = document.getElementById('submitScoreBtn');
const nameModal = document.getElementById('nameModal');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const leaderboardList = document.getElementById('leaderboardList');
const mainTitle = document.getElementById('mainTitle');
const headerContainer = document.getElementById('headerContainer');
const topSessionTimer = document.getElementById('topSessionTimer');
const streakMeter = document.getElementById('streakMeter');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const diffBtns = document.querySelectorAll('.diff-btn');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const finishButton = document.getElementById('finishButton');
const restartButton = document.getElementById('restartButton');
const replayButton = document.getElementById('replayButton');
const wordSlot = document.getElementById('wordSlot');
const optionsContainer = document.getElementById('optionsContainer');
const wordTimerValue = document.getElementById('wordTimerValue');
const wordText = document.getElementById('wordText');
const accuracyPercentText = document.getElementById('accuracyPercent');
const finalScoreText = document.getElementById('finalScore');
const accordionToggle = document.getElementById('accordionToggle');
const resultsCollapsible = document.getElementById('resultsCollapsible');
const statStreaks = document.getElementById('statStreaks');
const statTotal = document.getElementById('statTotal');
const healthBarWrapper = document.getElementById('healthBarWrapper');
const glyphSegmentsContainer = document.getElementById('glyphSegmentsContainer');
const statTimeElapsed = document.getElementById('statTimeElapsed');
const statFastest = document.getElementById('statFastest');
const statSlowest = document.getElementById('statSlowest');

let sessionTimeLeft = 0;
let wordTimeLeft = 10;
let sessionInterval = null;
let wordInterval = null;
let questionTimeout = null;
let availableWords = [];
let currentWordPair = null;
let correctCount = 0;
let totalCount = 0;
let currentStreak = 0; 
let maxStreak = 0;     
let totalScore = 0;
let answerSelected = false;
let selectedDuration = "300";
let endlessElapsedTime = 0;
let maxLives = 0;
let currentLives = 0;
let sessionStartTime = 0;   
let questionStartTime = 0;  
let fastestGuess = Infinity;
let slowestGuess = 0;       

startButton.addEventListener('click', startGame);
stopButton.addEventListener('click', stopGame);
finishButton.addEventListener('click', endGame);
restartButton.addEventListener('click', showSetup);
replayButton.addEventListener('click', startGame);

accordionToggle.addEventListener('click', () => {
    resultsCollapsible.classList.toggle('active');
});

if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', () => {
        nameModal.classList.add('show');
        playerNameInput.value = ""; 
        playerNameInput.focus();
    });
}

closeModalBtn.addEventListener('click', () => {
    nameModal.classList.remove('show');
});

playerNameInput.addEventListener('input', (e) => {
    e.target.value = e.target.value
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3);
});

saveScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value;
    
    if (name.length === 3) {
        saveScoreToSheet(name, totalScore);
        nameModal.classList.remove('show'); 
        
        if (submitScoreBtn) {
            submitScoreBtn.disabled = true;
            submitScoreBtn.innerText = "SAVED!";
            submitScoreBtn.style.opacity = "0.5";
        }
    } else {
        alert("Maximum of 3 letters are required.");
    }
});

diffBtns.forEach((btn) => {
    btn.addEventListener('click', (event) => {
        diffBtns.forEach((b) => {
            b.classList.remove('active');
        });
        event.target.classList.add('active');
        selectedDuration = event.target.getAttribute('data-val');
    });
});

function transitionTo(hideElements, showElements, onCompleteAction) {
    hideElements.forEach((element) => {
        if (!element.classList.contains('hidden')) {
            element.classList.add('fade-out-anim');
            element.classList.remove('fade-in-anim');
        }
    });
    
    setTimeout(() => {
        hideElements.forEach((element) => {
            element.classList.add('hidden');
            element.classList.remove('fade-out-anim');
        });
        
        if (onCompleteAction) {
            onCompleteAction();
        }
        
        showElements.forEach((element) => {
            element.classList.remove('hidden');
            element.classList.add('fade-in-anim');
        });
    }, 400);
}

function startGame() {
    if (questionTimeout) {
        clearTimeout(questionTimeout);
    }
    
    transitionTo([setupScreen, resultsScreen, mainTitle], [gameScreen, headerContainer], () => {
        correctCount = 0;
        totalCount = 0;
        currentStreak = 0;
        maxStreak = 0;
        totalScore = 0;
        endlessElapsedTime = 0; 
        availableWords = [...vocabularyList];
        
        sessionStartTime = performance.now();
        fastestGuess = Infinity;
        slowestGuess = 0;

        resultsCollapsible.classList.remove('active');
        updateStreakMeter(false);

        healthBarWrapper.classList.remove('damage-anim'); 
        void healthBarWrapper.offsetWidth;
        
        if (selectedDuration === "infinite") {
            sessionTimeLeft = Infinity;
            maxLives = Infinity;
            finishButton.classList.remove('hidden'); 
            healthBarWrapper.classList.add('hidden'); 
        } else {
            sessionTimeLeft = parseInt(selectedDuration, 10);
            if (selectedDuration === "150") {
                maxLives = 7;
            } else if (selectedDuration === "300") {
                maxLives = 5;
            } else if (selectedDuration === "600") {
                maxLives = 3;
            }
            finishButton.classList.add('hidden'); 
            healthBarWrapper.classList.remove('hidden'); 
        }

        currentLives = maxLives;
        updateLivesUI(false);
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
    clearAllIntervals();
    transitionTo([gameScreen, headerContainer], [setupScreen, mainTitle], () => {
        mainTitle.innerText = "Wortschatz";
    });
}

function updateSessionTimerDisplay() {
    let timeToFormat = sessionTimeLeft;
    if (sessionTimeLeft === Infinity) {
        timeToFormat = endlessElapsedTime;
    }

    const minutes = Math.floor(timeToFormat / 60);
    const seconds = timeToFormat % 60;
    
    topSessionTimer.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    topSessionTimer.className = '';

    if (sessionTimeLeft === Infinity || sessionTimeLeft >= 30) {
        topSessionTimer.classList.add('acc-default');
    } else if (sessionTimeLeft > 23) {
        topSessionTimer.classList.add('acc-yellow-green');
    } else if (sessionTimeLeft > 16) {
        topSessionTimer.classList.add('acc-yellow');
    } else if (sessionTimeLeft > 9) {
        topSessionTimer.classList.add('acc-orange');
    } else {
        topSessionTimer.classList.add('acc-red');
    }
}

function updateStreakMeter(isCorrect) {
    if (currentStreak > 0) {
        headerContainer.classList.add('has-streak');
        let displayStreak = currentStreak;
        if (currentStreak > 10) {
            displayStreak = 10;
        }
        
        streakMeter.innerText = `x${displayStreak}`;
        streakMeter.className = 'streak-pill';
        
        void streakMeter.offsetWidth; 

        if (currentStreak <= 5) {
            streakMeter.classList.add('streak-color-low');
        } else if (currentStreak === 6) {
            streakMeter.classList.add('streak-color-6');
            if (isCorrect) {
                streakMeter.classList.add('shake-6');
            }
        } else if (currentStreak === 7) {
            streakMeter.classList.add('streak-color-7');
            if (isCorrect) {
                streakMeter.classList.add('shake-7');
            }
        } else if (currentStreak === 8) {
            streakMeter.classList.add('streak-color-8');
            if (isCorrect) {
                streakMeter.classList.add('shake-8');
            }
        } else if (currentStreak === 9) {
            streakMeter.classList.add('streak-color-9');
            if (isCorrect) {
                streakMeter.classList.add('shake-9');
            }
        } else {
            streakMeter.classList.add('streak-color-10');
            if (isCorrect) {
                streakMeter.classList.add('shake-10');
            }
        }
    } else {
        headerContainer.classList.remove('has-streak');
    }
}

function updateLivesUI(isWrong) {
    if (currentLives === Infinity) {
        return;
    }

    const TOTAL_GLYPHS = 7; 

    if (glyphSegmentsContainer.children.length !== TOTAL_GLYPHS) {
        glyphSegmentsContainer.innerHTML = '';
        for (let i = 0; i < TOTAL_GLYPHS; i++) {
            const segment = document.createElement('div');
            segment.className = 'glyph-segment';
            glyphSegmentsContainer.appendChild(segment);
        }
    }

    let colorClass = 'health-high';
    if (currentLives >= 5) {
        colorClass = 'health-high'; 
    } else if (currentLives === 4) {
        colorClass = 'health-good'; 
    } else if (currentLives === 3) {
        colorClass = 'health-med';  
    } else if (currentLives === 2) {
        colorClass = 'health-warn'; 
    } else if (currentLives <= 1) {
        colorClass = 'health-low';  
    }

    const segments = glyphSegmentsContainer.children;
    for (let i = 0; i < segments.length; i++) {
        segments[i].classList.remove('health-high', 'health-good', 'health-med', 'health-warn', 'health-low');
        
        if (i < currentLives) {
            segments[i].classList.add(colorClass);
        }
    }

    if (isWrong) {
        healthBarWrapper.classList.remove('damage-anim');
        void healthBarWrapper.offsetWidth; 
        healthBarWrapper.classList.add('damage-anim');
    }
}

function nextQuestion() {
    if (sessionTimeLeft <= 0 && sessionTimeLeft !== Infinity) {
        return;
    }
    if (availableWords.length === 0) {
        endGame();
        return;
    }

    answerSelected = false;
    optionsContainer.innerHTML = '';
    wordTimeLeft = 10;
    
    wordTimerValue.innerText = wordTimeLeft;
    wordTimerValue.classList.remove('warning');
    wordTimerValue.classList.add('hidden'); 

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    currentWordPair = availableWords[randomIndex];
    availableWords.splice(randomIndex, 1);

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
            generateOptions();
            startWordTimer();
            questionStartTime = performance.now();
        }
    }
    
    setTimeout(runSpinLoop, currentIntervalDelay);
}

function generateOptions() {
    let options = [currentWordPair.translation];
    
    const wrongPool = vocabularyList.filter((item) => {
        return item.translation !== currentWordPair.translation && item.type === currentWordPair.type;
    });
    
    wrongPool.sort(() => {
        return 0.5 - Math.random();
    });
    
    for (let i = 0; i < Math.min(3, wrongPool.length); i++) {
        options.push(wrongPool[i].translation);
    }

    options.sort(() => {
        return 0.5 - Math.random();
    });
    optionsContainer.innerHTML = '';
    
    options.forEach((optionText) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerText = optionText;
        
        button.addEventListener('click', () => {
            handleSelection(button, optionText);
        });
        optionsContainer.appendChild(button);
    });
}

function startWordTimer() {
    if (wordInterval) {
        clearInterval(wordInterval);
    }
    
    wordInterval = setInterval(() => {
        wordTimeLeft--;
        
        if (wordTimeLeft <= 0) {
            wordTimerValue.innerText = ''; 
            clearInterval(wordInterval);
            handleTimeout();
        } else {
            wordTimerValue.innerText = wordTimeLeft;
            if (wordTimeLeft < 10) {
                wordTimerValue.classList.remove('hidden');
            }
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
    if (answerSelected) {
        return;
    }
    answerSelected = true;
    clearInterval(wordInterval);
    totalCount++;

    const guessDuration = performance.now() - questionStartTime;
    const actionButtons = optionsContainer.querySelectorAll('.option-btn');
    
    actionButtons.forEach((btn) => {
        btn.disabled = true;
    });

    if (chosenText === currentWordPair.translation) {
        correctCount++;
        currentStreak++; 
        totalScore += currentStreak;
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak; 
        }

        if (guessDuration < fastestGuess) {
            fastestGuess = guessDuration;
        }
        if (guessDuration > slowestGuess) {
            slowestGuess = guessDuration;
        }

        updateStreakMeter(true);
        selectedButton.classList.add('correct');
        wordSlot.classList.add('correct');
        
        questionTimeout = setTimeout(fadeOutAndNext, 1100);
    } else {
        currentStreak = 0; 
        updateStreakMeter(false);
        selectedButton.classList.add('wrong');
        wordSlot.classList.add('wrong');
        
        actionButtons.forEach((btn) => {
            if (btn.innerText === currentWordPair.translation) {
                btn.classList.add('correct');
            }
        });

        currentLives--;
        updateLivesUI(true);

        if (currentLives <= 0) {
            questionTimeout = setTimeout(endGame, 1100);
        } else {
            questionTimeout = setTimeout(fadeOutAndNext, 1100);
        }
    }
}

function handleTimeout() {
    if (answerSelected) {
        return;
    }
    
    answerSelected = true;
    totalCount++;
    currentStreak = 0; 
    updateStreakMeter(false);

    const actionButtons = optionsContainer.querySelectorAll('.option-btn');
    actionButtons.forEach((btn) => {
        btn.disabled = true;
        if (btn.innerText === currentWordPair.translation) {
            btn.classList.add('correct');
        }
    });

    wordSlot.classList.add('wrong');
    currentLives--;
    updateLivesUI(true);

    if (currentLives <= 0) {
        questionTimeout = setTimeout(endGame, 1100);
    } else {
        questionTimeout = setTimeout(fadeOutAndNext, 1100);
    }
}

function endGame() {
    clearAllIntervals();
    
    const totalElapsedMs = performance.now() - sessionStartTime;
    const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
    const elapsedMinutes = Math.floor(totalElapsedSec / 60);
    const elapsedSeconds = totalElapsedSec % 60;
    const formattedElapsedTime = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`;
    
    transitionTo([gameScreen, headerContainer], [resultsScreen, mainTitle], () => {
        mainTitle.innerText = "Spiel vorbei!"; 
        
        if (submitScoreBtn) {
            submitScoreBtn.disabled = false;
            submitScoreBtn.innerText = "SUBMIT";
            submitScoreBtn.style.opacity = "1";
        }

        loadLeaderboard();
        
        let accuracy = 0;
        if (totalCount > 0) {
            accuracy = Math.round((correctCount / totalCount) * 100);
        }
        
        accuracyPercentText.innerText = `${accuracy}%`;
        finalScoreText.innerText = totalScore;
        statStreaks.innerText = maxStreak;
        statTotal.innerText = totalCount;
        
        if (statTimeElapsed) {
            statTimeElapsed.innerText = formattedElapsedTime;
        }
        if (statFastest) {
            if (fastestGuess === Infinity) {
                statFastest.innerText = "?";
            } else {
                statFastest.innerText = `${(fastestGuess / 1000).toFixed(2)}s`;
            }
        }
        if (statSlowest) {
            if (slowestGuess === 0) {
                statSlowest.innerText = "?";
            } else {
                statSlowest.innerText = `${(slowestGuess / 1000).toFixed(2)}s`;
            }
        }

        accuracyPercentText.className = 'accuracy-number'; 
        finalScoreText.className = 'score-number acc-default';
        
        if (accuracy >= 90) {
            accuracyPercentText.classList.add('acc-green');
        } else if (accuracy >= 75) {
            accuracyPercentText.classList.add('acc-yellow-green');
        } else if (accuracy >= 60) {
            accuracyPercentText.classList.add('acc-yellow');
        } else if (accuracy >= 40) {
            accuracyPercentText.classList.add('acc-orange');
        } else {
            accuracyPercentText.classList.add('acc-red');
        }
    });
}

function showSetup() {
    transitionTo([resultsScreen], [setupScreen], () => {
        mainTitle.innerText = "Wortschatz"; 
    });
}

function clearAllIntervals() {
    if (sessionInterval) {
        clearInterval(sessionInterval);
    }
    if (wordInterval) {
        clearInterval(wordInterval);
    }
    if (questionTimeout) {
        clearTimeout(questionTimeout);
    }
}

function loadLeaderboard() {
    leaderboardList.innerHTML = "<div class='lb-loading'>Loading</div>";
    
    fetch(GAS_API_URL)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            leaderboardList.innerHTML = '';
            const topData = data.slice(0, 8);
            
            if (topData.length === 0) {
                leaderboardList.innerHTML = "<div class='lb-entry' style='font-size: 15px;'>No scores yet.</div>";
                return;
            }

            topData.forEach((row) => {
                const div = document.createElement('div');
                div.className = 'lb-entry';
                let scoreClass = '';
                const entryMode = String(row.mode || '').toLowerCase();
                
                if (entryMode === '150' || entryMode === 'easy') {
                    scoreClass = 'lb-score-easy';
                } else if (entryMode === '300' || entryMode === 'medium') {
                    scoreClass = 'lb-score-medium';
                } else if (entryMode === '600' || entryMode === 'hard') {
                    scoreClass = 'lb-score-hard';
                } else if (entryMode === 'infinite' || entryMode === 'endless') {
                    scoreClass = 'lb-score-endless';
                }
                
                div.innerHTML = `<span class="${scoreClass}">${row.name}</span><span>${row.score}</span>`;
                leaderboardList.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error fetching leaderboard:', error);
            leaderboardList.innerHTML = "<div class='lb-entry' style='font-size: 15px; color: #ffb8b8;'>Network error.</div>";
        });
}

function saveScoreToSheet(name, score) {
    leaderboardList.innerHTML = "<div class='lb-loading'>Saving</div>";
    
    fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: new URLSearchParams({
            'name': name,
            'score': score,
            'mode': selectedDuration
        })
    })
    .then((response) => {
        return response.text();
    })
    .then((result) => {
        if (submitScoreBtn) {
            if (result === "Not higher") {
                submitScoreBtn.innerText = "NOT A HIGH SCORE.";
            } else {
                submitScoreBtn.innerText = "SAVED!";
            }
        }
        setTimeout(loadLeaderboard, 1000);
    })
    .catch((error) => {
        console.error('Error saving score:', error);
        leaderboardList.innerHTML = "<div class='lb-entry' style='font-size: 15px; color: #ffb8b8;'>Failed to save</div>";
        
        if (submitScoreBtn) {
            submitScoreBtn.disabled = false;
            submitScoreBtn.innerText = "SUBMIT";
            submitScoreBtn.style.opacity = "1";
        }
    });
}