// ============================== 數學大挑戰 ==============================
// 本檔案可直接貼入 p5.js Web Editor 的 sketch.js。
// 程式不依賴外部圖片、CSS、JavaScript、網路或其他檔案。

// ------------------------------ 固定設定 ------------------------------
const FONT_FAMILY = "Noto Sans TC, Microsoft JhengHei, sans-serif"; // 設定繁體中文優先字體。
const TOTAL_QUESTIONS = 8; // 設定測驗總題數。
const START_STATE = "start"; // 設定開始畫面的狀態名稱。
const QUIZ_STATE = "quiz"; // 設定作答畫面的狀態名稱。
const RESULT_STATE = "result"; // 設定成績畫面的狀態名稱。

const BG_COLOR = "#F7F8F6"; // 設定整體背景色。
const WHITE_COLOR = "#FFFFFF"; // 設定白色。
const TEXT_COLOR = "#202124"; // 設定主要文字色。
const MUTED_COLOR = "#6B7280"; // 設定次要文字色。
const RED_COLOR = "#C1121F"; // 設定主要紅色。
const RED_LIGHT_COLOR = "#FDE8E8"; // 設定答錯淡紅色。
const GREEN_COLOR = "#5E9F4D"; // 設定答對綠色。
const GREEN_LIGHT_COLOR = "#E7F5E3"; // 設定答對淡綠色。
const YELLOW_COLOR = "#F3C969"; // 設定黃色裝飾色。
const BLUE_LIGHT_COLOR = "#DCEFF5"; // 設定淡藍色裝飾色。
const BORDER_COLOR = "#E5E7EB"; // 設定邊框色。

// ------------------------------ 題目資料 ------------------------------
const questions = [
  { question: "356 + 278 = ?", options: ["635", "634", "632", "644"], answer: "634", explanation: "個位數相加超過 9，要進位。" },
  { question: "825 - 467 = ?", options: ["358", "348", "359", "357"], answer: "358", explanation: "個位數不夠減，要向十位借位。" },
  { question: "36 × 7 = ?", options: ["232", "242", "252", "262"], answer: "252", explanation: "7 乘以 6 得 42，要進位。" },
  { question: "648 ÷ 8 = ?", options: ["91", "71", "61", "81"], answer: "81", explanation: "8 × 81 = 648。" },
  { question: "125 + 36 × 4 = ?", options: ["259", "249", "269", "279"], answer: "269", explanation: "先乘除後加減：36 × 4 = 144，再加 125。" },
  { question: "(240 - 120) ÷ 6 + 35 = ?", options: ["56", "55", "54", "53"], answer: "55", explanation: "先算括號，再除法，最後加法。" },
  { question: "72 ÷ 8 + 6 × 3 = ?", options: ["27", "24", "30", "21"], answer: "27", explanation: "先做除法與乘法：72 ÷ 8 = 9、6 × 3 = 18，最後 9 + 18 = 27。" },
  { question: "450 - 125 + 36 = ?", options: ["361", "371", "381", "391"], answer: "361", explanation: "加減同級，依照由左到右計算：450 - 125 = 325，再加 36 = 361。" }
];

// ------------------------------ 遊戲狀態 ------------------------------
let appState = START_STATE; // 儲存目前畫面狀態，刻意不使用 screen 避免與瀏覽器全域名稱衝突。
let quizQuestions = []; // 儲存本次測驗專用的題目副本，避免修改原始題庫。
let questionIndex = 0; // 儲存目前題目的索引。
let selectedIndex = -1; // 儲存使用者選擇的選項索引。
let score = 0; // 儲存目前答對題數。
let answered = false; // 記錄目前題目是否已作答。
let pointerX = -1; // 儲存最後一次滑鼠或觸控的畫布 X 座標。
let pointerY = -1; // 儲存最後一次滑鼠或觸控的畫布 Y 座標。
let pressedUntil = 0; // 儲存按鈕 pressed 視覺效果的結束時間。
let lastInputTime = -1000; // 儲存最近一次輸入時間，避免觸控重複觸發滑鼠事件。
let audioContext = null; // 儲存可選用的 Web Audio 音效環境。

