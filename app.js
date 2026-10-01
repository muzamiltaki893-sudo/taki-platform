
"use strict";

/* =========================================================
   1. إعدادات منصة تكي
   ========================================================= */

const CONFIG = {
  POINTS_PER_CORRECT: 1,
  SHUFFLE_QUESTIONS: true,
  SHUFFLE_OPTIONS: true,

  STUDENTS_FILE: "./students.json",

  SECTIONS: [
    {
      id: 1,
      name: "القسم الأول",
      subtitle: "الأساسيات والانطلاقة",
      questionCount: 10,
      durationMinutes: 5,
      accent: "#43cfff",
      icon: "✦",
      materials: [
        {
          id: 1,
          name: "مبادئ المادة الأولى",
          description: "تدرّب على المفاهيم الأساسية.",
          file: "./questions.json",
          icon: "▤"
        }
      ]
    },
    {
      id: 2,
      name: "القسم الثاني",
      subtitle: "التعلّم والتطبيق",
      questionCount: 15,
      durationMinutes: 8,
      accent: "#a795ff",
      icon: "◈",
      materials: [
        {
          id: 2,
          name: "المادة الثانية",
          description: "اختبار تدريبي للمادة الثانية.",
          file: "./questions-02.json",
          icon: "⌘"
        },
        {
          id: 3,
          name: "المادة الثالثة",
          description: "اختبار تدريبي للمادة الثالثة.",
          file: "./questions-03.json",
          icon: "◇"
        }
      ]
    },
    {
      id: 3,
      name: "القسم الثالث",
      subtitle: "المعرفة والمهارات",
      questionCount: 20,
      durationMinutes: 10,
      accent: "#4de0b3",
      icon: "⌘",
      materials: [
        {
          id: 4,
          name: "المادة الرابعة",
          description: "اختبار تدريبي للمادة الرابعة.",
          file: "./questions-04.json",
          icon: "▦"
        },
        {
          id: 5,
          name: "المادة الخامسة",
          description: "اختبار تدريبي للمادة الخامسة.",
          file: "./questions-05.json",
          icon: "◉"
        },
        {
          id: 6,
          name: "المادة السادسة",
          description: "اختبار تدريبي للمادة السادسة.",
          file: "./questions-06.json",
          icon: "⌬"
        }
      ]
    },
    {
      id: 4,
      name: "القسم الرابع",
      subtitle: "التوسّع والتدريب",
      questionCount: 25,
      durationMinutes: 12,
      accent: "#ffbd70",
      icon: "◉",
      materials: [
        {
          id: 7,
          name: "المادة السابعة",
          description: "اختبار تدريبي للمادة السابعة.",
          file: "./questions-07.json",
          icon: "▧"
        },
        {
          id: 8,
          name: "المادة الثامنة",
          description: "اختبار تدريبي للمادة الثامنة.",
          file: "./questions-08.json",
          icon: "⌘"
        },
        {
          id: 9,
          name: "المادة التاسعة",
          description: "اختبار تدريبي للمادة التاسعة.",
          file: "./questions-09.json",
          icon: "◇"
        },
        {
          id: 10,
          name: "المادة العاشرة",
          description: "اختبار تدريبي للمادة العاشرة.",
          file: "./questions-10.json",
          icon: "▤"
        }
      ]
    },
    {
      id: 5,
      name: "القسم الخامس",
      subtitle: "التحديات المتقدمة",
      questionCount: 30,
      durationMinutes: 15,
      accent: "#ff83bb",
      icon: "✧",
      materials: [
        {
          id: 11,
          name: "المادة الحادية عشرة",
          description: "اختبار تدريبي للمادة الحادية عشرة.",
          file: "./questions-11.json",
          icon: "▤"
        },
        {
          id: 12,
          name: "المادة الثانية عشرة",
          description: "اختبار تدريبي للمادة الثانية عشرة.",
          file: "./questions-12.json",
          icon: "◈"
        },
        {
          id: 13,
          name: "المادة الثالثة عشرة",
          description: "اختبار تدريبي للمادة الثالثة عشرة.",
          file: "./questions-13.json",
          icon: "⌘"
        },
        {
          id: 14,
          name: "المادة الرابعة عشرة",
          description: "اختبار تدريبي للمادة الرابعة عشرة.",
          file: "./questions-14.json",
          icon: "◇"
        },
        {
          id: 15,
          name: "المادة الخامسة عشرة",
          description: "اختبار تدريبي للمادة الخامسة عشرة.",
          file: "./questions-15.json",
          icon: "▦"
        }
      ]
    },
    {
      id: 6,
      name: "القسم السادس",
      subtitle: "المراجعة الشاملة",
      questionCount: 40,
      durationMinutes: 20,
      accent: "#68a5ff",
      icon: "✦",
      materials: [
        {
          id: 16,
          name: "المادة السادسة عشرة",
          description: "اختبار تدريبي للمادة السادسة عشرة.",
          file: "./questions-16.json",
          icon: "▤"
        },
        {
          id: 17,
          name: "المادة السابعة عشرة",
          description: "اختبار تدريبي للمادة السابعة عشرة.",
          file: "./questions-17.json",
          icon: "◈"
        },
        {
          id: 18,
          name: "المادة الثامنة عشرة",
          description: "اختبار تدريبي للمادة الثامنة عشرة.",
          file: "./questions-18.json",
          icon: "⌘"
        },
        {
          id: 19,
          name: "المادة التاسعة عشرة",
          description: "اختبار تدريبي للمادة التاسعة عشرة.",
          file: "./questions-19.json",
          icon: "◇"
        },
        {
          id: 20,
          name: "المادة العشرون",
          description: "اختبار تدريبي للمادة العشرون.",
          file: "./questions-20.json",
          icon: "▦"
        }
      ]
    }
  ]
};

