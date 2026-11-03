(() => {

"use strict";

// =====================================================
// CONFIGURATION
// =====================================================

const cfg = window.TAKI_CONFIG || {};

const $ = selector => document.querySelector(selector);

const $$ = selector => [...document.querySelectorAll(selector)];


// =====================================================
// SUPABASE CONNECTION
// =====================================================

const supabaseReady =
    window.supabase &&
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("ضع_") &&
    !cfg.supabaseAnonKey.includes("ضع_");

const db = supabaseReady

    ? window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabaseAnonKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )

    : null;


// =====================================================
// APPLICATION STATE
// =====================================================

const S = {

    student: null,

    view: "home",

    courses: [],

    subjects: [],

    posts: [],

    notifications: [],

    quiz: null,

    quizIndex: 0,

    answers: [],

    seconds: 0,

    timer: null,

    startedAt: null,

    finishing: false

};


// =====================================================
// HELPERS
// =====================================================

function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]
    );

}


function notify(message) {

    const box = $("#loginMessage");

    if (box) {
        box.textContent = message;
    }

    console.log(message);

}


function historyKey() {

    return `${cfg.storage?.history || "taki_history"}_${S.student?.id || "guest"}`;

}


function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(historyKey()) || "[]"
        );

    } catch {

        return [];

    }

}


function saveHistory(history) {

    localStorage.setItem(
        historyKey(),
        JSON.stringify(history)
    );

}


// =====================================================
// LOAD JSON DATA
// =====================================================

async function loadJSON(path, fallback = []) {

    try {

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (error) {

        console.warn("TAKI data loading error:", path, error);

        return fallback;

    }

}


async function loadApplicationData() {

    const data = cfg.data || {};

    const [
        courses,
        subjects,
        posts,
        notifications
    ] = await Promise.all([

        loadJSON(data.courses || "data/courses.json"),

        loadJSON(data.subjects || "data/subjects.json"),

        loadJSON(data.posts || "data/posts.json"),

        loadJSON(data.notifications || "data/notifications.json")

    ]);

    S.courses = courses;

    S.subjects = subjects;

    S.posts = posts;

    S.notifications = notifications;

}


// =====================================================
// INITIALIZATION
// =====================================================

async function init() {

    await loadApplicationData();

    bindEvents();

    renderHome();

    if (!db) {

        console.warn(
            "Supabase is not configured. Check config.js"
        );

    }

}


function bindEvents() {

    $("#loginForm")?.addEventListener(
        "submit",
        login
    );

    $("#logoutButton")?.addEventListener(
        "click",
        logout
    );

    $("#refreshRanking")?.addEventListener(
        "click",
        ranking
    );

    $("#startChallenge")?.addEventListener(
        "click",
        () => notify("ميزة التحديات تحتاج إلى إعداد قاعدة بيانات خاصة بها.")
    );

    $("#createChallenge")?.addEventListener(
        "click",
        () => notify("ميزة إنشاء التحديات قيد الإعداد.")
    );

    $$(".nav[data-view]").forEach(button => {

        button.addEventListener("click", () => {

            go(button.dataset.view);

        });

    });

}


// =====================================================
// LOGIN
// =====================================================

async function login(event) {

    event.preventDefault();

    if (!db) {

        notify("تعذر الاتصال بقاعدة البيانات. راجع config.js");

        return;

    }

    const number = $("#studentNumber")?.value.trim();

    const password = $("#studentPassword")?.value;

    if (!number || !password) {

        notify("أدخل رقم الطالب وكلمة المرور.");

        return;

    }

    const button = $("#loginButton");

    if (button) {
        button.disabled = true;
        button.textContent = "جارٍ تسجيل الدخول...";
    }

    try {

        const { data, error } = await db.rpc(
            cfg.rpc?.loginStudent || "login_student",
            {
                p_student_number: number,
                p_password: password
            }
        );

        if (error) {
            throw error;
        }

        const student = Array.isArray(data)
            ? data[0]
            : data;

        if (!student) {

            throw new Error(
                "رقم الطالب أو كلمة المرور غير صحيحة."
            );

        }

        S.student = student;

        showApplication();

        renderHome();

        profile();

        notify("تم تسجيل الدخول بنجاح.");

    } catch (error) {

        console.error(error);

        notify(
            error.message || "حدث خطأ أثناء تسجيل الدخول."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent = "تسجيل الدخول";

        }

    }

}


// =====================================================
// SHOW APPLICATION
// =====================================================

function showApplication() {

    const loginScreen = $("#loginScreen");

    const appShell = $("#appShell");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (appShell) {
        appShell.style.display = "block";
    }

    const student = S.student;

    if (!student) return;

    if ($("#topGreeting")) {
        $("#topGreeting").textContent =
            `مرحباً ${student.name || "طالب تكي"}`;
    }

    if ($("#sideName")) {
        $("#sideName").textContent =
            student.name || "طالب";
    }

    if ($("#sideLevel")) {
        $("#sideLevel").textContent =
            `المستوى ${student.level || 1}`;
    }

    if ($("#sideAvatar")) {
        $("#sideAvatar").textContent =
            (student.name || "ت").charAt(0);
    }

    if ($("#topAvatar")) {
        $("#topAvatar").textContent =
            (student.name || "ت").charAt(0);
    }

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    clearInterval(S.timer);

    S.student = null;

    S.quiz = null;

    S.finishing = false;

    if ($("#appShell")) {
        $("#appShell").style.display = "none";
    }

    if ($("#loginScreen")) {
        $("#loginScreen").style.display = "block";
    }

    if ($("#studentPassword")) {
        $("#studentPassword").value = "";
    }

}


// =====================================================
// NAVIGATION
// =====================================================

function go(view) {

    S.view = view;

    $$(".view").forEach(element => {

        element.classList.remove("active");

    });

    const target = $(`#view-${view}`);

    target?.classList.add("active");

    $$(".nav[data-view]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.view === view
        );

    });

    if (view === "ranking") {
        ranking();
    }

    if (view === "profile") {
        profile();
    }

}