// ------------------------------ p5.js 生命週期 ------------------------------
function setup() {
  // 建立全螢幕畫布，確保 setup 一定會先完成基本畫面初始化。
  const canvasRenderer = createCanvas(windowWidth, windowHeight);

  // 設定畫布的觸控與文字選取行為，不讓瀏覽器手勢搶走操作。
  if (canvasRenderer && canvasRenderer.elt) {
    canvasRenderer.elt.style.touchAction = "none";
    canvasRenderer.elt.style.userSelect = "none";
    canvasRenderer.elt.setAttribute("aria-label", "數學大挑戰八題數學選擇題測驗");
  }

  // 設定所有繪圖函式共用的基本文字與矩形模式。
  textFont(FONT_FAMILY);
  textAlign(CENTER, CENTER);
  rectMode(CORNER);
  noStroke();

  // 將初始指標放到畫布外，避免一開始誤觸 hover 狀態。
  pointerX = -1;
  pointerY = -1;

  // 新舊版本 p5.js 都能安全執行：有 describe 才呼叫它。
  if (typeof describe === "function") {
    describe("數學大挑戰，八題四選一數學測驗");
  }
}

function draw() {
  // 每一幀先清除畫面，確保不會殘留上一個狀態的圖形。
  background(BG_COLOR);

  // 根據目前狀態繪製其中一個畫面，避免同時繪製多個畫面。
  if (appState === START_STATE) {
    drawStartScreen();
  } else if (appState === QUIZ_STATE) {
    drawQuizScreen();
  } else if (appState === RESULT_STATE) {
    drawResultScreen();
  } else {
    // 若狀態意外失效，回到可顯示的開始畫面而不是讓畫面停止。
    appState = START_STATE;
    drawStartScreen();
  }
}

function windowResized() {
  // 視窗大小改變時重新調整畫布，維持全螢幕響應式效果。
  resizeCanvas(max(1, windowWidth), max(1, windowHeight));
}

// ------------------------------ 版面計算 ------------------------------
function getLayout() {
  // 依畫布寬度判斷手機或桌面版面。
  const narrow = width < 520;
  const margin = constrain(width * 0.07, 18, 56);
  const contentWidth = max(240, min(width - margin * 2, 720));
  const centerX = width / 2;
  const smallText = narrow ? 15 : 18;
  const bodyText = narrow ? 16 : 19;
  const buttonWidth = min(contentWidth * 0.62, 270);
  const buttonHeight = narrow ? 52 : 60;
  const top = narrow ? 28 : 36;
  const decorationY = top + 42;
  const decorationHeight = narrow ? 82 : 100;
  const questionY = decorationY + decorationHeight + (narrow ? 38 : 50);
  const optionHeight = narrow ? 52 : 60;
  const optionGap = narrow ? 12 : 15;
  const optionTop = questionY + (narrow ? 55 : 72);
  const optionAreas = [];

  // 用同一批資料同時繪製與判定四個選項，避免 hover 或點擊座標錯位。
  for (let i = 0; i < 4; i += 1) {
    optionAreas.push({
      x: centerX - contentWidth / 2,
      y: optionTop + i * (optionHeight + optionGap),
      width: contentWidth,
      height: optionHeight,
      radius: 14,
      textSize: narrow ? 18 : 22
    });
  }

  // 計算回饋區域與下一題按鈕位置。
  const feedbackY = optionTop + 4 * (optionHeight + optionGap) + (narrow ? 24 : 32);
  const answerY = feedbackY + (narrow ? 30 : 38);
  const explanationY = answerY + (narrow ? 28 : 36);
  const nextY = max(12, min(height - buttonHeight - 24, explanationY + (narrow ? 58 : 76)));
  const startY = max(12, min(height * 0.69, height - buttonHeight - 24));
  const resultTitleY = height * (narrow ? 0.20 : 0.24);
  const visualY = height * (narrow ? 0.52 : 0.53);
  const visualSize = narrow ? 132 : 164;
  const restartY = max(12, min(height - buttonHeight - 24, visualY + visualSize / 2 + (narrow ? 58 : 70)));

  // 回傳所有畫面需要的幾何資料。
  return {
    narrow,
    centerX,
    contentWidth,
    smallText,
    bodyText,
    decorationY,
    decorationHeight,
    questionY,
    optionAreas,
    feedbackY,
    answerY,
    explanationY,
    resultTitleY,
    visualY,
    visualSize,
    startButton: makeButton(centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, narrow),
    nextButton: makeButton(centerX - buttonWidth / 2, nextY, buttonWidth, buttonHeight, narrow),
    restartButton: makeButton(centerX - buttonWidth / 2, restartY, buttonWidth, buttonHeight, narrow)
  };
}