/* =========================================================
   2. حالة التطبيق
   ========================================================= */

const state = {
  students: [],
  student: null,
  section: null,
  material: null,

  questions: [],
  answers: [],
  currentIndex: 0,
  score: 0,
  secondsLeft: 0,
  timerId: null,
  finished: false,
  selectedAnswer: null
};

const $ = (selector) => document.querySelector(selector);

const screens = [
  "#loginScreen",
  "#libraryScreen",
  "#materialsScreen",
  "#subjectScreen",
  "#quizScreen",
  "#resultScreen"
];

/* =========================================================
   3. أدوات مساعدة
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showScreen(id) {
  screens.forEach((selector) => {
    $(selector).classList.toggle("hidden", selector !== id);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showMessage(element, message, type = "error") {
  element.textContent = message;
  element.className = `message ${type}`;
  element.classList.remove("hidden");
}

function hideMessage(element) {
  element.textContent = "";
  element.className = "message hidden";
}

function notify(message) {
  const element = $("#globalMessage");
  element.textContent = message;
  element.classList.remove("hidden");

  window.clearTimeout(notify.timeoutId);

  notify.timeoutId = window.setTimeout(() => {
    element.classList.add("hidden");
  }, 3000);
}

async function readJSON(path) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `تعذر تحميل الملف ${path} (${response.status})`
    );
  }

  return response.json();
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/*
 * توزيع الخيارات:
 * 1. الإجابة الصحيحة لا تُثبّت في أول القائمة.
 * 2. تُخلط الإجابات الخاطئة.
 * 3. يُختار موضع عشوائي للصحيحة.
 * 4. نحاول منع تكرار موضع الصحيحة في سؤالين متتاليين.
 */
