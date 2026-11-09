const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = "sine") {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}
// Get the game elements from HTML
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");

let highScore = Number(localStorage.getItem("catchTheStarsHighScore")) || 0;

highScoreDisplay.textContent = highScore;
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("startButton");
const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen = document.getElementById("gameScreen");
const playButton = document.getElementById("playButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const finalHighScoreDisplay = document.getElementById("finalHighScore");
const replayButton = document.getElementById("replayButton");
const message = document.getElementById("message");
const difficultySelect = document.getElementById("difficulty");
// Game variables
let score = 0;
let timeLeft = 30;
let stars = [];
let gameRunning = false;
let gameTimer;
let animationId;

// Basket properties
const basket = {
    x: 260,
    y: 350,
    width: 80,
    height: 25,
    speed: 7
};

// Keyboard controls
let leftPressed = false;
let rightPressed = false;

document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        leftPressed = true;
        event.preventDefault();
    }

    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        rightPressed = true;
        event.preventDefault();
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        leftPressed = false;
    }

    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        rightPressed = false;
    }
});

// Draw the basket

function drawBasket() {

    // Basket body gradient
    const gradient = ctx.createLinearGradient(
        basket.x,
        basket.y,
        basket.x,
        basket.y + basket.height
    );

    gradient.addColorStop(0, "#ffb6c1");
    gradient.addColorStop(1, "#ff69b4");

    // Draw rounded basket
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
        basket.x,
        basket.y,
        basket.width,
        basket.height,
        8
    );
    ctx.fill();

    // Basket rim
    ctx.fillStyle = "#ff1493";
    ctx.beginPath();
    ctx.roundRect(
        basket.x - 6,
        basket.y,
        basket.width + 12,
        8,
        4
    );
    ctx.fill();

    // Decorative dots
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(
            basket.x + 15 + i * 17,
            basket.y + 17,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}


// Create a falling star

function createStar() {

    let speed;

    if (difficultySelect.value === "easy") {
        speed = Math.random() * 1 + 1;
    }
    else if (difficultySelect.value === "medium") {
        speed = Math.random() * 2 + 2;
    }
    else {
        speed = Math.random() * 3 + 4;
    }

    stars.push({
        x: Math.random() * (canvas.width - 20) + 10,
        y: 0,
        size: 15,
        speed: speed,
        isBonus: Math.random() < 0.2
    });
}


// Draw the stars


function drawStars() {

    stars.forEach(function(star) {

        if (star.isBonus) {
            ctx.shadowColor = "#ff69b4";
            ctx.shadowBlur = 25;
            ctx.fillStyle = "#ff69b4";
            ctx.font = "28px Arial";
        } 
        else {
            ctx.shadowColor = "#ffe082";
            ctx.shadowBlur = 18;
            ctx.fillStyle = "#fff4b0";
            ctx.font = "24px Arial";
        }

        ctx.fillText("★", star.x, star.y);

    });

    ctx.shadowBlur = 0;
}



// Move the basket
function moveBasket() {
    if (leftPressed && basket.x > 0) {
        basket.x -= basket.speed;
    }

    if (rightPressed && basket.x + basket.width < canvas.width) {
        basket.x += basket.speed;
    }
}

// Check whether a star is caught

function checkCatch() {

    stars = stars.filter(function(star) {

        if (
            star.y >= basket.y &&
            star.y <= basket.y + basket.height &&
            star.x >= basket.x - 10 &&
            star.x <= basket.x + basket.width + 10
        ) {

        if (star.isBonus) {
            score += 5;
            playSound(1000, 0.2);
        } else {
            score += 1;
            playSound(700, 0.12);
     }

            scoreDisplay.textContent = score;
            if (score > highScore) {

                 highScore = score;

                localStorage.setItem("catchTheStarsHighScore", highScore);

                highScoreDisplay.textContent = highScore;

            }
            return false;
        }

        return star.y < canvas.height + 20;
    });
}


// Main game loop
function gameLoop() {

    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moveBasket();

    // Create new stars randomly
    if (Math.random() < 0.035) {
        createStar();
    }

    // Move stars downwards
    stars.forEach(function(star) {
        star.y += star.speed;
    });

    checkCatch();

    drawStars();
    drawBasket();

    animationId = requestAnimationFrame(gameLoop);
}

// Start the game
function startGame() {

    if (gameRunning) return;
    audioContext.resume().then(() => {
        playSound(523, 0.25);
    });

    score = 0;
    timeLeft = 30;
    stars = [];

    basket.x = 260;

    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;

    message.textContent = "Catch those stars!";
    startButton.textContent = "Playing...";

    gameRunning = true;

    gameLoop();

    gameTimer = setInterval(function() {

        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }

    }, 1000);
}

// End the game
function endGame() {

    gameRunning = false;

    clearInterval(gameTimer);

    playSound(450, 0.18);

    setTimeout(() => {
        playSound(300, 0.3);
    }, 180);

    cancelAnimationFrame(animationId);

    leftPressed = false;
    rightPressed = false;

    finalScoreDisplay.textContent = score;
    finalHighScoreDisplay.textContent = highScore;

    gameScreen.style.display = "none";
    gameOverScreen.style.display = "block";
}

// Button click
startButton.addEventListener("click", startGame);
playButton.addEventListener("click", function() {
    welcomeScreen.style.display = "none";
    gameScreen.style.display = "block";
});
replayButton.addEventListener("click", function() {
    gameOverScreen.style.display = "none";
    gameScreen.style.display = "block";
    startGame();
});
// Initial screen
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawBasket();