function makeButton(x, y, widthValue, heightValue, narrow) {
  // 建立繪製與點擊共用的固定按鈕資料。
  return {
    x,
    y,
    width: widthValue,
    height: heightValue,
    radius: 18,
    textSize: narrow ? 18 : 21
  };
}

// ------------------------------ 開始畫面 ------------------------------
function drawStartScreen() {
  // 取得目前畫布尺寸下的響應式版面。
  const layout = getLayout();
  const titleY = layout.startButton.y - (layout.narrow ? 125 : 142);
  const descriptionY = layout.startButton.y - (layout.narrow ? 68 : 76);

  // 繪製開始畫面的柔和數學裝飾。
  drawSoftDecoration(layout.centerX, layout.startButton.y - (layout.narrow ? 190 : 220), layout.contentWidth);

  // 繪製主標題。
  fill(TEXT_COLOR);
  textStyle(BOLD);
  textSize(layout.narrow ? 34 : 48);
  text("數學大挑戰", layout.centerX, titleY);

  // 繪製開始畫面的說明文字。
  textStyle(NORMAL);
  fill(MUTED_COLOR);
  textSize(layout.bodyText);
  drawWrappedText("一起挑戰 8 題數學選擇題，看看你能答對幾題！", layout.centerX, descriptionY, layout.contentWidth * 0.88, layout.bodyText * 1.65);

  // 繪製開始按鈕。
  drawButton("開始", layout.startButton);
}

function drawSoftDecoration(centerX, y, decorationWidth) {
  // 繪製開始畫面上的三個柔和圓點。
  fill(BLUE_LIGHT_COLOR);
  circle(centerX - decorationWidth * 0.34, y, 26);
  fill(YELLOW_COLOR);
  circle(centerX, y - 10, 34);
  fill(GREEN_LIGHT_COLOR);
  circle(centerX + decorationWidth * 0.34, y, 26);

  // 在圓點上繪製簡潔數學符號。
  fill(RED_COLOR);
  textStyle(BOLD);
  textSize(22);
  text("＋", centerX - decorationWidth * 0.34, y);
  fill(TEXT_COLOR);
  text("÷", centerX, y - 10);
  text("＝", centerX + decorationWidth * 0.34, y);
  textStyle(NORMAL);
}

// ------------------------------ 作答畫面 ------------------------------
function drawQuizScreen() {
  // 取得版面並保護題目索引，避免資料不存在造成繪圖停止。
  const layout = getLayout();
  const activeQuestions = quizQuestions.length === TOTAL_QUESTIONS ? quizQuestions : questions;
  const safeIndex = constrain(questionIndex, 0, activeQuestions.length - 1);
  const currentQuestion = activeQuestions[safeIndex];

  // 顯示目前題數。
  fill(MUTED_COLOR);
  textStyle(BOLD);
  textSize(layout.smallText);
  text(`第 ${safeIndex + 1} / ${TOTAL_QUESTIONS} 題`, layout.centerX, layout.narrow ? 28 : 36);
  textStyle(NORMAL);

  // 繪製進度條與數學裝飾。
  drawProgressBar(layout, safeIndex / TOTAL_QUESTIONS);
  drawMathDecoration(layout.centerX, layout.decorationY, layout.contentWidth, layout.decorationHeight);

  // 繪製題目文字。
  fill(TEXT_COLOR);
  textStyle(BOLD);
  textSize(layout.narrow ? 28 : 38);
  drawWrappedText(currentQuestion.question, layout.centerX, layout.questionY, layout.contentWidth * 0.9, (layout.narrow ? 28 : 38) * 1.35);
  textStyle(NORMAL);

  // 繪製四個選項。
  drawOptions(layout, currentQuestion);

  // 作答後才繪製結果回饋與下一題按鈕。
  if (answered) {
    drawFeedback(layout, currentQuestion);
  }
}