// =====================================================
// HOME
// =====================================================

function renderHome() {

    const coursesContainer = $("#homeCourses");

    const postsContainer = $("#homePosts");

    if (coursesContainer) {

        coursesContainer.innerHTML = S.courses
            .slice(0, 4)
            .map(courseCard)
            .join("");

    }

    if (postsContainer) {

        postsContainer.innerHTML = S.posts
            .slice(0, 4)
            .map(postCard)
            .join("");

    }

    const announcement = $("#announcement");

    if (announcement && S.posts.length) {

        announcement.textContent =
            S.posts[0].title || "";

    }

}


function courseCard(course, index) {

    return `

        <article class="course-card">

            <h3>${escapeHTML(course.title || course.name || "دورة")}</h3>

            <p>${escapeHTML(course.description || "")}</p>

            <button onclick="TAKI.openCourse(${index})">
                استعراض الدورة
            </button>

        </article>

    `;

}


function postCard(post) {

    return `

        <article class="post-card">

            <h3>${escapeHTML(post.title || "")}</h3>

            <p>${escapeHTML(post.description || post.content || "")}</p>

        </article>

    `;

}


// =====================================================
// COURSES AND SUBJECTS
// =====================================================

function renderCourses() {

    const container = $("#coursesGrid");

    if (!container) return;

    container.innerHTML = S.courses
        .map(courseCard)
        .join("");

}


function renderSubjects() {

    const container = $("#subjectsGrid");

    if (!container) return;

    container.innerHTML = S.subjects.map((subject, index) => `

        <article class="subject-card">

            <h3>${escapeHTML(subject.title || subject.name || "مادة")}</h3>

            <p>${escapeHTML(subject.description || "")}</p>

            <button onclick="TAKI.openSubject(${index})">
                فتح المادة
            </button>

        </article>

    `).join("");

}


function openCourse(index) {

    const course = S.courses[index];

    if (!course) return;

    showContent(
        course.title || course.name,
        course.description || ""
    );

}


