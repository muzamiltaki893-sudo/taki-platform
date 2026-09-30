"use strict";

/* ==================================================
   TAKI QUIZ ENGINE
   جميع إعدادات الاختبار موجودة في CONFIG
   ================================================== */

const CONFIG = {
  QUESTION_COUNT: 10,
  TEST_DURATION_SECONDS: 300,
  POINTS_PER_CORRECT: 1,

  SHUFFLE_QUESTIONS: true,
  SHUFFLE_OPTIONS: false,

  QUESTIONS_FILE: "./questions.json"
};

/* اختصارات عناصر الصفحة */

const $ = (selector) => document.querySelector(selector);

const screens = {
  welcome: $("#welcomeScreen"),
  quiz: $("#quizScreen"),
  result: $("#resultScreen")
};

/* حالة الاختبار */

let questionBank = [];
let testQuestions = [];
let questionIndex = 0;

let score = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let unansweredAnswers = 0;

let secondsLeft = CONFIG.TEST_DURATION_SECONDS;
let timerInterval = null;

let testFinished = false;
let testStartedAt = null;

let answersLog = [];

let activeSubject = "";
let activeTopic = "";

/* ==================================================
   أدوات عامة
   ================================================== */

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));

  const minutes = String(Math.floor(safe / 60))
    .padStart(2, "0");

  const remaining = String(safe % 60)
    .padStart(2, "0");

  return `${minutes}:${remaining}`;
}

function showScreen(name) {
  if (!screens[name]) return;

  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });

  screens[name].classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function setText(selector, value) {
  const element = $(selector);

  if (element) {
    element.textContent = String(value);
  }
}

/* ==================================================
   قراءة بنك الأسئلة والتحقق منه
   ================================================== */

function normalizeQuestion(item, index) {
  if (
    !item ||
    typeof item.q !== "string" ||
    typeof item.a !== "string" ||
    !Array.isArray(item.w)
  ) {
    console.warn(
      `تم تجاهل السؤال ${index + 1}: صيغة غير صحيحة.`
    );

    return null;
  }

  const question = item.q.trim();
  const answer = item.a.trim();

  const wrongOptions = item.w
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value !== answer);

  const choices = [
    ...new Set([answer, ...wrongOptions])
  ];

  if (!question || !answer || choices.length < 2) {
    console.warn(
      `تم تجاهل السؤال ${index + 1}: بيانات ناقصة.`
    );

    return null;
  }

  return {
    q: question,
    a: answer,
    choices
  };
}