function drawProgressBar(layout, progress) {
  // 繪製進度條背景。
  noStroke();
  fill(BORDER_COLOR);
  drawRoundedRect(layout.centerX - layout.contentWidth / 2, layout.narrow ? 46 : 54, layout.contentWidth, 7, 4);

  // 繪製目前的完成進度。
  fill(YELLOW_COLOR);
  drawRoundedRect(layout.centerX - layout.contentWidth / 2, layout.narrow ? 46 : 54, layout.contentWidth * constrain(progress, 0, 1), 7, 4);
}

function drawMathDecoration(centerX, y, decorationWidth, decorationHeight) {
  // 繪製白色裝飾卡片。
  fill(WHITE_COLOR);
  drawRoundedRect(centerX - decorationWidth / 2, y, decorationWidth, decorationHeight, 20);

  // 繪製兩個彩色圓形。
  fill(BLUE_LIGHT_COLOR);
  circle(centerX - decorationWidth * 0.31, y + decorationHeight * 0.48, decorationHeight * 0.56);
  fill(YELLOW_COLOR);
  circle(centerX + decorationWidth * 0.31, y + decorationHeight * 0.48, decorationHeight * 0.56);

  // 繪製數學符號。
  textStyle(BOLD);
  textSize(decorationHeight * 0.38);
  fill(RED_COLOR);
  text("＋", centerX - decorationWidth * 0.31, y + decorationHeight * 0.47);
  fill(GREEN_COLOR);
  text("＝", centerX, y + decorationHeight * 0.47);
  fill(TEXT_COLOR);
  text("×", centerX + decorationWidth * 0.31, y + decorationHeight * 0.47);
  textStyle(NORMAL);
}

function drawOptions(layout, currentQuestion) {
  // 逐一繪製四個選項，hover 只改變顏色，不改變位置或大小。
  for (let i = 0; i < currentQuestion.options.length; i += 1) {
    const area = layout.optionAreas[i];
    const isCorrectOption = currentQuestion.options[i] === currentQuestion.answer;
    const isWrongChoice = answered && i === selectedIndex && !isCorrectOption;
    const isHovering = !answered && isInside(area);
    let backgroundColor = WHITE_COLOR;
    let borderColor = BORDER_COLOR;
    let optionTextColor = TEXT_COLOR;

    // 作答後標示正確答案與使用者答錯的選項。
    if (answered && isCorrectOption) {
      backgroundColor = GREEN_LIGHT_COLOR;
      borderColor = GREEN_COLOR;
    } else if (isWrongChoice) {
      backgroundColor = RED_LIGHT_COLOR;
      borderColor = RED_COLOR;
      optionTextColor = RED_COLOR;
    } else if (isHovering) {
      backgroundColor = mixColors(WHITE_COLOR, YELLOW_COLOR, 0.12);
    }

    // 繪製選項固定矩形與外框。
    fill(backgroundColor);
    stroke(borderColor);
    strokeWeight(isHovering ? 2.5 : 1.5);
    drawRoundedRect(area.x, area.y, area.width, area.height, area.radius);
    noStroke();

    // 繪製選項文字。
    fill(optionTextColor);
    textStyle(BOLD);
    textSize(area.textSize);
    text(`${i + 1}. ${currentQuestion.options[i]}`, area.x + area.width / 2, area.y + area.height / 2);
    textStyle(NORMAL);
  }
}