function openSubject(index) {

    const subject = S.subjects[index];

    if (!subject) return;

    showContent(
        subject.title || subject.name,
        subject.description || ""
    );

}


function showContent(title, content) {

    const panel = $("#contentPanel");

    if (!panel) return;

    panel.innerHTML = `

        <h2>${escapeHTML(title)}</h2>

        <div>${escapeHTML(content)}</div>

    `;

    go("library");

}


// =====================================================
// QUIZ START
// =====================================================

function startQuiz(quiz) {

    if (!S.student) {

        notify("يجب تسجيل الدخول أولاً.");

        return;

    }

    if (!quiz || !Array.isArray(quiz.questions)) {

        notify("لا توجد أسئلة صالحة في هذا الاختبار.");

        return;

    }

    if (!quiz.questions.length) {

        notify("الاختبار فارغ.");

        return;

    }

    clearInterval(S.timer);

    S.quiz = quiz;

    S.quizIndex = 0;

    S.answers = new Array(quiz.questions.length).fill(null);

    S.seconds = Number(
        cfg.quiz?.defaultDurationSeconds || 600
    );

    S.startedAt = Date.now();

    S.finishing = false;

    go("quiz");

    quizQuestion();

    updateTimer();

    S.timer = setInterval(() => {

        S.seconds--;

        updateTimer();

        if (S.seconds <= 0) {

            finish(true);

        }

    }, 1000);

}


// =====================================================
// QUIZ TIMER
// =====================================================

