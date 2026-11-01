(() => {
"use strict";

/* =========================================
   1. الإعدادات والاتصال بقاعدة البيانات
========================================= */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const cfg = window.TAKI_CONFIG || {};

const supabaseUrl = cfg.supabaseUrl;
const supabaseAnonKey = cfg.supabaseAnonKey;

const ready =
    typeof window.supabase !== "undefined" &&
    typeof supabaseUrl === "string" &&
    /^https:\/\/[^/]+/.test(supabaseUrl) &&
    !supabaseUrl.includes("ضع_رابط") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes("ضع_المفتاح");

const db = ready
    ? window.supabase.createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )
    : null;

if (!db) {
    console.error(
        "TAKI: تعذر إنشاء اتصال Supabase. تحقق من js/config.js ومكتبة Supabase."
    );
}

/* =========================================
   2. حالة التطبيق
========================================= */

const S = {
    student: null,

    view: "home",
    tab: "subjects",

    posts: [],
    notifications: [],
    subjects: [],
    courses: [],

    quiz: null,
    index: 0,
    answers: [],

    timer: null,
    seconds: 600,
    start: 0,

    finishing: false
};

/* =========================================
   3. أدوات مساعدة
========================================= */

const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

const historyKey = () =>
    `taki_history_${S.student?.id || "guest"}`;

function msg(element, text, type = "") {
    if (!element) return;

    element.textContent = text;
    element.className = ("message " + type).trim();
}

function toast(text) {
    const element = $("#toast");

    if (!element) {
        console.log(text);
        return;
    }

    element.textContent = text;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}

async function json(path, fallback = []) {
    try {
        const base = cfg.DATA_BASE_PATH || "data/";

        const response = await fetch(
            base + path,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("تعذر تحميل الملف: " + path);
        }

        return await response.json();

    } catch (error) {
        console.warn(
            "تعذر تحميل البيانات:",
            path,
            error
        );

        return fallback;
    }
}

function empty(title, description = "") {
    return `
        <div class="empty">
            <b>${esc(title)}</b>
            <p>${esc(description)}</p>
        </div>
    `;
}

/* =========================================
   4. بدء التطبيق
========================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    [
        S.posts,
        S.notifications,
        S.subjects,
        S.courses
    ] = await Promise.all([
        json("posts.json"),
        json("notifications.json"),
        json("subjects.json"),
        json("courses.json")
    ]);

    renderHome();
    renderSubjects();
    renderCourses();
    renderNotifications();
    renderChallenges();

    if ($("#loginForm")) {
        $("#loginForm").onsubmit = login;
    }

    if ($("#logoutButton")) {
        $("#logoutButton").onclick = logout;
    }

    if ($("#startChallenge")) {
        $("#startChallenge").onclick = () => go("challenges");
    }

    if ($("#createChallenge")) {
        $("#createChallenge").onclick = challengeModal;
    }

    if ($("#refreshRanking")) {
        $("#refreshRanking").onclick = ranking;
    }

    if ($("#notificationButton")) {
        $("#notificationButton").onclick = () => go("notifications");
    }

    if ($("#mobileMenu")) {
        $("#mobileMenu").onclick = () => {
            $(".sidebar")?.classList.toggle("open");
        };
    }

    if ($("#aiQuestion")) {
        $("#aiQuestion").oninput = event => {
            if ($("#aiCount")) {
                $("#aiCount").textContent =
                    `${event.target.value.length} / 5000`;
            }
        };
    }

    if ($("#aiForm")) {
        $("#aiForm").onsubmit = askAI;
    }

    if ($("#newAI")) {
        $("#newAI").onclick = resetAI;
    }

    if ($("#closeModal")) {
        $("#closeModal").onclick = closeModal;
    }

    if ($("#modalBackdrop")) {
        $("#modalBackdrop").onclick = event => {
            if (event.target.id === "modalBackdrop") {
                closeModal();
            }
        };
    }

    document.addEventListener("click", event => {
        const nav = event.target.closest("[data-view]");

        if (nav) {
            event.preventDefault();

            if (nav.dataset.libraryTab) {
                setTab(nav.dataset.libraryTab);
            }

            go(nav.dataset.view);
        }

        const tab = event.target.closest("[data-library-tab]");

        if (tab) {
            setTab(tab.dataset.libraryTab);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

/* =========================================
   5. التنقل بين الصفحات
========================================= */

function go(view) {
    S.view = view;

    if (view === "ranking") {
        ranking();
    }

    if (view === "profile") {
        profile();
    }

    $$(".view").forEach(element => {
        element.classList.toggle(
            "active",
            element.id === "view-" + view
        );
    });

    $$(".nav[data-view]").forEach(element => {
        element.classList.toggle(
            "active",
            element.dataset.view === view
        );
    });

    $(".sidebar")?.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================
   6. تسجيل الدخول
========================================= */

async function login(event) {
    event.preventDefault();

    const number = $("#studentNumber")?.value.trim();
    const password = $("#studentPassword")?.value;
    const button = $("#loginButton");

    if (!number || !password) {
        msg(
            $("#loginMessage"),
            "أدخل رقم الطالب وكلمة المرور.",
            "error"
        );

        return;
    }

    if (!db) {
        msg(
            $("#loginMessage"),
            "تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.",
            "error"
        );

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "جارٍ التحقق…";
    }

    msg($("#loginMessage"), "");

    try {
        const { data, error } = await db.rpc(
            cfg.rpc?.loginStudent || "login_student",
            {
                p_student_number: number,
                p_password: password
            }
        );

        if (error) {
            console.error("Login RPC error:", error);

            throw new Error(
                "تعذر التحقق من بيانات الدخول. تحقق من دالة تسجيل الدخول وصلاحياتها."
            );
        }

        const student = Array.isArray(data)
            ? data[0]
            : data;

        if (!student) {
            throw new Error(
                "رقم الطالب أو كلمة المرور غير صحيحة."
            );
        }

        if (!student.id || !student.student_number) {
            console.error(
                "بيانات الطالب غير مكتملة:",
                student
            );

            throw new Error(
                "أعادت قاعدة البيانات بيانات طالب غير مكتملة."
            );
        }

        S.student = student;

        $("#loginScreen")?.classList.add("hidden");
        $("#appShell")?.classList.remove("hidden");

        updateStudentUI();

        renderHome();
        profile();
        go("home");

        toast(`مرحبًا ${student.name || "طالب تكي"}`);

    } catch (error) {
        console.error("TAKI login error:", error);

        msg(
            $("#loginMessage"),
            error.message || "حدث خطأ أثناء تسجيل الدخول.",
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "دخول إلى المنصة ←";
        }
    }
}

/* =========================================
   7. تحديث بيانات الطالب في الواجهة
========================================= */

function updateStudentUI() {
    const student = S.student;

    if (!student) return;

    const name = student.name || "طالب تكي";
    const initial = name.trim().charAt(0) || "ت";

    if ($("#topGreeting")) {
        $("#topGreeting").textContent =
            `أهلًا ${name}، لنصنع إنجازًا جديدًا ✦`;
    }

    if ($("#sideName")) {
        $("#sideName").textContent = name;
    }

    if ($("#sideLevel")) {
        $("#sideLevel").textContent =
            `المستوى ${Number(student.level || 1)}`;
    }

    if ($("#sideAvatar")) {
        $("#sideAvatar").textContent = initial;
    }

    if ($("#topAvatar")) {
        $("#topAvatar").textContent = initial;
    }
}

/* =========================================
   8. تسجيل الخروج
========================================= */

function logout() {
    if (S.timer) {
        clearInterval(S.timer);
        S.timer = null;
    }

    S.student = null;
    S.quiz = null;
    S.finishing = false;

    $("#appShell")?.classList.add("hidden");
    $("#loginScreen")?.classList.remove("hidden");

    if ($("#studentPassword")) {
        $("#studentPassword").value = "";
    }

    msg($("#loginMessage"), "");
}

/* =========================================
   9. تبويبات المكتبة
========================================= */

function setTab(tab) {
    S.tab = tab;

    $$(".segment").forEach(element => {
        element.classList.toggle(
            "active",
            element.dataset.libraryTab === tab
        );
    });

    $("#subjectsPanel")?.classList.toggle(
        "hidden",
        tab !== "subjects"
    );

    $("#coursesPanel")?.classList.toggle(
        "hidden",
        tab !== "courses"
    );

    $("#contentPanel")?.classList.add("hidden");
}

/* =========================================
   10. الصفحة الرئيسية
========================================= */

function renderHome() {
    const notification = S.notifications[0];

    $("#announcement")?.classList.toggle(
        "hidden",
        !notification
    );

    if (notification && $("#announcement")) {
        $("#announcement").innerHTML = `
            <b>⚑ ${esc(notification.title)}</b>
            — ${esc(
                notification.body ||
                notification.message ||
                ""
            )}
        `;
    }

    if ($("#homeCourses")) {
        $("#homeCourses").innerHTML =
            S.courses.slice(0, 3).map(courseCard).join("") ||
            empty("أضف الكورسات إلى courses.json");
    }

    if ($("#homePosts")) {
        $("#homePosts").innerHTML =
            S.posts.slice(0, 4).map(postCard).join("") ||
            empty("لا توجد منشورات");
    }

    bindCourses();
}

function courseCard(course) {
    return `
        <article class="course-card">

            <div
                class="course-art"
                style="--glow:${esc(course.color || "#8c34ed")}"
            >
                <img
                    src="${esc(course.image || `assets/courses/${course.id}.png`)}"
                    alt="${esc(course.title || "كورس")}"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='block'
                    "
                >

                <span class="course-letter" style="display:none">
                    ${esc((course.title || "?")[0])}
                </span>
            </div>

            <div class="course-body">
                <h3>${esc(course.title)}</h3>

                <p>
                    ${esc(course.description || "ابدأ رحلة تعلم جديدة.")}
                </p>

                <div class="course-meta">
                    <span>
                        ${esc(course.level || "كل المستويات")}
                    </span>

                    <button data-course="${esc(course.id)}">
                        استكشف ←
                    </button>
                </div>
            </div>

        </article>
    `;
}

function postCard(post) {
    return `
        <article class="post">
            <small>${esc(post.category || "منصة تكي")}</small>
            <h3>${esc(post.title || "منشور")}</h3>
            <p>${esc(post.body || post.content || "")}</p>
        </article>
    `;
}

function bindCourses() {
    $$("[data-course]").forEach(button => {
        button.onclick = () => openCourse(button.dataset.course);
    });
}

/* =========================================
   11. عرض الكورسات والمواد
========================================= */

function renderCourses() {
    if (!$("#coursesGrid")) return;

    $("#coursesGrid").innerHTML =
        S.courses.map(courseCard).join("") ||
        empty("لا توجد كورسات");

    bindCourses();
}

function renderSubjects() {
    if (!$("#subjectsGrid")) return;

    $("#subjectsGrid").innerHTML = S.subjects.map(subject => `
        <button
            class="subject-card"
            data-subject="${esc(subject.id)}"
        >
            <i>${esc(subject.icon || "▤")}</i>
            <b>${esc(subject.title)}</b>
            <small>
                ${esc(subject.description || "مادة دراسية")}
            </small>
        </button>
    `).join("") || empty("لا توجد مواد");

    $$("[data-subject]").forEach(button => {
        button.onclick = () => openSubject(button.dataset.subject);
    });
}

async function openCourse(id) {
    const course = S.courses.find(item => item.id === id);

    if (!course) return;

    const data = await json(
        `courses/${id}.json`,
        {
            posts: [],
            quiz: [],
            code: [],
            english: []
        }
    );

    const actions = [
        ["posts", "منشورات وشرح", "المحتوى المرجعي"],
        ["quiz", "اختيار من متعدد", "20 سؤالًا · 10 دقائق"],
        ["code", "تحدي كتابة الكود", "دون مؤقت"]
    ];

    if (id === "english") {
        actions.push([
            "english",
            "استماع وكتابة",
            "استمع ثم اكتب"
        ]);
    }

    content(
        course.title,
        course.description,
        actions,
        data,
        id,
        "course"
    );
}

async function openSubject(id) {
    const subject = S.subjects.find(item => item.id === id);

    if (!subject) return;

    const data = await json(
        `subjects/${id}.json`,
        {
            posts: [],
            quiz: []
        }
    );

    content(
        subject.title,
        subject.description,
        [
            ["posts", "منشورات المادة", "المحتوى المرجعي"],
            ["quiz", "اختبار المادة", "20 سؤالًا · 10 دقائق"]
        ],
        data,
        id,
        "subject"
    );
}

/* =========================================
   12. محتوى المادة أو الكورس
========================================= */

function content(title, description, actions, data, id, kind) {
    $("#subjectsPanel")?.classList.add("hidden");
    $("#coursesPanel")?.classList.add("hidden");

    const panel = $("#contentPanel");

    if (!panel) return;

    panel.classList.remove("hidden");

    panel.innerHTML = `
        <button class="back" id="contentBack">
            ← العودة للمكتبة
        </button>

        <h2>${esc(title)}</h2>
        <p>${esc(description || "")}</p>

        <div class="content-actions">
            ${actions.map(action => `
                <button
                    class="content-action"
                    data-action="${esc(action[0])}"
                >
                    <b>${esc(action[1])}</b>
                    <small>${esc(action[2])}</small>
                </button>
            `).join("")}
        </div>

        <div id="resources"></div>
    `;

    $("#contentBack").onclick = () => setTab(S.tab);

    $$("[data-action]", panel).forEach(button => {
        button.onclick = () => {
            const action = button.dataset.action;

            if (action === "posts") {
                resources(data.posts || []);
            }

            if (action === "quiz") {
                startQuiz({
                    title,
                    part: "اختيار من متعدد",
                    questions: (data.quiz || []).slice(
                        0,
                        Number(cfg.quiz?.defaultQuestionCount || 20)
                    ),
                    timed: true,
                    mode: "mc"
                });
            }

            if (action === "code") {
                startQuiz({
                    title,
                    part: "كتابة الكود",
                    questions: data.code || [],
                    mode: "code"
                });
            }

            if (action === "english") {
                startQuiz({
                    title,
                    part: "تدريب الإنجليزية",
                    questions: data.english || [],
                    mode: "english"
                });
            }
        };
    });

    resources(data.posts || []);
}

function resources(items) {
    const target = $("#resources");

    if (!target) return;

    target.innerHTML = items.length
        ? items.map(item => `
            <article class="resource">
                <b>${esc(item.title || "درس")}</b>

                <p>
                    ${esc(item.body || item.content || "")}
                </p>

                ${
                    item.url
                        ? `<a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="${esc(item.url)}"
                        >فتح المرجع ↗</a>`
                        : ""
                }
            </article>
        `).join("")
        : empty(
            "لا توجد منشورات بعد",
            "أضف الدروس في ملف JSON الخاص بالمادة أو الكورس."
        );
}

/* =========================================
   13. نظام الاختبارات
========================================= */

function startQuiz(quiz) {
    if (!S.student) {
        toast("سجّل الدخول أولًا.");
        return;
    }

    if (!quiz.questions?.length) {
        toast("لا توجد أسئلة لهذا النوع في JSON بعد.");
        return;
    }

    if (S.timer) {
        clearInterval(S.timer);
        S.timer = null;
    }

    S.quiz = quiz;
    S.index = 0;
    S.answers = Array(quiz.questions.length).fill(null);

    S.seconds = Number(
        cfg.quiz?.defaultDurationSeconds || 600
    );

    S.start = Date.now();
    S.finishing = false;

    go("quiz");
    quizQuestion();

    if (quiz.timed) {
        S.timer = setInterval(() => {
            S.seconds--;

            const timer = $("#timer");

            if (timer) {
                timer.textContent = fmt(S.seconds);
            }

            if (S.seconds <= 0) {
                finish(true);
            }
        }, 1000);
    }
}

function fmt(seconds) {
    seconds = Math.max(0, seconds);

    return (
        String(Math.floor(seconds / 60)).padStart(2, "0") +
        ":" +
        String(seconds % 60).padStart(2, "0")
    );
}

function quizQuestion() {
    const quiz = S.quiz;

    if (!quiz) return;

    const question = quiz.questions[S.index];
    const index = S.index;
    const mode = quiz.mode;

    let body = "";

    if (mode === "code") {
        body = `
            <p class="hint">
                ${esc(question.explanation || "اقرأ المطلوب واكتب الحل.")}
            </p>

            ${
                question.code
                    ? `<pre class="code-block">${esc(question.code)}</pre>`
                    : ""
            }

            <textarea
                id="codeAnswer"
                class="code-answer"
                spellcheck="false"
                placeholder="اكتب الكود هنا..."
            >${esc(S.answers[index] || "")}</textarea>
        `;
    }

    else if (mode === "english") {
        body = `
            <p class="hint">
                ${esc(question.instruction || "استمع إلى الجملة ثم اكتبها كما سمعتها.")}
            </p>

            <div class="listen">
                <button id="speak" type="button">
                    ▶ استمع إلى الجملة
                </button>

                <span>يمكنك الاستماع أكثر من مرة.</span>
            </div>

            <input
                id="englishAnswer"
                placeholder="اكتب الجملة الإنجليزية هنا..."
                style="
                    width:100%;
                    margin-top:12px;
                    background:#080510;
                    color:white;
                    border:1px solid #bd72ff30;
                    border-radius:12px;
                    padding:14px;
                "
                value="${esc(S.answers[index] || "")}"
            >

            <p class="hint">لن تظهر الجملة قبل الإجابة.</p>
        `;
    }

    else {
        body = `
            <div class="options">
                ${(question.options || []).map((option, optionIndex) => `
                    <button
                        class="option ${
                            S.answers[index] === optionIndex ? "selected" : ""
                        }"
                        data-option="${optionIndex}"
                    >
                        <span class="option-letter">
                            ${String.fromCharCode(65 + optionIndex)}
                        </span>

                        ${esc(option)}
                    </button>
                `).join("")}
            </div>
        `;
    }

    $("#quizMount").innerHTML = `
        <div class="quiz-shell">

            <div class="quiz-top">
                <button id="quit" type="button">
                    ← إنهاء والعودة
                </button>

                <span class="counter">
                    ${esc(quiz.title)} · ${esc(quiz.part)}
                </span>

                <b id="timer">
                    ${quiz.timed ? fmt(S.seconds) : "∞"}
                </b>
            </div>

            <div class="progress">
                <span style="width:${Math.round(
                    (index / quiz.questions.length) * 100
                )}%"></span>
            </div>

            <article class="quiz-card">
                <span class="quiz-tag">
                    ${
                        mode === "code"
                            ? "CODE CHALLENGE"
                            : mode === "english"
                                ? "ENGLISH LISTENING"
                                : "KNOWLEDGE CHECK"
                    }
                </span>

                <h2>
                    ${esc(
                        question.prompt ||
                        question.question ||
                        question.sentence ||
                        "أجب عن السؤال"
                    )}
                </h2>

                ${body}

                <div class="quiz-controls">
                    <span class="counter">
                        السؤال ${index + 1} من ${quiz.questions.length}
                    </span>

                    <button class="btn primary" id="next" type="button">
                        ${
                            index === quiz.questions.length - 1
                                ? "إنهاء ومراجعة"
                                : "السؤال التالي ←"
                        }
                    </button>
                </div>
            </article>
        </div>
    `;

    $("#quit").onclick = () => {
        if (confirm("إنهاء الاختبار دون احتساب النتيجة؟")) {
            clearInterval(S.timer);
            S.timer = null;
            S.quiz = null;
            go("library");
        }
    };

    if (mode === "code") {
        $("#codeAnswer").oninput = event => {
            S.answers[index] = event.target.value;
        };
    }

    if (mode === "english") {
        $("#englishAnswer").oninput = event => {
            S.answers[index] = event.target.value;
        };

        $("#speak").onclick = () => {
            speak(question.sentence || question.answer || "");
        };
    }

    $$("[data-option]").forEach(button => {
        button.onclick = () => {
            S.answers[index] = Number(button.dataset.option);

            $$("[data-option]").forEach(option => {
                option.classList.toggle(
                    "selected",
                    option === button
                );
            });
        };
    });

    $("#next").onclick = () => {
        if (S.finishing) return;

        if (mode === "mc" && S.answers[index] === null) {
            return toast("اختر إجابة قبل المتابعة.");
        }

        if (
            mode === "english" &&
            !String(S.answers[index] || "").trim()
        ) {
            return toast("اكتب الجملة أولًا.");
        }

        if (index === quiz.questions.length - 1) {
            finish(false);
        } else {
            S.index++;
            quizQuestion();
        }
    };
}

function speak(text) {
    if (!("speechSynthesis" in window)) {
        return toast("المتصفح لا يدعم القراءة الصوتية.");
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.82;

    speechSynthesis.speak(utterance);
}

/* =========================================
   14. تصحيح الإجابات
========================================= */

function norm(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/, "")
        .toLowerCase();
}

function correct(question, answer, mode) {
    if (mode === "code") {
        const expectedCode =
            question.answer || question.expectedCode;

        return Boolean(expectedCode) &&
            String(answer || "").replace(/\r\n/g, "\n").trim() ===
            String(expectedCode).replace(/\r\n/g, "\n").trim();
    }

    if (mode === "english") {
        return norm(answer) === norm(
            question.answer || question.sentence
        );
    }

    return Number(answer) === Number(
        question.correctIndex ?? question.answerIndex ?? 0
    );
}

/* =========================================
   15. حفظ نتيجة الاختبار في Supabase
========================================= */

async function saveResultToDatabase(record) {
    if (!db) {
        throw new Error("اتصال قاعدة البيانات غير متاح.");
    }

    if (!S.student?.id) {
        throw new Error("لم يتم تحديد هوية الطالب.");
    }

    const params = {
        p_student_id: S.student.id,
        p_subject: String(record.title || "عام"),
        p_part: String(record.part || "اختبار"),
        p_score: Number(record.score),
        p_total_questions: Number(record.total),
        p_correct_answers: Number(record.correct),
        p_wrong_answers: Number(record.wrong),
        p_duration_seconds: Number(record.elapsed)
    };

    const { data, error } = await db.rpc(
        cfg.rpc?.submitTestResult || "submit_test_result",
        params
    );

    if (error) {
        console.error("Save result RPC error:", error);

        throw new Error(
            error.message ||
            "تعذر حفظ النتيجة في قاعدة البيانات."
        );
    }

    return data;
}

/* =========================================
   16. إنهاء الاختبار
========================================= */

async function finish(auto) {
    if (!S.quiz || S.finishing) return;

    S.finishing = true;

    if (S.timer) {
        clearInterval(S.timer);
        S.timer = null;
    }

    const quiz = S.quiz;

    const results = quiz.questions.map((question, index) => ({
        q: question,
        a: S.answers[index],
        ok: correct(
            question,
            S.answers[index],
            quiz.mode
        )
    }));

    const right = results.filter(item => item.ok).length;
    const total = results.length;

    const elapsed = Math.round(
        (Date.now() - S.start) / 1000
    );

    const record = {
        title: quiz.title,
        part: quiz.part,
        score: right,
        total,
        correct: right,
        wrong: total - right,
        percent: total
            ? Math.round((right / total) * 100)
            : 0,
        elapsed,
        date: new Date().toISOString(),
        databaseSaved: false,

        review: results.map(item => ({
            question:
                item.q.prompt ||
                item.q.question ||
                item.q.sentence ||
                "السؤال",

            answer: answerText(
                item.q,
                item.a,
                quiz.mode
            ),

            expected: expected(
                item.q,
                quiz.mode
            ),

            ok: item.ok,
            explanation: item.q.explanation || ""
        }))
    };

    // الحفظ المحلي لا يعني الحفظ الرسمي في قاعدة البيانات.
    const history = readHistory();

    history.unshift(record);

    localStorage.setItem(
        historyKey(),
        JSON.stringify(history.slice(0, 100))
    );

    try {
        await saveResultToDatabase(record);

        record.databaseSaved = true;

        const updatedHistory = readHistory();

        if (updatedHistory.length) {
            updatedHistory[0] = record;

            localStorage.setItem(
                historyKey(),
                JSON.stringify(updatedHistory.slice(0, 100))
            );
        }

        toast("تم حفظ النتيجة في قاعدة البيانات.");

    } catch (error) {
        console.error("Database result save failed:", error);

        toast(
            "حُفظت النتيجة محليًا، لكن تعذر تأكيد حفظها في قاعدة البيانات."
        );
    }

    result(record, auto);
    profile();

    S.finishing = false;
}

function answerText(question, answer, mode) {
    if (
        answer === null ||
        answer === undefined ||
        answer === ""
    ) {
        return "لم تتم الإجابة";
    }

    if (mode === "mc") {
        return question.options?.[Number(answer)] ?? String(answer);
    }

    return String(answer);
}

function expected(question, mode) {
    if (mode === "mc") {
        return question.options?.[
            Number(question.correctIndex ?? question.answerIndex ?? 0)
        ] ?? "غير محدد";
    }

    return String(
        question.answer ||
        question.expectedCode ||
        question.sentence ||
        "غير محدد"
    );
}

/* =========================================
   17. عرض نتيجة الاختبار
========================================= */

function result(record, auto) {
    $("#quizMount").innerHTML = `
        <div class="quiz-shell">

            <div class="quiz-card result">
                <small class="eyebrow">QUIZ COMPLETE</small>

                <div class="result-score">
                    ${record.percent}%
                </div>

                <h2>
                    ${
                        record.percent >= 80
                            ? "أداء رائع!"
                            : "واصل التعلّم والتقدّم"
                    }
                </h2>

                <p class="hint">
                    ${
                        auto
                            ? "انتهى الوقت. تم تصحيح الإجابات."
                            : "اكتمل الاختبار وتم تصحيح إجاباتك."
                    }
                </p>

                <p class="hint">
                    ${
                        record.databaseSaved
                            ? "✓ تم تأكيد حفظ النتيجة في قاعدة البيانات."
                            : "⚠ النتيجة محفوظة محليًا، لكن لم يتأكد حفظها في قاعدة البيانات."
                    }
                </p>

                <div class="stats">
                    <div class="stat">
                        <span>الصحيحة</span>
                        <b>${record.correct}</b>
                    </div>

                    <div class="stat">
                        <span>الخاطئة</span>
                        <b>${record.wrong}</b>
                    </div>

                    <div class="stat">
                        <span>الدرجة</span>
                        <b>${record.score}/${record.total}</b>
                    </div>

                    <div class="stat">
                        <span>الوقت</span>
                        <b>${fmt(record.elapsed)}</b>
                    </div>
                </div>

                <button id="backResult" class="btn primary">
                    العودة إلى المكتبة
                </button>
            </div>

            <div class="section-head">
                <h2>المراجعة والتصحيح</h2>
            </div>

            <div class="review-list">
                ${record.review.map((item, index) => `
                    <article class="review-item">

                        <b class="${item.ok ? "" : "bad"}">
                            ${item.ok ? "✓ إجابة صحيحة" : "✕ إجابة غير صحيحة"}
                            · ${index + 1}.
                            ${esc(item.question)}
                        </b>

                        <p>
                            <strong>إجابتك:</strong>
                            ${esc(item.answer)}

                            <br>

                            <strong>الصحيح:</strong>
                            ${esc(item.expected)}

                            ${
                                item.explanation
                                    ? `<br><strong>الشرح:</strong>
                                       ${esc(item.explanation)}`
                                    : ""
                            }
                        </p>
                    </article>
                `).join("")}
            </div>

        </div>
    `;

    $("#backResult").onclick = () => {
        S.quiz = null;
        go("library");
    };
}

/* =========================================
   18. الملف الشخصي وسجل الاختبارات
========================================= */

function readHistory() {
    try {
        return JSON.parse(
            localStorage.getItem(historyKey()) || "[]"
        );
    } catch {
        return [];
    }
}

function profile() {
    if (!S.student) return;

    const student = S.student;
    const history = readHistory();

    if ($("#profileCard")) {
        $("#profileCard").innerHTML = `
            <div class="profile-avatar">
                ${esc((student.name || "ت")[0])}
            </div>

            <div>
                <small class="eyebrow">TAKI MEMBER</small>

                <h2>${esc(student.name || "طالب تكي")}</h2>

                <p>
                    الرقم الدراسي:
                    ${esc(student.student_number || "—")}

                    ·

                    ${esc(student.specialization || "متعلم")}
                </p>
            </div>

            <div class="profile-extra">
                المستوى
                <br>
                <b>${Number(student.level || 1)}</b>
            </div>
        `;
    }

    if ($("#profileStats")) {
        $("#profileStats").innerHTML = [
            ["النقاط الرسمية", student.points || 0, "قاعدة البيانات"],
            ["المستوى", student.level || 1, "قاعدة البيانات"],
            ["اختبارات مكتملة", student.tests_count || 0, "قاعدة البيانات"],
            ["الإجابات الصحيحة", student.correct_answers || 0, "قاعدة البيانات"],
            ["الإجابات الخاطئة", student.wrong_answers || 0, "قاعدة البيانات"],
            ["سجل محلي", history.length, "هذا الجهاز"]
        ].map(item => `
            <div class="stat">
                <span>${esc(item[0])}</span>
                <b>${Number(item[1])}</b>
                <small>${esc(item[2])}</small>
            </div>
        `).join("");
    }

    if ($("#localHistory")) {
        $("#localHistory").innerHTML = history.length
            ? history.map(record => `
                <div class="history-row">
                    <div>✓</div>

                    <div>
                        <b>
                            ${esc(record.title)}
                            —
                            ${esc(record.part)}
                        </b>

                        <small>
                            ${new Date(record.date).toLocaleString("ar")}
                        </small>

                        <small>
                            ${
                                record.databaseSaved
                                    ? "محفوظ في قاعدة البيانات"
                                    : "محفوظ محليًا فقط أو لم يتأكد الحفظ"
                            }
                        </small>
                    </div>

                    <div class="history-score">
                        ${record.score}/${record.total}
                        ·
                        ${record.percent}%
                    </div>
                </div>
            `).join("")
            : empty(
                "لم تكمل أي اختبار بعد",
                "ستظهر نتائجك هنا محليًا."
            );
    }
}

/* =========================================
   19. ترتيب الطلاب من Supabase
========================================= */

async function ranking() {
    const target = $("#rankingTable");

    if (!target) return;

    if (!S.student) {
        target.innerHTML = empty("سجّل الدخول أولًا");
        return;
    }

    if (!db) {
        target.innerHTML = empty(
            "قاعدة البيانات غير مهيأة",
            "تحقق من js/config.js"
        );

        return;
    }

    target.innerHTML = empty("جارٍ تحميل الترتيب…");

    try {
        const { data, error } = await db.rpc(
            cfg.rpc?.getRanking || "get_ranking"
        );

        if (error) throw error;

        const limit = Number(cfg.ranking?.limit || 20);

        target.innerHTML = (data || [])
            .slice(0, limit)
            .map((student, index) => `
                <div class="rank-row ${
                    student.student_number === S.student.student_number
                        ? "me"
                        : ""
                }">

                    <div class="rank-n">
                        ${index + 1}
                    </div>

                    <div class="rank-name">
                        <b>
                            ${esc(student.name || "طالب")}

                            ${
                                student.student_number ===
                                S.student.student_number
                                    ? " · أنت"
                                    : ""
                            }
                        </b>

                        <small>
                            ${esc(student.specialization || "طالب تكي")}
                        </small>
                    </div>

                    <div class="rank-points">
                        ${Number(student.points || 0)} XP
                    </div>

                    <div class="rank-level">
                        المستوى ${Number(student.level || 1)}
                    </div>
                </div>
            `).join("") || empty("لا يوجد طلاب");

    } catch (error) {
        console.error("Ranking error:", error);

        target.innerHTML = empty(
            "تعذر تحميل الترتيب",
            error.message || "تحقق من دالة get_ranking وصلاحياتها."
        );
    }
}

/* =========================================
   20. التنبيهات
========================================= */

function renderNotifications() {
    const target = $("#notificationsList");

    if (!target) return;

    target.innerHTML = S.notifications.length
        ? S.notifications.map(notification => `
            <article class="post">
                <small>✧ تنبيه</small>

                <h3>
                    ${esc(notification.title || "تنبيه")}
                </h3>

                <p>
                    ${esc(
                        notification.body ||
                        notification.message ||
                        ""
                    )}
                </p>
            </article>
        `).join("")
        : empty("لا توجد تنبيهات");
}

/* =========================================
   21. التحديات المحلية
========================================= */

function readChallenges() {
    try {
        return JSON.parse(
            localStorage.getItem("taki_challenges_demo") || "[]"
        );
    } catch {
        return [];
    }
}

function renderChallenges() {
    const target = $("#challengeList");

    if (!target) return;

    const challenges = readChallenges();

    target.innerHTML = challenges.length
        ? challenges.map((challenge, index) => `
            <article class="challenge-card">

                <small>
                    ${
                        challenge.type === "group"
                            ? "OPEN SQUAD"
                            : "DUEL ARENA"
                    }
                    · مسودة محلية
                </small>

                <h3>${esc(challenge.title)}</h3>

                <p>
                    المادة: ${esc(challenge.subject)}

                    <br>

                    النوع: ${esc(challenge.quizType)}
                    ·
                    ${Number(challenge.count)} أسئلة

                    <br>

                    أنشأها: ${esc(challenge.owner)}
                </p>

                <button class="btn ghost" data-join="${index}">
                    تجربة الانضمام
                </button>

            </article>
        `).join("")
        : empty(
            "الساحة هادئة حاليًا",
            "أنشئ تحديًا لتجربة تصميم الواجهة."
        );

    $$("[data-join]").forEach(button => {
        button.onclick = () => {
            toast(
                "هذه مسودة محلية فقط؛ المنافسة الحقيقية تحتاج إلى خادم وتزامن آمن."
            );
        };
    });
}

function challengeModal() {
    if (!$("#modalContent") || !$("#modalBackdrop")) return;

    const options = S.subjects.map(subject => `
        <option value="${esc(subject.title)}">
            ${esc(subject.title)}
        </option>
    `).join("");

    $("#modalContent").innerHTML = `
        <small class="eyebrow">CREATE MATCH</small>

        <h2>إنشاء تحدٍ جديد ⚡</h2>

        <p class="hint">
            هذه مسودة محلية. لا تُرسل دعوات حقيقية حتى إعداد الخادم.
        </p>

        <form id="challengeForm">

            <label>اسم التحدي</label>

            <input
                id="ctitle"
                maxlength="80"
                required
                placeholder="تحدي المبرمجين"
            >

            <label>نوع المنافسة</label>

            <select id="ctype">
                <option value="duel">
                    تحدٍ فردي (لاعب ضد لاعب)
                </option>

                <option value="group">
                    تحدٍ جماعي مفتوح
                </option>
            </select>

            <label>المادة الدراسية</label>

            <select id="csubject">
                ${options || "<option>عام</option>"}
            </select>

            <label>نوع الأسئلة</label>

            <select id="ctypeq">
                <option>اختيار من متعدد</option>
                <option>كتابة كود</option>
                <option>اللغة الإنجليزية</option>
            </select>

            <label>عدد الأسئلة</label>

            <select id="ccount">
                <option>5</option>
                <option selected>10</option>
                <option>15</option>
                <option>20</option>
            </select>

            <button class="btn primary wide">
                إنشاء المسودة ←
            </button>

        </form>
    `;

    $("#challengeForm").onsubmit = event => {
        event.preventDefault();

        const challenges = readChallenges();

        challenges.unshift({
            title: $("#ctitle").value.trim(),
            type: $("#ctype").value,
            subject: $("#csubject").value,
            quizType: $("#ctypeq").value,
            count: Number($("#ccount").value),
            owner: S.student?.name || "أنا"
        });

        localStorage.setItem(
            "taki_challenges_demo",
            JSON.stringify(challenges.slice(0, 30))
        );

        closeModal();
        renderChallenges();

        toast("تم إنشاء مسودة التحدي محليًا.");
    };

    $("#modalBackdrop").classList.remove("hidden");
}

function closeModal() {
    $("#modalBackdrop")?.classList.add("hidden");
}

/* =========================================
   22. المساعد الذكي
========================================= */

async function askAI(event) {
    event.preventDefault();

    const question = $("#aiQuestion")?.value.trim();

    if (!question) {
        msg($("#aiMessage"), "اكتب سؤالك أولًا.", "error");
        return;
    }

    if (question.length > 5000) {
        msg(
            $("#aiMessage"),
            "الحد الأقصى للسؤال 5000 حرف.",
            "error"
        );

        return;
    }

    if (!db) {
        msg(
            $("#aiMessage"),
            "أكمل إعدادات Supabase أولًا.",
            "error"
        );

        return;
    }

    const button = $("#askAI");

    if (!button) return;

    button.disabled = true;
    button.textContent = "جارٍ إعداد الإجابة…";

    msg($("#aiMessage"), "");

    $("#aiAnswer")?.classList.add("hidden");

    try {
        const { data, error } = await db.functions.invoke(
            cfg.functions?.askGemini || "ask-gemini",
            {
                body: { question }
            }
        );

        if (error) throw error;

        if (!data?.answer) {
            throw new Error(
                data?.error || "لم تصل إجابة من المساعد."
            );
        }

        $("#aiAnswer").textContent = data.answer;
        $("#aiAnswer").classList.remove("hidden");

        $("#newAI")?.classList.remove("hidden");

        msg(
            $("#aiMessage"),
            "وصلت الإجابة. لم تُحفظ المحادثة في قاعدة البيانات.",
            "success"
        );

    } catch (error) {
        console.error("AI function error:", error);

        msg(
            $("#aiMessage"),
            "تعذر الحصول على إجابة. تحقق من نشر وظيفة ask-gemini ومفاتيح Gemini. " +
            (error.message || ""),
            "error"
        );

    } finally {
        button.disabled = false;
        button.textContent = "إرسال الاستفسار ←";
    }
}

function resetAI() {
    if ($("#aiQuestion")) {
        $("#aiQuestion").value = "";
    }

    if ($("#aiCount")) {
        $("#aiCount").textContent = "0 / 5000";
    }

    if ($("#aiAnswer")) {
        $("#aiAnswer").textContent = "";
        $("#aiAnswer").classList.add("hidden");
    }

    $("#newAI")?.classList.add("hidden");

    msg($("#aiMessage"), "");

    $("#aiQuestion")?.focus();
}

})();