function createQuestionOptions(question, previousCorrectIndex) {
  const correctAnswer = question.a;

  // منع تكرار الخيار الصحيح ضمن الخيارات الخاطئة.
  const wrongOptions = [
    ...new Set(
      question.w.filter((option) => option !== correctAnswer)
    )
  ];

  // خلط الخيارات الخاطئة.
  const shuffledWrongOptions = CONFIG.SHUFFLE_OPTIONS
    ? shuffle(wrongOptions)
    : [...wrongOptions];

  const options = [...shuffledWrongOptions, correctAnswer];

  if (!CONFIG.SHUFFLE_OPTIONS) {
    return {
      options: [correctAnswer, ...shuffledWrongOptions],
      correctIndex: 0
    };
  }

  // تحديد الموضع الذي ستظهر فيه الإجابة الصحيحة.
  let correctIndex = Math.floor(
    Math.random() * options.length
  );

  // إذا تكرر الموضع السابق، نختار موضعًا مختلفًا.
  if (
    options.length > 1 &&
    correctIndex === previousCorrectIndex
  ) {
    const possibleIndexes = [];

    for (let i = 0; i < options.length; i++) {
      if (i !== previousCorrectIndex) {
        possibleIndexes.push(i);
      }
    }

    correctIndex = possibleIndexes[
      Math.floor(Math.random() * possibleIndexes.length)
    ];
  }

  // إزالة الإجابة الصحيحة من آخر القائمة ووضعها في موضعها العشوائي.
  options.pop();
  options.splice(correctIndex, 0, correctAnswer);

  return {
    options,
    correctIndex
  };
}

function formatDuration(minutes) {
  return minutes === 1
    ? "دقيقة واحدة"
    : `${minutes} دقائق`;
}

function studentStorageKey(type) {
  return `taki_${type}_${state.student.studentNumber}`;
}

function getLocalNumber(type) {
  return Number(
    localStorage.getItem(studentStorageKey(type)) || 0
  );
}

function setLocalNumber(type, value) {
  localStorage.setItem(
    studentStorageKey(type),
    String(value)
  );
}

function getCompletedCount() {
  return getLocalNumber("completed");
}

function getPoints() {
  return getLocalNumber("points");
}

function updateStudentHeader() {
  if (!state.student) return;

  $("#headerStudentName").textContent =
    state.student.name;

  $("#headerStudentSpecialization").textContent =
    state.student.specialization || "طالب تكي";

  $("#studentAvatar").textContent =
    [...state.student.name][0] || "ط";

  $("#welcomeName").textContent =
    state.student.name.split(/\s+/)[0];

  $("#studentPoints").textContent = getPoints();
  $("#completedTests").textContent = getCompletedCount();

  const total = CONFIG.SECTIONS.reduce(
    (sum, section) => sum + section.materials.length,
    0
  );

  $("#totalSubjects").textContent = total;
  $("#headerStudent").classList.remove("hidden");
}

/* =========================================================
   4. تسجيل الدخول
   ========================================================= */

async function loadStudents() {
  try {
    const data = await readJSON(CONFIG.STUDENTS_FILE);

    if (!Array.isArray(data)) {
      throw new Error(
        "يجب أن يكون students.json مصفوفة JSON."
      );
    }

    state.students = data;
  } catch (error) {
    console.error(error);

    showMessage(
      $("#loginMessage"),
      "تعذر تحميل بيانات الطلاب. تحقق من وجود students.json وصحة محتواه."
    );
  }
}

function loginStudent(event) {
  event.preventDefault();

  const number = $("#studentNumber").value.trim();
  const password = $("#studentPassword").value;
  const message = $("#loginMessage");

  hideMessage(message);

  if (!number || !password) {
    showMessage(message, "أدخل رقم الطالب وكلمة المرور.");
    return;
  }

  const student = state.students.find((item) =>
    String(item.studentNumber) === number &&
    String(item.password) === password
  );

  if (!student) {
    showMessage(message, "رقم الطالب أو كلمة المرور غير صحيحة.");
    return;
  }

  state.student = {
    studentNumber: String(student.studentNumber),
    name: String(student.name),
    specialization: String(student.specialization || ""),
    password: String(student.password)
  };

  updateStudentHeader();
  renderSections();
  showScreen("#libraryScreen");
}

function logout() {
  stopTimer();

  state.student = null;
  state.section = null;
  state.material = null;
  state.finished = false;

  $("#headerStudent").classList.add("hidden");
  $("#studentPassword").value = "";
  $("#studentNumber").value = "";

  hideMessage($("#loginMessage"));
  $("#quitDialog").classList.add("hidden");

  showScreen("#loginScreen");
}

/* =========================================================
   5. إنشاء بطاقات الأقسام
   ========================================================= */

