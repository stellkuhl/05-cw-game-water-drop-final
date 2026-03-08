// -----------------------------
// DROPLET GAME - SIMPLIFIED MVP
// -----------------------------

// Screens
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");

// Buttons
const startBtn = document.getElementById("start-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const homeBtn = document.getElementById("home-btn");

// Displays
const scoreDisplay = document.getElementById("score");
const bucketCountDisplay = document.getElementById("bucket-count");
const timeDisplay = document.getElementById("time");
const healthDisplay = document.getElementById("health");

const sessionBucketsText = document.getElementById("session-buckets-text");
const peopleHelpedText = document.getElementById("people-helped-text");
const globalProgressFill = document.getElementById("global-progress-fill");
const gameOverProgressFill = document.getElementById("game-over-progress-fill");

const finalScoreDisplay = document.getElementById("final-score");
const roundBucketsResult = document.getElementById("round-buckets-result");
const sessionBucketsResult = document.getElementById("session-buckets-result");
const peopleHelpedResult = document.getElementById("people-helped-result");
const endMessage = document.getElementById("end-message");
const instructionPopup = document.getElementById("instruction-popup");
const instructionGotItBtn = document.getElementById("instruction-got-it-btn");

const feedbackMessage = document.getElementById("feedback-message");

// Game elements
const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");

// -----------------------------
// Game state
// -----------------------------
let gameRunning = false;
let score = 0;
let timeLeft = 30;
let health = 3;
let cleanDropsCaught = 0;
let roundBucketsFilled = 0;
let sessionBucketsFilled = 0;
let peopleHelped = 0;

const sessionGoalBuckets = 10;
const peopleHelpedAtFullGoal = 25;

let bucketX = 0;
let moveLeft = false;
let moveRight = false;
const bucketSpeed = 8;

let drops = [];

let spawnInterval = null;
let timerInterval = null;
let animationFrameId = null;
let difficultyTimeout = null;
let introStartTimeout = null;
let waitingForInstructionDismiss = false;

let shouldShowFirstRunInstructions = true;

// -----------------------------
// Utility
// -----------------------------
function showScreen(screen) {
  startScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  screen.classList.remove("hidden");
}

function updateGlobalImpactBar() {
  peopleHelped = Math.floor(
    (sessionBucketsFilled / sessionGoalBuckets) * peopleHelpedAtFullGoal
  );

  const progressPercent = Math.min(
    (sessionBucketsFilled / sessionGoalBuckets) * 100,
    100
  );

  globalProgressFill.style.width = `${progressPercent}%`;
  gameOverProgressFill.style.width = `${progressPercent}%`;

  sessionBucketsText.textContent = `Buckets filled this session: ${sessionBucketsFilled} / ${sessionGoalBuckets}`;
  peopleHelpedText.textContent = `People helped: ${peopleHelped}`;
}

function updateGameUI() {
  scoreDisplay.textContent = score;
  bucketCountDisplay.textContent = roundBucketsFilled;
  timeDisplay.textContent = timeLeft;
  healthDisplay.textContent = "❤️".repeat(Math.max(health, 0));
}

function showFeedback(text) {
  feedbackMessage.textContent = text;
  feedbackMessage.classList.add("show");

  clearTimeout(feedbackMessage._hideTimer);
  feedbackMessage._hideTimer = setTimeout(() => {
    feedbackMessage.classList.remove("show");
  }, 700);
}

function clearDrops() {
  drops.forEach(drop => drop.element.remove());
  drops = [];
}

function stopLoops() {
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearTimeout(difficultyTimeout);
  clearTimeout(introStartTimeout);
  cancelAnimationFrame(animationFrameId);

  spawnInterval = null;
  timerInterval = null;
  difficultyTimeout = null;
  introStartTimeout = null;
  waitingForInstructionDismiss = false;
  animationFrameId = null;
}

function hideInstructionPopup() {
  if (!instructionPopup) return;
  instructionPopup.classList.add("hidden");
}

function showFirstRunInstructionsIfNeeded() {
  if (!shouldShowFirstRunInstructions || !instructionPopup) return false;

  instructionPopup.classList.remove("hidden");

  shouldShowFirstRunInstructions = false;

  return true;
}

function dismissInstructionsAndStart() {
  if (!waitingForInstructionDismiss) return;

  waitingForInstructionDismiss = false;
  clearTimeout(introStartTimeout);
  introStartTimeout = null;
  hideInstructionPopup();

  if (!gameRunning) return;
  startGameplayLoops();
}

function startGameplayLoops() {
  // Spawn drops
  spawnInterval = setInterval(createDrop, 850);

  // Small difficulty bump halfway through
  difficultyTimeout = setTimeout(() => {
    if (!gameRunning) return;
    clearInterval(spawnInterval);
    spawnInterval = setInterval(createDrop, 600);
  }, 15000);

  // Timer
  timerInterval = setInterval(() => {
    timeLeft--;
    updateGameUI();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  gameLoop();
}

// -----------------------------
// Start / Reset
// -----------------------------
function startGame() {
  stopLoops();
  clearDrops();

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  health = 3;
  cleanDropsCaught = 0;
  roundBucketsFilled = 0;
  moveLeft = false;
  moveRight = false;

  updateGameUI();
  updateGlobalImpactBar();
  showScreen(gameScreen);

  // Reset bucket position after game screen is visible
  const containerWidth = gameContainer.clientWidth;
  const bucketWidth = bucket.offsetWidth;
  bucketX = (containerWidth - bucketWidth) / 2;
  bucket.style.left = `${bucketX}px`;
  bucket.style.transform = "none";

  const showedInstructions = showFirstRunInstructionsIfNeeded();
  if (showedInstructions) {
    waitingForInstructionDismiss = true;
    introStartTimeout = setTimeout(() => {
      dismissInstructionsAndStart();
    }, 4000);
    return;
  }

  startGameplayLoops();
}

function goHome() {
  stopLoops();
  clearDrops();
  hideInstructionPopup();

  gameRunning = false;
  showScreen(startScreen);
  updateGlobalImpactBar();
}

// -----------------------------
// Input
// -----------------------------
document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    moveLeft = true;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    moveRight = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    moveLeft = false;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    moveRight = false;
  }
});