function drawFeedback(layout, currentQuestion) {
  // 判斷答案並選擇答對或答錯的顏色。
  const answerIsCorrect = currentQuestion.options[selectedIndex] === currentQuestion.answer;
  const feedbackColor = answerIsCorrect ? GREEN_COLOR : RED_COLOR;

  // 繪製答對或答錯標題。
  fill(feedbackColor);
  textStyle(BOLD);
  textSize(layout.narrow ? 24 : 30);
  text(answerIsCorrect ? "答對！" : "答錯！", layout.centerX, layout.feedbackY);
  textStyle(NORMAL);

  // 繪製正確答案。
  fill(TEXT_COLOR);
  textSize(layout.smallText);
  drawWrappedText(`正確答案：${currentQuestion.answer}`, layout.centerX, layout.answerY, layout.contentWidth * 0.9, layout.smallText * 1.55);

  // 繪製解說，並將解說限制在下一題按鈕上方。
  fill(MUTED_COLOR);
  const safeExplanationY = min(layout.explanationY, layout.nextButton.y - (layout.narrow ? 48 : 60));
  drawWrappedText(`解說：${currentQuestion.explanation}`, layout.centerX, safeExplanationY, layout.contentWidth * 0.88, layout.smallText * 1.55);

  // 繪製下一題按鈕。
  drawButton("下一題", layout.nextButton);
}

// ------------------------------ 成績畫面 ------------------------------
function drawResultScreen() {
  // 取得成績畫面的響應式版面。
  const layout = getLayout();
  const safeScore = constrain(score, 0, TOTAL_QUESTIONS);
  const progress = safeScore / TOTAL_QUESTIONS;

  // 顯示答對題數。
  fill(TEXT_COLOR);
  textStyle(BOLD);
  textSize(layout.narrow ? 28 : 40);
  text(`答對了 ${safeScore} / ${TOTAL_QUESTIONS} 題`, layout.centerX, layout.resultTitleY);
  textStyle(NORMAL);

  // 顯示依成績變化的鼓勵文字。
  fill(MUTED_COLOR);
  textSize(layout.bodyText);
  drawWrappedText(getEncouragement(safeScore), layout.centerX, layout.resultTitleY + (layout.narrow ? 56 : 70), layout.contentWidth * 0.9, layout.bodyText * 1.65);

  // 繪製圓形成績視覺化與重新開始按鈕。
  drawScoreVisual(layout, progress);
  drawButton("再玩一次？", layout.restartButton);
}

function drawScoreVisual(layout, progress) {
  // 繪製圓形進度背景。
  noFill();
  stroke(BORDER_COLOR);
  strokeWeight(12);
  arc(layout.centerX, layout.visualY, layout.visualSize, layout.visualSize, -HALF_PI, TWO_PI - HALF_PI);

  // 繪製代表答對比例的彩色圓弧。
  stroke(GREEN_COLOR);
  arc(layout.centerX, layout.visualY, layout.visualSize, layout.visualSize, -HALF_PI, -HALF_PI + TWO_PI * constrain(progress, 0, 1));
  noStroke();

  // 繪製百分比。
  fill(TEXT_COLOR);
  textStyle(BOLD);
  textSize(layout.narrow ? 24 : 30);
  text(`${Math.round(progress * 100)}%`, layout.centerX, layout.visualY);
  textStyle(NORMAL);
}

function getEncouragement(value) {
  // 依照分數回傳不同的鼓勵文字。
  if (value === TOTAL_QUESTIONS) {
    return "太厲害了！你是數學小天才！";
  }
  if (value >= 6) {
    return "表現非常棒！再挑戰一次，向滿分前進！";
  }
  if (value >= 3) {
    return "做得不錯！多練習幾次，你會越來越進步！";
  }
  return "別灰心！仔細看解說，再玩一次就會更熟悉！";
}

// ------------------------------ 共用繪圖函式 ------------------------------
function drawButton(label, button) {
  // hover 與 pressed 只改顏色，絕不改動按鈕幾何資料，因此按鈕不會消失。
  const hovering = isInside(button);
  const pressed = hovering && millis() < pressedUntil;
  const buttonColor = pressed ? mixColors(RED_COLOR, TEXT_COLOR, 0.16) : hovering ? mixColors(RED_COLOR, TEXT_COLOR, 0.10) : RED_COLOR;

  // 保存繪圖狀態，避免按鈕樣式影響其他圖形。
  push();
  fill(buttonColor);
  stroke(RED_COLOR);
  strokeWeight(1.5);
  drawRoundedRect(button.x, button.y, button.width, button.height, button.radius);
  noStroke();
  fill(WHITE_COLOR);
  textStyle(BOLD);
  textSize(button.textSize);
  text(label, button.x + button.width / 2, button.y + button.height / 2);
  pop();
}

