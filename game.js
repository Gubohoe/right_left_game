// game.js

const URL = "https://teachablemachine.withgoogle.com/models/ABvzsBmsG/";
let model, webcam, ctx, labelContainer, maxPredictions;
let currentCategory = "";
let score = 0;
let gameStarted = false;

const scoreElement = document.getElementById("score");
const imageElement = document.getElementById("image");
const webcamCanvas = document.getElementById("webcam-canvas"); // 웹캠 화면을 그릴 캔버스 추가
const startButton = document.getElementById("start-button");

// nextImage 함수 수정
let nextImageTimer; // 타이머 변수 추가

function nextImage() {
    currentCategory = getRandomCategory();
    const imagePath = `Object/${currentCategory}/${currentCategory}${Math.floor(Math.random() * 8) + 1}.png`;
    imageElement.src = imagePath;

    // 현재 카테고리를 화면에 업데이트
   // document.getElementById("current-category").textContent = currentCategory;

    // 1초 후에 점수 추가를 허용
    clearTimeout(nextImageTimer); // 이전 타이머 제거
    nextImageTimer = setTimeout(() => {
        canAddScore = true; // 0.1초 후에 점수 추가 가능하도록 설정
    }, 1000);
}

let canAddScore = true; // 점수 추가 가능 여부를 나타내는 변수 추가

// assignScore 함수 수정
async function assignScore(predictedCategory) {
    if (!canAddScore) {
        return; // 1초 동안 점수 추가가 허용되지 않도록 처리
    }

    if (predictedCategory == currentCategory) {
        score += 1; // 랜덤 이미지와 포즈가 일치하면 1점 추가
        scoreElement.textContent = score; // 현재 점수를 화면에 업데이트
        nextImage(); // 다음 랜덤 이미지로 이동
        canAddScore = false; // 점수 추가를 잠시 금지
    } else {
        return;
    }
}


// 게임 종료 시 호출하는 함수
function endGame() {
    gameStarted = false;
    startButton.disabled = false;
    alert("Game Over! Your Score: " + score);
}


async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    
    // 예측 결과에서 가장 확률이 높은 클래스를 찾는 코드
    let predictedCategory = "";
    let highestProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            predictedCategory = prediction[i].className;
        }
    }


    assignScore(predictedCategory);

    drawPose(pose);
}

function drawPose(pose) {
    if (webcamCanvas) {
        const webcamCtx = webcamCanvas.getContext("2d");
        webcamCtx.drawImage(webcam.canvas, 0, 0);
    }

    if (ctx) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

function getRandomCategory() {
    return Math.random() < 0.5 ? "right" : "left";
}

// 게임에 사용할 변수들
let gameDuration = 15; // 게임 지속 시간 (초)
let remainingTime = gameDuration; // 남은 시간 초기화
let timerInterval; // 시간 감소를 위한 타이머 변수

// 게임 시작 함수
function startGame() {
    gameStarted = true;
    startButton.disabled = true;
    score = 0;
    scoreElement.textContent = score;
    remainingTime = gameDuration; // 게임 시작 시 남은 시간 초기화
    updateRemainingTime(); // 남은 시간 표시 업데이트
    nextImage();

    // 게임 종료 타이머 설정
    timerInterval = setInterval(function () {
        remainingTime--;
        updateRemainingTime();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// 남은 시간 표시 업데이트 함수
function updateRemainingTime() {
    document.getElementById("remaining-time").textContent = remainingTime;
}


startButton.addEventListener("click", () => {
    if (!gameStarted) {
        startGame();
    }
});

init();