async function loadQuestions() {
  const startButton = $("#startButton");

  startButton.disabled = true;
  startButton.querySelector("span").textContent =
    "جارٍ تحميل الأسئلة...";

  try {
    const response = await fetch(CONFIG.QUESTIONS_FILE, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `تعذر الوصول إلى ملف الأسئلة: HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "يجب أن يكون questions.json مصفوفة JSON."
      );
    }

    questionBank = data
      .map((item, index) => normalizeQuestion(item, index))
      .filter(Boolean);

    if (questionBank.length === 0) {
      throw new Error("لا توجد أسئلة صالحة في بنك الأسئلة.");
    }

    const availableCount = Math.min(
      CONFIG.QUESTION_COUNT,
      questionBank.length
    );

    setText("#welcomeQuestionCount", availableCount);

    setText(
      "#welcomeDuration",
      formatTime(CONFIG.TEST_DURATION_SECONDS)
    );

    const pointValue = CONFIG.POINTS_PER_CORRECT;

    $("#welcomeNote").textContent =
      `سيعرض الاختبار ${availableCount} سؤالًا، ` +
      `ولديك ${formatTime(CONFIG.TEST_DURATION_SECONDS)}. ` +
      `تحصل على ${pointValue} نقطة لكل إجابة صحيحة. ` +
      `تظهر لك صحة الإجابة بعد اختيارها.`;

    startButton.disabled = false;

    startButton.querySelector("span").textContent =
      "ابدأ الاختبار";

  } catch (error) {
    console.error("TAKI:", error);

    $("#welcomeNote").textContent =
      "تعذر تحميل بنك الأسئلة. تأكد من رفع questions.json " +
      "في المسار الصحيح ثم أعد تحميل الصفحة.";

    startButton.disabled = true;

    startButton.querySelector("span").textContent =
      "تعذر تحميل الأسئلة";
  }
}

/* ==================================================
   بدء الاختبار
   ================================================== */

function startTest() {
  if (!questionBank.length || !screens.welcome || !screens.quiz) {
    return;
  }

  clearInterval(timerInterval);
  timerInterval = null;

  activeSubject =
    $("#subjectInput").value.trim() || "اختبار عام";

  activeTopic =
    $("#topicInput").value.trim() || "موضوع متنوع";

  const orderedQuestions = CONFIG.SHUFFLE_QUESTIONS
    ? shuffle(questionBank)
    : [...questionBank];

  testQuestions = orderedQuestions.slice(
    0,
    Math.min(CONFIG.QUESTION_COUNT, questionBank.length)
  );

  questionIndex = 0;

  score = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  unansweredAnswers = 0;

  answersLog = Array(testQuestions.length).fill(null);

  testFinished = false;

  secondsLeft = CONFIG.TEST_DURATION_SECONDS;
  testStartedAt = Date.now();

  setText("#activeSubject", activeSubject);
  setText("#activeTopic", activeTopic);

  setText("#scoreText", score);
  setText("#totalQuestions", testQuestions.length);

  updateTimer();

  showScreen("quiz");

  renderQuestion();

  timerInterval = setInterval(() => {
    if (testFinished) {
      clearInterval(timerInterval);
      return;
    }

    secondsLeft = Math.max(0, secondsLeft - 1);

    updateTimer();

    if (secondsLeft <= 0) {
      finishTest(true);
    }
  }, 1000);
}

/* ==================================================
   المؤقت
   ================================================== */

function updateTimer() {
  setText("#timerText", formatTime(secondsLeft));

  $("#timerRing").classList.toggle(
    "urgent",
    secondsLeft <= 30
  );
}

/* ==================================================
   تحديث شريط التقدم
   ================================================== */

function updateProgress(completedQuestions) {
  const total = testQuestions.length;

  const percentage = total > 0
    ? (completedQuestions / total) * 100
    : 0;

  $("#progressBar").style.width = `${percentage}%`;

  $("#progressTrack").setAttribute(
    "aria-valuenow",
    String(Math.round(percentage))
  );
}

/* ==================================================
   عرض السؤال والخيارات
   ================================================== */

function renderQuestion() {
  if (testFinished) return;

  const question = testQuestions[questionIndex];

  if (!question) {
    finishTest(false);
    return;
  }

  setText("#currentQuestion", questionIndex + 1);

  setText(
    "#questionNumberBadge",
    String(questionIndex + 1).padStart(2, "0")
  );

  setText("#questionText", question.q);

  setText("#scoreText", score);

  $("#optionsList").replaceChildren();

  $("#feedbackBox").hidden = true;
  $("#feedbackBox").classList.remove("wrong-feedback");

  $("#nextButton").disabled = true;

  setText(
    "#nextButtonText",
    questionIndex === testQuestions.length - 1
      ? "عرض النتيجة"
      : "السؤال التالي"
  );

  updateProgress(questionIndex);

  const choices = CONFIG.SHUFFLE_OPTIONS
    ? shuffle(question.choices)
    : [...question.choices];

  choices.forEach((choice, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "option";

    button.setAttribute(
      "aria-label",
      `الخيار ${index + 1}: ${choice}`
    );

    const radio = document.createElement("span");
    radio.className = "option-radio";
    radio.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = choice;

    button.append(radio, text);

    button.addEventListener("click", () => {
      gradeAnswer(choice);
    });

    $("#optionsList").appendChild(button);
  });
}

/* ==================================================
   التصحيح الفوري
   ================================================== */

function gradeAnswer(selectedChoice) {
  if (
    testFinished ||
    answersLog[questionIndex] !== null
  ) {
    return;
  }

  const question = testQuestions[questionIndex];

  const isCorrect =
    selectedChoice.trim() === question.a.trim();

  answersLog[questionIndex] = {
    question: question.q,
    chosen: selectedChoice,
    correct: question.a,
    isCorrect,
    timedOut: false
  };

  if (isCorrect) {
    correctAnswers++;

    score += CONFIG.POINTS_PER_CORRECT;
  } else {
    wrongAnswers++;
  }

  setText("#scoreText", score);

  /* تعطيل جميع الخيارات بعد الاختيار */

  document.querySelectorAll(".option").forEach((button) => {
    button.disabled = true;

    const label =
      button.querySelector("span:last-child").textContent;

    if (label.trim() === question.a.trim()) {
      button.classList.add("correct");
    }

    if (
      label.trim() === selectedChoice.trim() &&
      !isCorrect
    ) {
      button.classList.add("wrong");
    }

    if (
      label.trim() === selectedChoice.trim() &&
      isCorrect
    ) {
      button.classList.add("selected");
    }
  });

  /* إظهار رسالة النتيجة */

  const feedback = $("#feedbackBox");

  feedback.hidden = false;

  feedback.classList.toggle(
    "wrong-feedback",
    !isCorrect
  );

  setText("#feedbackIcon", isCorrect ? "✓" : "×");

  setText(
    "#feedbackTitle",
    isCorrect ? "إجابة صحيحة! أحسنت" : "إجابة غير صحيحة"
  );

  setText(
    "#feedbackText",
    isCorrect
      ? "أحسنت! لقد أُضيفت نقاطك إلى نتيجة الاختبار."
      : `الإجابة الصحيحة هي: ${question.a}`
  );

  setText(
    "#feedbackPoints",
    isCorrect
      ? `+${CONFIG.POINTS_PER_CORRECT} نقطة`
      : "+0 نقطة"
  );

  $("#nextButton").disabled = false;

  updateProgress(questionIndex + 1);
}

/* ==================================================
   الانتقال إلى السؤال التالي
   ================================================== */

function nextQuestion() {
  if (
    testFinished ||
    answersLog[questionIndex] === null
  ) {
    return;
  }

  if (questionIndex >= testQuestions.length - 1) {
    finishTest(false);
    return;
  }

  questionIndex++;

  renderQuestion();
}

/* ==================================================
   إنهاء الاختبار
   ================================================== */

function finishTest(timeExpired = false) {
  if (testFinished) return;

  testFinished = true;

  clearInterval(timerInterval);
  timerInterval = null;

  /*
    كل سؤال لم يُجب عنه يسجل كسؤال دون إجابة.
    لا يمنح السؤال غير المجاب عنه أي نقاط.
  */

  testQuestions.forEach((question, index) => {
    if (answersLog[index] === null) {
      answersLog[index] = {
        question: question.q,
        chosen: null,
        correct: question.a,
        isCorrect: false,
        timedOut: Boolean(timeExpired)
      };

      unansweredAnswers++;
    }
  });

  const total = testQuestions.length;

  const percentage = total > 0
    ? Math.round((correctAnswers / total) * 100)
    : 0;

  const elapsedSeconds = testStartedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - testStartedAt) / 1000)
      )
    : 0;

  const actualElapsed = Math.min(
    CONFIG.TEST_DURATION_SECONDS,
    elapsedSeconds
  );

  /* معلومات الاختبار */

  setText("#resultSubject", activeSubject);
  setText("#resultTopic", activeTopic);

  setText("#finalScore", score);
  setText("#finalPercent", `${percentage}%`);

  setText("#correctCount", correctAnswers);
  setText("#wrongCount", wrongAnswers);
  setText("#unansweredCount", unansweredAnswers);

  setText("#resultProgressLabel", `${percentage}%`);

  $("#resultProgress").style.width = `${percentage}%`;

  /* رسالة الأداء */

  if (percentage >= 90) {
    setText("#resultHeading", "مذهل! أداء استثنائي");

    setText(
      "#resultSubtitle",
      "أظهرت مستوى مميزًا في هذا الاختبار. واصل التقدم!"
    );

  } else if (percentage >= 75) {
    setText("#resultHeading", "أداء رائع! أحسنت");

    setText(
      "#resultSubtitle",
      "نتيجة جيدة جدًا، واصل المراجعة لتعزيز معرفتك."
    );

  } else if (percentage >= 50) {
    setText("#resultHeading", "تقدم جيد، واصل التعلم");

    setText(
      "#resultSubtitle",
      "راجع الأسئلة التي أخطأت فيها، وستتمكن من التحسن."
    );

  } else {
    setText("#resultHeading", "كل محاولة فرصة للتعلم");

    setText(
      "#resultSubtitle",
      "لا تتوقف! راجع الإجابات وحاول مرة أخرى."
    );
  }

  /* إنشاء بطاقات تحليل الأداء */

  const insights = [
    {
      label: "الوقت المستغرق",
      value: formatTime(actualElapsed),
      detail: `من أصل ${formatTime(CONFIG.TEST_DURATION_SECONDS)}`
    },
    {
      label: "النقاط المحققة",
      value: `${score} / ${total * CONFIG.POINTS_PER_CORRECT}`,
      detail: "نقطة لكل إجابة صحيحة"
    },
    {
      label: "معدل الإجابة",
      value: `${total - unansweredAnswers} / ${total}`,
      detail: "الأسئلة التي تمت الإجابة عنها"
    }
  ];

  const insightsContainer = $("#analysisInsights");
  insightsContainer.replaceChildren();

  insights.forEach((insight) => {
    const card = document.createElement("div");
    card.className = "insight-card";

    const value = document.createElement("strong");
    value.textContent = insight.value;

    const label = document.createElement("span");
    label.textContent = insight.label;

    const detail = document.createElement("small");
    detail.textContent = insight.detail;

    card.append(value, label, detail);

    insightsContainer.appendChild(card);
  });

  renderAnswerReview();

  updateProgress(total);

  showScreen("result");
}

/* ==================================================
   مراجعة جميع الإجابات
   ================================================== */

function renderAnswerReview() {
  const container = $("#answerReview");

  container.replaceChildren();

  answersLog.forEach((answer, index) => {
    const article = document.createElement("article");

    let statusClass = "review-unanswered";
    let statusText = "دون إجابة";

    if (answer.isCorrect) {
      statusClass = "review-correct";
      statusText = `صحيحة +${CONFIG.POINTS_PER_CORRECT} نقطة`;
    } else if (answer.chosen !== null) {
      statusClass = "review-wrong";
      statusText = "إجابة خاطئة";
    }

    article.className = `review-item ${statusClass}`;

    const top = document.createElement("div");
    top.className = "review-item-top";

    const number = document.createElement("span");
    number.className = "review-number";
    number.textContent = `السؤال ${index + 1}`;

    const status = document.createElement("span");
    status.className = "review-status";
    status.textContent = statusText;

    top.append(number, status);

    const question = document.createElement("h3");
    question.textContent = answer.question;

    const yourAnswer = document.createElement("p");
    yourAnswer.className = "review-answer";

    const yourLabel = document.createElement("strong");
    yourLabel.textContent = "إجابتك: ";

    yourAnswer.append(
      yourLabel,
      document.createTextNode(
        answer.chosen === null
          ? "لم تختر إجابة"
          : answer.chosen
      )
    );

    const correctAnswer = document.createElement("p");
    correctAnswer.className = "review-correct-answer";

    const correctLabel = document.createElement("strong");
    correctLabel.textContent = "الإجابة الصحيحة: ";

    correctAnswer.append(
      correctLabel,
      document.createTextNode(answer.correct)
    );

    article.append(
      top,
      question,
      yourAnswer,
      correctAnswer
    );

    container.appendChild(article);
  });
}

/* ==================================================
   إعادة الاختبار والعودة للرئيسية
   ================================================== */

function returnHome() {
  clearInterval(timerInterval);
  timerInterval = null;

  testFinished = true;

  const dialog = $("#quitDialog");

  if (dialog.open) {
    dialog.close();
  }

  showScreen("welcome");
}

/* ==================================================
   نافذة تأكيد إنهاء الاختبار
   ================================================== */

function openQuitDialog() {
  if (testFinished) return;

  const dialog = $("#quitDialog");

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    const shouldQuit = window.confirm(
      "هل تريد إنهاء الاختبار وعرض نتيجتك الحالية؟"
    );

    if (shouldQuit) {
      finishTest(false);
    }
  }
}

function cancelQuitDialog() {
  const dialog = $("#quitDialog");

  if (dialog.open) {
    dialog.close();
  }
}

function confirmQuit() {
  cancelQuitDialog();
  finishTest(false);
}

/* ==================================================
   ربط الأزرار
   ================================================== */

$("#startButton").addEventListener("click", startTest);

$("#nextButton").addEventListener("click", nextQuestion);

$("#retryButton").addEventListener("click", startTest);

$("#homeButton").addEventListener("click", returnHome);

$("#quitButton").addEventListener("click", openQuitDialog);

$("#cancelQuitButton").addEventListener(
  "click",
  cancelQuitDialog
);

$("#confirmQuitButton").addEventListener(
  "click",
  confirmQuit
);

/* ==================================================
   بدء تشغيل المنصة
   ================================================== */

loadQuestions();