function drawRoundedRect(x, y, widthValue, heightValue, radius) {
  // 使用 p5.js 原生 rect 繪製圓角矩形，避免依賴外部函式。
  rect(x, y, widthValue, heightValue, radius);
}

function drawWrappedText(content, centerX, centerY, maxWidth, lineHeight) {
  // 先依畫布文字寬度換行，再以整段文字的中心垂直排列。
  const lines = getWrappedLines(String(content), maxWidth);
  const firstLineY = centerY - (lines.length * lineHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i += 1) {
    text(lines[i], centerX, firstLineY + i * lineHeight);
  }
}

function getWrappedLines(content, maxWidth) {
  // 以字元為單位換行，適合繁體中文與數學符號。
  const lines = [];
  let currentLine = "";
  const characters = Array.from(content);

  for (let i = 0; i < characters.length; i += 1) {
    const testLine = currentLine + characters[i];
    if (currentLine.length > 0 && textWidth(testLine) > maxWidth) {
      lines.push(currentLine);
      currentLine = characters[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}

function mixColors(firstColor, secondColor, amount) {
  // 使用 p5.js 的顏色混合功能建立穩定 hover 顏色。
  return lerpColor(color(firstColor), color(secondColor), constrain(amount, 0, 1));
}

// ------------------------------ 滑鼠與觸控 ------------------------------
function mouseMoved(event) {
  // 只更新指標位置，不在 hover 時改動任何按鈕資料。
  const point = getPointerPosition(event);
  pointerX = point.x;
  pointerY = point.y;
}

function mouseOut() {
  // 滑鼠離開畫布時清除 hover。
  pointerX = -1;
  pointerY = -1;
}

function mousePressed(event) {
  // 將滑鼠座標交給統一輸入流程。
  const point = getPointerPosition(event);
  handleInput(point.x, point.y, "mouse");
}

function touchStarted(event) {
  // 將觸控座標交給同一套輸入流程，確保手機與滑鼠行為一致。
  const point = getPointerPosition(event);
  handleInput(point.x, point.y, "touch");
}

function getPointerPosition(event) {
  // 先嘗試讀取觸控事件中的第一個觸控點。
  let clientX = null;
  let clientY = null;
  const touchList = event && (event.changedTouches || event.touches);

  if (touchList && touchList.length > 0) {
    clientX = Number(touchList[0].clientX);
    clientY = Number(touchList[0].clientY);
  } else if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    // 沒有觸控點時讀取滑鼠事件座標。
    clientX = Number(event.clientX);
    clientY = Number(event.clientY);
  }

  // 如果事件沒有瀏覽器座標，使用 p5.js 提供的滑鼠座標作為備援。
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return {
      x: Number.isFinite(mouseX) ? mouseX : -1,
      y: Number.isFinite(mouseY) ? mouseY : -1
    };
  }

  // 取得目前畫布元素，支援畫布被 CSS 縮放的情況。
  const canvasElement = document.querySelector("canvas");
  if (!canvasElement) {
    return { x: constrain(clientX, 0, width), y: constrain(clientY, 0, height) };
  }

  const bounds = canvasElement.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return { x: constrain(clientX, 0, width), y: constrain(clientY, 0, height) };
  }

  // 將瀏覽器座標換算成 p5.js 畫布座標。
  const scaleX = width / bounds.width;
  const scaleY = height / bounds.height;
  return {
    x: constrain((clientX - bounds.left) * scaleX, 0, width),
    y: constrain((clientY - bounds.top) * scaleY, 0, height)
  };
}