function renderSections() {
  const grid = $("#sectionsGrid");
  grid.innerHTML = "";

  CONFIG.SECTIONS.forEach((section) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "section-card";
    card.style.setProperty("--accent", section.accent);

    card.innerHTML = `
      <div class="section-card-top">
        <span class="section-number">
          القسم ${String(section.id).padStart(2, "0")}
        </span>
        <span class="section-icon">${escapeHTML(section.icon)}</span>
      </div>
      <h3>${escapeHTML(section.name)}</h3>
      <p>${escapeHTML(section.subtitle)}</p>
      <p>${section.materials.length} ${
        section.materials.length === 1 ? "مادة" : "مواد"
      }</p>
      <span class="card-arrow">←</span>
    `;

    card.addEventListener("click", () => openSection(section.id));

    grid.appendChild(card);
  });
}

function openSection(sectionId) {
  const section = CONFIG.SECTIONS.find(
    (item) => item.id === sectionId
  );

  if (!section) return;

  state.section = section;
  state.material = null;

  $("#materialEmblem").textContent =
    String(section.id).padStart(2, "0");

  $("#materialEyebrow").textContent = section.name;
  $("#materialsTitle").textContent = section.name;

  $("#materialsDescription").textContent =
    `${section.subtitle} — اختر مادة لبدء الاختبار.`;

  renderMaterials(section);
  showScreen("#materialsScreen");
}

function renderMaterials(section) {
  const grid = $("#materialsGrid");
  grid.innerHTML = "";

  section.materials.forEach((material) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "material-card";

    card.innerHTML = `
      <span class="material-symbol">${escapeHTML(material.icon || "▤")}</span>
      <span class="material-copy">
        <strong>${escapeHTML(material.name)}</strong>
        <small>${escapeHTML(material.description || "اختبار تدريبي")}</small>
      </span>
      <span class="material-arrow">←</span>
    `;

    card.addEventListener("click", () => openMaterial(material));

    grid.appendChild(card);
  });
}

/* =========================================================
   6. فتح المادة وتجهيز الاختبار
   ========================================================= */

async function openMaterial(material) {
  state.material = material;

  const section = state.section;

  $("#subjectTitle").textContent = material.name;
  $("#subjectSectionName").textContent = section.name;

  $("#subjectDescription").textContent =
    material.description ||
    "استعد للاختبار وابدأ عندما تكون جاهزاً.";

  $("#subjectSymbol").textContent = material.icon || "✦";

  $("#subjectQuestionCount").textContent =
    section.questionCount;

  $("#subjectDuration").textContent =
    formatDuration(section.durationMinutes);

  $("#subjectPoints").textContent =
    CONFIG.POINTS_PER_CORRECT;

  $("#subjectAvailability").classList.add("hidden");
  $("#startButton").disabled = false;

  $("#startButton").innerHTML =
    "<span>ابدأ الاختبار</span><span>←</span>";

  showScreen("#subjectScreen");
}

async function prepareQuiz() {
  if (!state.student || !state.section || !state.material) {
    return;
  }

  const button = $("#startButton");

  button.disabled = true;
  button.textContent = "جارٍ تجهيز الاختبار…";

  try {
    const data = await readJSON(state.material.file);

    if (!Array.isArray(data)) {
      throw new Error("ملف الأسئلة ليس مصفوفة JSON.");
    }

    const validQuestions = data.filter((item) =>
      item &&
      typeof item.q === "string" &&
      typeof item.a === "string" &&
      Array.isArray(item.w) &&
      item.w.every((answer) => typeof answer === "string")
    );

    if (validQuestions.length === 0) {
      throw new Error("لا توجد أسئلة صالحة في ملف هذه المادة.");
    }

    const count = Math.min(
      state.section.questionCount,
      validQuestions.length
    );

    const chosen = CONFIG.SHUFFLE_QUESTIONS
      ? shuffle(validQuestions).slice(0, count)
      : validQuestions.slice(0, count);

    let previousCorrectIndex = -1;

    state.questions = chosen.map((question) => {
      const result = createQuestionOptions(
        question,
        previousCorrectIndex
      );

      previousCorrectIndex = result.correctIndex;

      return {
        q: question.q,
        a: question.a,
        options: result.options
      };
    });

    state.answers = new Array(state.questions.length).fill(null);
    state.currentIndex = 0;
    state.score = 0;
    state.finished = false;
    state.selectedAnswer = null;

    state.secondsLeft = state.section.durationMinutes * 60;

    $("#activeSubject").textContent = state.material.name;
    $("#activeTopic").textContent = state.section.name;
    $("#totalQuestions").textContent = state.questions.length;
    $("#scoreText").textContent = "0";

    showScreen("#quizScreen");

    renderQuestion();
    startTimer();

  } catch (error) {
    console.error(error);

    showMessage(
      $("#subjectAvailability"),
      `تعذر بدء الاختبار: ${error.message}`,
      "error"
    );

    $("#subjectAvailability").classList.remove("hidden");
    notify("تحقق من ملف أسئلة المادة على GitHub.");

  } finally {
    button.disabled = false;

    button.innerHTML =
      "<span>ابدأ الاختبار</span><span>←</span>";
  }
}