function updateTimer() {

    const timer = $("#timer");

    if (!timer) return;

    const minutes = Math.floor(S.seconds / 60);

    const seconds = S.seconds % 60;

    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


// =====================================================
// QUIZ QUESTION
// =====================================================

function quizQuestion() {

    const mount = $("#quizMount");

    if (!mount || !S.quiz) return;

    const question = S.quiz.questions[S.quizIndex];

    if (!question) return;

    const type = S.quiz.mode || "multiple";

    let answerHTML = "";

    if (type === "code") {

        answerHTML = `

            <textarea
                id="quizAnswer"
                placeholder="اكتب إجابتك هنا..."
            >${escapeHTML(S.answers[S.quizIndex] || "")}</textarea>

        `;

    } else if (type === "english") {

        answerHTML = `

            <input
                id="quizAnswer"
                type="text"
                placeholder="اكتب الإجابة..."
                value="${escapeHTML(S.answers[S.quizIndex] || "")}"
            >

        `;

    } else {

        const options = question.options || [];

        answerHTML = options.map((option, index) => `

            <label class="quiz-option">

                <input
                    type="radio"
                    name="quizOption"
                    value="${index}"
                    ${Number(S.answers[S.quizIndex]) === index ? "checked" : ""}
                >

                <span>${escapeHTML(option)}</span>

            </label>

        `).join("");

    }

    mount.innerHTML = `

        <div class="quiz-question">

            <p>
                السؤال ${S.quizIndex + 1}
                من ${S.quiz.questions.length}
            </p>

            <h3>${escapeHTML(question.question || question.q || "")}</h3>

            <div class="quiz-answers">
                ${answerHTML}
            </div>

            <div class="quiz-controls">

                <button onclick="TAKI.previousQuestion()">
                    السابق
                </button>

                <button onclick="TAKI.saveAnswer()">
                    حفظ الإجابة
                </button>

                <button onclick="TAKI.nextQuestion()">
                    التالي
                </button>

                <button onclick="TAKI.finish(false)">
                    إنهاء الاختبار
                </button>

            </div>

        </div>

    `;

}


// =====================================================
// SAVE ANSWER
// =====================================================

function saveAnswer() {

    if (!S.quiz) return;

    const mode = S.quiz.mode || "multiple";

    if (mode === "multiple") {

        const selected = $('input[name="quizOption"]:checked');

        S.answers[S.quizIndex] = selected
            ? Number(selected.value)
            : null;

    } else {

        S.answers[S.quizIndex] =
            $("#quizAnswer")?.value ?? "";

    }

}


// =====================================================
// QUESTION NAVIGATION
// =====================================================

function previousQuestion() {

    saveAnswer();

    if (S.quizIndex > 0) {

        S.quizIndex--;

        quizQuestion();

    }

}


function nextQuestion() {

    saveAnswer();

    if (S.quizIndex < S.quiz.questions.length - 1) {

        S.quizIndex++;

        quizQuestion();

    } else {

        notify("لقد وصلت إلى السؤال الأخير.");

    }

}


// =====================================================
// CHECK ANSWER
// =====================================================

function isCorrect(question, answer) {

    const mode = S.quiz.mode || "multiple";

    if (answer === null || answer === undefined) {
        return false;
    }

    if (mode === "multiple") {

        const correctIndex =
            question.correctIndex ??
            question.answerIndex;

        if (correctIndex === undefined) {
            return false;
        }

        return Number(answer) === Number(correctIndex);

    }

    const expected =
        question.answer ??
        question.expectedCode ??
        question.sentence;

    if (expected === undefined) {
        return false;
    }

    return String(answer).trim() === String(expected).trim();

}


// =====================================================
// FINISH QUIZ
// =====================================================

async function finish(auto = false) {

    if (!S.quiz || S.finishing) return;

    S.finishing = true;

    saveAnswer();

    clearInterval(S.timer);

    const questions = S.quiz.questions;

    const total = questions.length;

    let correct = 0;

    questions.forEach((question, index) => {

        if (isCorrect(question, S.answers[index])) {
            correct++;
        }

    });

    const wrong = total - correct;

    const elapsed = Math.max(
        0,
        Math.floor((Date.now() - S.startedAt) / 1000)
    );

    const record = {

        title: S.quiz.title || "اختبار",

        part: S.quiz.part || "",

        score: correct,

        total,

        correct,

        wrong,

        percent: total
            ? Math.round((correct / total) * 100)
            : 0,

        elapsed,

        date: new Date().toISOString(),

        review: questions.map((question, index) => ({

            question: question.question || question.q || "",

            answer: S.answers[index],

            correct: isCorrect(question, S.answers[index])

        }))

    };


    // Save local history

    const history = getHistory();

    history.unshift(record);

    saveHistory(history);


    // Save result to Supabase

    let databaseSaved = false;

    let databaseMessage = "";

    try {

        if (!db) {
            throw new Error("لا يوجد اتصال بقاعدة البيانات.");
        }

        const { data, error } = await db.rpc(

            cfg.rpc?.submitTestResult || "taki_submit_test_result",

            {

                p_student_number: S.student.student_number,

                p_password: $("#studentPassword")?.value || "",

                p_subject: record.title,

                p_part: record.part,

                p_score: record.score,

                p_total_questions: record.total,

                p_correct_answers: record.correct,

                p_wrong_answers: record.wrong,

                p_duration_seconds: record.elapsed

            }

        );

        if (error) {
            throw error;
        }

        databaseSaved = true;

        const result = Array.isArray(data) ? data[0] : data;

        if (result && result.success) {

            S.student.points = result.points;

            S.student.level = result.level;

            S.student.tests_count = result.tests_count;

            S.student.correct_answers = result.correct_answers;

            S.student.wrong_answers = result.wrong_answers;

        }

    } catch (error) {

        console.error("Database save error:", error);

        databaseMessage = error.message || "تعذر حفظ النتيجة.";

    }


    // Show result

    const mount = $("#quizMount");

    if (mount) {

        mount.innerHTML = `

            <section class="quiz-result">

                <h2>انتهى الاختبار ${auto ? "لانتهاء الوقت" : ""}</h2>

                <h3>${record.percent}%</h3>

                <p>الإجابات الصحيحة: ${correct}</p>

                <p>الإجابات الخاطئة: ${wrong}</p>

                <p>مجموع الأسئلة: ${total}</p>

                <p>
                    ${databaseSaved
                        ? "تم حفظ النتيجة والنقاط في قاعدة البيانات."
                        : "تم حفظ النتيجة محلياً، لكن تعذر حفظها في قاعدة البيانات."}
                </p>

                ${databaseMessage
                    ? `<p>${escapeHTML(databaseMessage)}</p>`
                    : ""}

                <button onclick="TAKI.go('profile')">
                    عرض ملفي
                </button>

                <button onclick="TAKI.go('home')">
                    الرئيسية
                </button>

            </section>

        `;

    }

    S.quiz = null;

    S.finishing = false;

    profile();

}


// =====================================================
// PROFILE
// =====================================================

function profile() {

    if (!S.student) return;

    const student = S.student;

    const card = $("#profileCard");

    if (card) {

        card.innerHTML = `

            <h2>${escapeHTML(student.name || "طالب تكي")}</h2>

            <p>رقم الطالب: ${escapeHTML(student.student_number || "")}</p>

            <p>التخصص: ${escapeHTML(student.specialization || "")}</p>

            <p>المستوى: ${Number(student.level || 1)}</p>

            <p>النقاط: ${Number(student.points || 0)}</p>

        `;

    }

    const stats = $("#profileStats");

    if (stats) {

        stats.innerHTML = `

            <div>الاختبارات: ${Number(student.tests_count || 0)}</div>

            <div>الإجابات الصحيحة: ${Number(student.correct_answers || 0)}</div>

            <div>الإجابات الخاطئة: ${Number(student.wrong_answers || 0)}</div>

        `;

    }

    const history = $("#localHistory");

    if (history) {

        history.innerHTML = getHistory().map(item => `

            <article class="history-item">

                <h4>${escapeHTML(item.title)}</h4>

                <p>النتيجة: ${item.correct}/${item.total}</p>

                <p>النسبة: ${item.percent}%</p>

                <p>${new Date(item.date).toLocaleDateString("ar")}</p>

            </article>

        `).join("");

    }

}


// =====================================================
// RANKING
// =====================================================

async function ranking() {

    const table = $("#rankingTable");

    if (!table) return;

    if (!db) {

        table.innerHTML = "<p>قاعدة البيانات غير متصلة.</p>";

        return;

    }

    table.innerHTML = "<p>جارٍ تحميل الترتيب...</p>";

    try {

        const { data, error } = await db.rpc(

            cfg.rpc?.getRanking || "taki_get_ranking"

        );

        if (error) {
            throw error;
        }

        const students = (data || []).slice(
            0,
            Number(cfg.ranking?.limit || 20)
        );

        if (!students.length) {

            table.innerHTML = "<p>لا توجد بيانات ترتيب حالياً.</p>";

            return;

        }

        table.innerHTML = `

            <table>

                <thead>

                    <tr>
                        <th>الترتيب</th>
                        <th>الطالب</th>
                        <th>التخصص</th>
                        <th>النقاط</th>
                        <th>المستوى</th>
                    </tr>

                </thead>

                <tbody>

                    ${students.map((student, index) => `

                        <tr>

                            <td>${index + 1}</td>

                            <td>${escapeHTML(student.name)}</td>

                            <td>${escapeHTML(student.specialization || "")}</td>

                            <td>${Number(student.points || 0)}</td>

                            <td>${Number(student.level || 1)}</td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        `;

    } catch (error) {

        console.error(error);

        table.innerHTML = `
            <p>تعذر تحميل الترتيب: ${escapeHTML(error.message)}</p>
        `;

    }

}


// =====================================================
// NOTIFICATIONS
// =====================================================

function renderNotifications() {

    const container = $("#notificationsList");

    if (!container) return;

    container.innerHTML = S.notifications.map(notification => `

        <article class="notification-item">

            <h3>${escapeHTML(notification.title || "")}</h3>

            <p>${escapeHTML(notification.message || notification.content || "")}</p>

        </article>

    `).join("");

}


// =====================================================
// EXPOSE PUBLIC FUNCTIONS
// =====================================================

window.TAKI = {

    go,

    startQuiz,

    finish,

    saveAnswer,

    previousQuestion,

    nextQuestion,

    openCourse,

    openSubject,

    renderCourses,

    renderSubjects,

    renderNotifications,

    ranking,

    profile,

    logout

};


// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);

})();