function handleInput(x, y, source) {
  // 忽略觸控後約 250 毫秒內產生的重複滑鼠事件。
  const now = millis();
  if (source !== "keyboard" && now - lastInputTime < 250) {
    return;
  }

  // 更新輸入狀態與 pressed 視覺效果。
  lastInputTime = now;
  pointerX = x;
  pointerY = y;
  pressedUntil = now + 140;

  // 依畫面狀態處理點擊。
  if (appState === START_STATE) {
    handleStartInput();
  } else if (appState === QUIZ_STATE) {
    handleQuizInput();
  } else if (appState === RESULT_STATE) {
    handleResultInput();
  }
}

function isInside(area, x = pointerX, y = pointerY) {
  // 使用繪製本身的矩形作為唯一命中範圍，避免 hover 與點擊座標不一致。
  return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
}

// ------------------------------ 測驗流程 ------------------------------
function handleStartInput() {
  // 點擊開始按鈕後初始化並進入第一題。
  const layout = getLayout();
  if (isInside(layout.startButton)) {
    startQuiz();
    playSound(true);
  }
}

function handleQuizInput() {
  // 作答後只接受下一題按鈕，防止同一題重複計分。
  const layout = getLayout();
  if (answered) {
    if (isInside(layout.nextButton)) {
      goToNextQuestion();
    }
    return;
  }

  // 尚未作答時檢查四個選項。
  for (let i = 0; i < layout.optionAreas.length; i += 1) {
    if (isInside(layout.optionAreas[i])) {
      chooseAnswer(i);
      return;
    }
  }
}

function handleResultInput() {
  // 點擊再玩一次後回到乾淨的開始狀態。
  const layout = getLayout();
  if (isInside(layout.restartButton)) {
    resetQuiz();
    playSound(true);
  }
}

function createQuizQuestions() {
  // 複製每一題的資料與選項，確保原始題庫永遠不會被 shuffle() 改動。
  return questions.map((question) => {
    const questionCopy = {
      ...question,
      options: shuffle([...question.options])
    };
    return questionCopy;
  });
}

function startQuiz() {
  // 開始新一輪測驗時才建立副本並重新打亂每題選項。
  quizQuestions = createQuizQuestions();
  appState = QUIZ_STATE;
  questionIndex = 0;
  selectedIndex = -1;
  score = 0;
  answered = false;
}

function resetQuiz() {
  // 清除所有答題資料並回到開始畫面。
  appState = START_STATE;
  questionIndex = 0;
  selectedIndex = -1;
  score = 0;
  answered = false;
}

function chooseAnswer(index) {
  // 只接受有效的選項索引，避免未定義資料造成錯誤。
  const currentQuestion = quizQuestions[questionIndex];
  if (!currentQuestion || index < 0 || index >= currentQuestion.options.length || answered) {
    return;
  }

  // 記錄選項並鎖定本題。
  selectedIndex = index;
  answered = true;
  const answerIsCorrect = currentQuestion.options[index] === currentQuestion.answer;
  if (answerIsCorrect) {
    score += 1;
  }

  // 答題後播放安全的簡單音效。
  playSound(answerIsCorrect);
}

function goToNextQuestion() {
  // 最後一題完成後切換成績頁。
  if (questionIndex >= TOTAL_QUESTIONS - 1) {
    appState = RESULT_STATE;
    return;
  }

  // 其他情況切換到下一題並清除上一題狀態。
  questionIndex += 1;
  selectedIndex = -1;
  answered = false;
}

// ------------------------------ 簡單音效 ------------------------------
function playSound(correct) {
  // 音效完全可選，任何瀏覽器音效限制都不應影響測驗畫面。
  try {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) {
      return;
    }

    // 第一次使用時才建立音效環境，符合瀏覽器使用者操作限制。
    if (!audioContext) {
      audioContext = new AudioClass();
    }
    if (audioContext.state === "suspended" && typeof audioContext.resume === "function") {
      audioContext.resume().catch(() => {});
    }

    // 建立振盪器與音量控制器。
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(correct ? 660 : 220, now);
    oscillator.frequency.exponentialRampToValueAtTime(correct ? 880 : 150, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.23);
  } catch (error) {
    // 音效失敗時靜默停用，不讓例外中斷 draw 或互動流程。
    audioContext = null;
  }
}