/* =========================================================
   7. عرض الأسئلة والخيارات
   ========================================================= */

function renderQuestion() {
  const question = state.questions[state.currentIndex];

  if (!question) return;

  state.selectedAnswer = null;

  $("#currentQuestion").textContent = state.currentIndex + 1;

  $("#questionNumberBadge").textContent =
    `السؤال ${state.currentIndex + 1}`;

  $("#questionText").textContent = question.q;

  $("#progressBar").style.width =
    `${((state.currentIndex + 1) / state.questions.length) * 100}%`;

  const list = $("#optionsList");
  list.innerHTML = "";

  hideFeedback();

  const letters = ["أ", "ب", "ج", "د", "هـ", "و"];

  question.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "option-button";

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = letters[index] || String(index + 1);

    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = option;

    button.append(letter, text);

    button.addEventListener("click", () => {
      chooseAnswer(option, button);
    });

    list.appendChild(button);
  });

  $("#nextButton").disabled = true;

  $("#nextButtonText").textContent =
    state.currentIndex === state.questions.length - 1
      ? "عرض النتائج"
      : "السؤال التالي";

  updateTimerDisplay();
}

function hideFeedback() {
  $("#feedbackBox").className = "feedback-box hidden";
  $("#feedbackIcon").textContent = "✓";
  $("#feedbackTitle").textContent = "";
  $("#feedbackText").textContent = "";
  $("#feedbackPoints").textContent = "";
}

function chooseAnswer(answer, selectedButton) {
  if (state.finished || state.selectedAnswer !== null) {
    return;
  }

  state.selectedAnswer = answer;

  const question = state.questions[state.currentIndex];
  const correct = answer === question.a;

  state.answers[state.currentIndex] = {
    question: question.q,
    selected: answer,
    correctAnswer: question.a,
    correct
  };

  const buttons = [
    ...$("#optionsList").querySelectorAll(".option-button")
  ];

  buttons.forEach((button) => {
    button.disabled = true;

    const optionText =
      button.querySelector(".option-text")?.textContent ??
      button.lastElementChild.textContent;

    if (optionText === question.a) {
      button.classList.add("correct");
    }
  });

  if (correct) {
    state.score += CONFIG.POINTS_PER_CORRECT;
    $("#scoreText").textContent = state.score;

    $("#feedbackBox").className = "feedback-box correct";
    $("#feedbackIcon").textContent = "✓";
    $("#feedbackTitle").textContent = "إجابة صحيحة، أحسنت!";
    $("#feedbackText").textContent =
      "واصل تقدمك، أنت على الطريق الصحيح.";
    $("#feedbackPoints").textContent =
      `+${CONFIG.POINTS_PER_CORRECT} نقطة`;

  } else {
    selectedButton.classList.add("wrong");

    $("#feedbackBox").className = "feedback-box wrong";
    $("#feedbackIcon").textContent = "×";
    $("#feedbackTitle").textContent = "ليست الإجابة الصحيحة";
    $("#feedbackText").textContent =
      `الإجابة الصحيحة هي: ${question.a}`;
    $("#feedbackPoints").textContent =
      "حاول الاستفادة من التصحيح في المرة القادمة.";
  }

  $("#nextButtonText").textContent =
    state.currentIndex === state.questions.length - 1
      ? "عرض النتائج"
      : "السؤال التالي";

  $("#nextButton").disabled = false;
}