// -----------------------------
// Bucket movement
// -----------------------------
function moveBucket() {
  const containerWidth = gameContainer.clientWidth;
  const bucketWidth = bucket.offsetWidth;

  if (moveLeft) bucketX -= bucketSpeed;
  if (moveRight) bucketX += bucketSpeed;

  if (bucketX < 0) bucketX = 0;
  if (bucketX > containerWidth - bucketWidth) {
    bucketX = containerWidth - bucketWidth;
  }

  bucket.style.left = `${bucketX}px`;
}

// -----------------------------
// Drop creation + movement
// -----------------------------
function createDrop() {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  drop.classList.add("drop");

  const pollutedChance = timeLeft <= 15 ? 0.35 : 0.22;
  const isPolluted = Math.random() < pollutedChance;

  drop.classList.add(isPolluted ? "polluted-drop" : "clean-drop");

  const x = Math.random() * (gameContainer.clientWidth - 30);
  const y = 0;
  const speed = timeLeft <= 15
    ? Math.random() * 1.6 + 4
    : Math.random() * 1.2 + 2.8;

  drop.style.left = `${x}px`;
  drop.style.top = `${y}px`;

  gameContainer.appendChild(drop);

  drops.push({
    element: drop,
    x,
    y,
    width: 28,
    height: 38,
    speed,
    polluted: isPolluted
  });
}

function updateDrops() {
  const bucketRect = getBucketRect();

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];

    drop.y += drop.speed;
    drop.element.style.top = `${drop.y}px`;

    const dropRect = {
      left: drop.x,
      right: drop.x + drop.width,
      top: drop.y,
      bottom: drop.y + drop.height
    };

    // Collision
    if (isColliding(dropRect, bucketRect)) {
      if (drop.polluted) {
        health--;
        updateGameUI();
        showFeedback("Polluted! -1 Health");

        removeDrop(i);

        if (health <= 0) {
          endGame();
          return;
        }
      } else {
        score++;
        cleanDropsCaught++;
        updateGameUI();
        showFeedback("+1 Clean Drop");

        if (cleanDropsCaught % 10 === 0) {
          roundBucketsFilled++;
          sessionBucketsFilled++;
          updateGameUI();
          updateGlobalImpactBar();
          showFeedback("+1 Bucket Filled");
        }

        removeDrop(i);
      }

      continue;
    }

    // Missed drop
    if (drop.y > gameContainer.clientHeight) {
      removeDrop(i);
    }
  }
}

function removeDrop(index) {
  if (drops[index] && drops[index].element) {
    drops[index].element.remove();
  }
  drops.splice(index, 1);
}

// -----------------------------
// Collision
// -----------------------------
function getBucketRect() {
  const width = bucket.offsetWidth;
  const height = bucket.offsetHeight;
  const top = gameContainer.clientHeight - height - 18;

  return {
    left: bucketX,
    right: bucketX + width,
    top: top,
    bottom: top + height
  };
}

function isColliding(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

// -----------------------------
// Game loop
// -----------------------------
function gameLoop() {
  if (!gameRunning) return;

  moveBucket();
  updateDrops();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// -----------------------------
// End game
// -----------------------------
function endGame() {
  gameRunning = false;
  stopLoops();
  clearDrops();
  hideInstructionPopup();

  finalScoreDisplay.textContent = score;
  roundBucketsResult.textContent = roundBucketsFilled;
  sessionBucketsResult.textContent = sessionBucketsFilled;
  peopleHelpedResult.textContent = peopleHelped;

  if (score >= 15) {
    endMessage.textContent = "Great job helping deliver clean water!";
  } else {
    endMessage.textContent = "Nice start — play again to fill even more buckets!";
  }

  showScreen(gameOverScreen);
  updateGlobalImpactBar();
}

// -----------------------------
// Event listeners
// -----------------------------
startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
homeBtn.addEventListener("click", goHome);

if (instructionGotItBtn) {
  instructionGotItBtn.addEventListener("click", dismissInstructionsAndStart);
}

// Initial state
updateGlobalImpactBar();
showScreen(startScreen);