function nextQuestion() {
  if (state.finished || state.selectedAnswer === null) {
    return;
  }

  if (state.currentIndex + 1 >= state.questions.length) {
    finishQuiz("completed");
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

/* =========================================================
   8. المؤقت
   ========================================================= */

function startTimer() {
  stopTimer();
  updateTimerDisplay();

  state.timerId = window.setInterval(() => {
    if (state.finished) {
      stopTimer();
      return;
    }

    state.secondsLeft -= 1;
    updateTimerDisplay();

    if (state.secondsLeft <= 0) {
      finishQuiz("timeout");
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerDisplay() {
  const seconds = Math.max(0, state.secondsLeft);

  const minutesText = String(
    Math.floor(seconds / 60)
  ).padStart(2, "0");

  const secondsText = String(seconds % 60).padStart(2, "0");

  $("#timerText").textContent =
    `${minutesText}:${secondsText}`;

  $("#timerRing").classList.toggle("danger", seconds <= 30);
}

/* =========================================================
   9. إنهاء الاختبار وحساب النتائج
   ========================================================= */

function finishQuiz(reason = "completed") {
  if (state.finished || !state.questions.length) {
    return;
  }

  state.finished = true;
  stopTimer();

  const correctCount = state.answers.filter(
    (answer) => answer?.correct
  ).length;

  const wrongCount = state.answers.filter(
    (answer) => answer && !answer.correct
  ).length;

  const unansweredCount =
    state.questions.length - correctCount - wrongCount;

  const percentage = Math.round(
    (correctCount / state.questions.length) * 100
  );

  const pointsEarned =
    correctCount * CONFIG.POINTS_PER_CORRECT;

  // إضافة النقاط مرة واحدة عند إنهاء الاختبار.
  setLocalNumber("points", getPoints() + pointsEarned);
  setLocalNumber("completed", getCompletedCount() + 1);

  updateStudentHeader();

  $("#finalScore").textContent = pointsEarned;
  $("#finalPercent").textContent = `${percentage}%`;
  $("#correctCount").textContent = correctCount;
  $("#wrongCount").textContent = wrongCount;
  $("#unansweredCount").textContent = unansweredCount;

  $("#resultProgress").style.width = `${percentage}%`;

  $("#resultHeading").textContent =
    percentage >= 90
      ? "إنجاز رائع!"
      : percentage >= 70
        ? "أحسنت، واصل التقدم!"
        : percentage >= 50
          ? "خطوة جيدة، استمر!"
          : "كل محاولة فرصة للتعلّم!";

  $("#resultSubtitle").textContent =
    reason === "timeout"
      ? "انتهى الوقت المخصص للاختبار. إليك مراجعة أدائك."
      : "انتهيت من الاختبار. راجع إجاباتك واستفد من التصحيح.";

  $("#resultMedal").textContent =
    percentage >= 90 ? "✦" : percentage >= 70 ? "★" : "◇";

  renderAnalysis(
    correctCount,
    wrongCount,
    unansweredCount,
    percentage
  );

  renderAnswerReview();

  $("#quitDialog").classList.add("hidden");
  showScreen("#resultScreen");
}

function renderAnalysis(correct, wrong, unanswered, percentage) {
  const insights = $("#analysisInsights");
  insights.innerHTML = "";

  const messages = [
    `أجبت إجابة صحيحة عن ${correct} من ${state.questions.length} سؤالاً.`,
    `نسبة نجاحك في هذا الاختبار: ${percentage}%.`,
    wrong > 0
      ? `راجع ${wrong} إجابة غير صحيحة لفهم مواضع الخطأ.`
      : "لم تسجل أي إجابة خاطئة — أحسنت!",
    unanswered > 0
      ? `هناك ${unanswered} أسئلة دون إجابة.`
      : "أجبت عن جميع أسئلة الاختبار."
  ];

  messages.forEach((message) => {
    const item = document.createElement("div");
    item.className = "insight";
    item.textContent = message;
    insights.appendChild(item);
  });
}

function renderAnswerReview() {
  const review = $("#answerReview");
  review.innerHTML = "";

  state.questions.forEach((question, index) => {
    const answer = state.answers[index];
    const item = document.createElement("article");

    let type = "skipped-review";
    let status = "دون إجابة";

    if (answer?.correct) {
      type = "correct-review";
      status = "إجابة صحيحة";
    } else if (answer) {
      type = "wrong-review";
      status = "إجابة خاطئة";
    }

    item.className = `review-item ${type}`;

    const title = document.createElement("div");
    title.className = "review-question";
    title.textContent = `${index + 1}. ${question.q}`;

    const statusLine = document.createElement("p");
    statusLine.className = "review-answer";
    statusLine.textContent = status;

    const yourAnswer = document.createElement("p");
    yourAnswer.className = "review-answer";

    const yourLabel = document.createElement("strong");
    yourLabel.textContent = "إجابتك: ";

    yourAnswer.append(
      yourLabel,
      document.createTextNode(answer ? answer.selected : "لم تجب")
    );

    const correctAnswer = document.createElement("p");
    correctAnswer.className = "review-answer";

    const correctLabel = document.createElement("strong");
    correctLabel.textContent = "الإجابة الصحيحة: ";

    correctAnswer.append(
      correctLabel,
      document.createTextNode(question.a)
    );

    item.append(title, statusLine, yourAnswer, correctAnswer);
    review.appendChild(item);
  });
}

/* =========================================================
   10. التنقل والأزرار
   ========================================================= */

function goToLibrary() {
  stopTimer();

  state.finished = true;
  state.material = null;

  if (state.student) {
    updateStudentHeader();
    showScreen("#libraryScreen");
  } else {
    showScreen("#loginScreen");
  }
}

function retryQuiz() {
  if (!state.material) return;
  prepareQuiz();
}

function openQuitDialog() {
  if (!state.finished) {
    $("#quitDialog").classList.remove("hidden");
  }
}

function closeQuitDialog() {
  $("#quitDialog").classList.add("hidden");
}

/* =========================================================
   11. تشغيل التطبيق
   ========================================================= */

function bindEvents() {
  $("#loginForm").addEventListener("submit", loginStudent);

  $("#togglePassword").addEventListener("click", () => {
    const input = $("#studentPassword");

    input.type =
      input.type === "password" ? "text" : "password";
  });

  $("#logoutButton").addEventListener("click", logout);

  $("#brandHome").addEventListener("click", (event) => {
    event.preventDefault();

    if (state.student) {
      goToLibrary();
    } else {
      showScreen("#loginScreen");
    }
  });

  $("#backToLibrary").addEventListener("click", () => {
    showScreen("#libraryScreen");
  });

  $("#backToMaterials").addEventListener("click", () => {
    if (state.section) {
      openSection(state.section.id);
    }
  });

  $("#startButton").addEventListener("click", prepareQuiz);
  $("#nextButton").addEventListener("click", nextQuestion);
  $("#quitButton").addEventListener("click", openQuitDialog);
  $("#cancelQuitButton").addEventListener("click", closeQuitDialog);

  $("#confirmQuitButton").addEventListener("click", () => {
    finishQuiz("quit");
  });

  $("#retryButton").addEventListener("click", retryQuiz);
  $("#homeButton").addEventListener("click", goToLibrary);

  $("#quitDialog").addEventListener("click", (event) => {
    if (event.target === $("#quitDialog")) {
      closeQuitDialog();
    }
  });
}

async function init() {
  bindEvents();
  await loadStudents();

  showScreen("#loginScreen");

  if (state.students.length === 0) {
    console.info(
      "أضف حساب طالب إلى students.json لتجربة تسجيل الدخول."
    );
  }
}

document.addEventListener("DOMContentLoaded", init);
