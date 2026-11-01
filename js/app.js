(() => {
"use strict";

/* =========================================
   1. الإعدادات والاتصال بقاعدة البيانات
========================================= */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const cfg = window.TAKI_CONFIG || {};

const ready =
    window.supabase &&
    cfg.SUPABASE_URL &&
    !cfg.SUPABASE_URL.includes("YOUR_PROJECT") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

const db = ready
    ? window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )
    : null;

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
    start: 0
};

/* =========================================
   2. أدوات مساعدة
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
        const response = await fetch(
            (cfg.DATA_BASE_PATH || "data/") + path,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("تعذر تحميل الملف: " + path);
        }

        return await response.json();
    } catch (error) {
        console.warn("تعذر تحميل البيانات:", path, error);
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
   3. بدء التطبيق
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

    $("#loginForm").onsubmit = login;
    $("#logoutButton").onclick = logout;

    $("#startChallenge").onclick = () => go("challenges");
    $("#createChallenge").onclick = challengeModal;

    $("#refreshRanking").onclick = ranking;

    $("#notificationButton").onclick = () => go("notifications");

    $("#mobileMenu").onclick = () => {
        $(".sidebar")?.classList.toggle("open");
    };

    $("#aiQuestion").oninput = event => {
        $("#aiCount").textContent =
            `${event.target.value.length} / 5000`;
    };

    $("#aiForm").onsubmit = askAI;
    $("#newAI").onclick = resetAI;
    $("#closeModal").onclick = closeModal;

    $("#modalBackdrop").onclick = event => {
        if (event.target.id === "modalBackdrop") {
            closeModal();
        }
    };

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
   4. التنقل بين الصفحات
========================================= */

function go(view) {
    S.view = view;

    if (view === "ranking") ranking();
    if (view === "profile") profile();

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
   5. تسجيل الدخول والخروج
========================================= */

async function login(event) {
    event.preventDefault();

    const number = $("#studentNumber").value.trim();
    const password = $("#studentPassword").value;
    const button = $("#loginButton");

    if (!number || !password) {
        return;
    }

    button.disabled = true;
    button.textContent = "جارٍ التحقق…";

    msg($("#loginMessage"), "");

    try {
        if (!db) {
            throw new Error(
                "أكمل إعدادات Supabase في ملف js/config.js أولًا."
            );
        }

        const { data, error } = await db.rpc(
            "login_student",
            {
                p_student_number: number,
                p_password: password
            }
        );

        if (error) throw error;

        const student = Array.isArray(data) ? data[0] : data;

        if (!student) {
            throw new Error(
                "رقم الطالب أو كلمة المرور غير صحيحة."
            );
        }

        S.student = student;

        $("#loginScreen").classList.add("hidden");
        $("#appShell").classList.remove("hidden");

        $("#topGreeting").textContent =
            `أهلًا ${student.name}، لنصنع إنجازًا جديدًا ✦`;

        $("#sideName").textContent = student.name;
        $("#sideLevel").textContent =
            `المستوى ${student.level || 1}`;

        $("#sideAvatar").textContent =
            (student.name || "ت").trim()[0];

        $("#topAvatar").textContent =
            (student.name || "ت").trim()[0];

        renderHome();
        profile();
        go("home");

        toast(`مرحبًا ${student.name}`);

    } catch (error) {
        msg(
            $("#loginMessage"),
            error.message || "تعذر تسجيل الدخول.",
            "error"
        );

    } finally {
        button.disabled = false;
        button.textContent = "دخول إلى المنصة ←";
    }
}

function logout() {
    if (S.timer) {
        clearInterval(S.timer);
        S.timer = null;
    }

    S.student = null;

    $("#appShell").classList.add("hidden");
    $("#loginScreen").classList.remove("hidden");

    $("#studentPassword").value = "";

    msg($("#loginMessage"), "");
}

/* =========================================
   6. تبويبات المكتبة
========================================= */

function setTab(tab) {
    S.tab = tab;

    $$(".segment").forEach(element => {
        element.classList.toggle(
            "active",
            element.dataset.libraryTab === tab
        );
    });

    $("#subjectsPanel").classList.toggle(
        "hidden",
        tab !== "subjects"
    );

    $("#coursesPanel").classList.toggle(
        "hidden",
        tab !== "courses"
    );

    $("#contentPanel").classList.add("hidden");
}

/* =========================================
   7. الصفحة الرئيسية
========================================= */

function renderHome() {
    const notification = S.notifications[0];

    $("#announcement").classList.toggle(
        "hidden",
        !notification
    );

    if (notification) {
        $("#announcement").innerHTML = `
            <b>⚑ ${esc(notification.title)}</b>
            — ${esc(notification.body || notification.message || "")}
        `;
    }

    $("#homeCourses").innerHTML =
        S.courses.slice(0, 3).map(courseCard).join("") ||
        empty("أضف الكورسات إلى courses.json");

    $("#homePosts").innerHTML =
        S.posts.slice(0, 4).map(postCard).join("") ||
        empty("لا توجد منشورات");

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
   8. عرض الكورسات والمواد
========================================= */

function renderCourses() {
    $("#coursesGrid").innerHTML =
        S.courses.map(courseCard).join("") ||
        empty("لا توجد كورسات");

    bindCourses();
}

function renderSubjects() {
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
   9. محتوى المادة أو الكورس
========================================= */

function content(title, description, actions, data, id, kind) {
    $("#subjectsPanel").classList.add("hidden");
    $("#coursesPanel").classList.add("hidden");

    const panel = $("#contentPanel");

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
                    data-action="${action[0]}"
                >
                    <b>${action[1]}</b>
                    <small>${action[2]}</small>
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
                    questions: (data.quiz || []).slice(0, 20),
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
    $("#resources").innerHTML = items.length
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
   10. نظام الاختبارات
========================================= */

function startQuiz(quiz) {
    if (!quiz.questions.length) {
        toast("لا توجد أسئلة لهذا النوع في JSON بعد.");
        return;
    }

    S.quiz = quiz;
    S.index = 0;
    S.answers = Array(quiz.questions.length).fill(null);
    S.seconds = 600;
    S.start = Date.now();

    if (S.timer) clearInterval(S.timer);

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
                clearInterval(S.timer);
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
                <button id="speak">▶ استمع إلى الجملة</button>
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
                <button id="quit">← إنهاء والعودة</button>

                <span class="counter">
                    ${esc(quiz.title)} · ${esc(quiz.part)}
                </span>

                <b id="timer">
                    ${quiz.timed ? fmt(S.seconds) : "∞"}
                </b>
            </div>

            <div class="progress">
                <span style="width:${Math.round(
                    index / quiz.questions.length * 100
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

                    <button class="btn primary" id="next">
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
   11. تصحيح الإجابات وحساب النتيجة
========================================= */

function norm(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/,"")
        .toLowerCase();
}

function correct(question, answer, mode) {
    if (mode === "code") {
        const expected = question.answer || question.expectedCode;

        return Boolean(expected) &&
            String(answer || "").replace(/\r\n/g, "\n").trim() ===
            String(expected).replace(/\r\n/g, "\n").trim();
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

function finish(auto) {
    clearInterval(S.timer);
    S.timer = null;

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
        percent: Math.round(right / total * 100),
        elapsed,
        date: new Date().toISOString(),

        review: results.map(item => ({
            question:
                item.q.prompt ||
                item.q.question ||
                item.q.sentence,

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

    const history = readHistory();

    history.unshift(record);

    localStorage.setItem(
        historyKey(),
        JSON.stringify(history.slice(0, 100))
    );

    result(record, auto);
    profile();
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
   12. عرض نتيجة الاختبار
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
                            ${esc(item.question || "السؤال")}
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

    $("#backResult").onclick = () => go("library");
}

/* =========================================
   13. الملف الشخصي وسجل الاختبارات
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

    $("#profileCard").innerHTML = `
        <div class="profile-avatar">
            ${esc((student.name || "ت")[0])}
        </div>

        <div>
            <small class="eyebrow">TAKI MEMBER</small>

            <h2>${esc(student.name)}</h2>

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

    $("#profileStats").innerHTML = [
        ["النقاط الرسمية", student.points || 0, "قاعدة البيانات"],
        ["المستوى", student.level || 1, "قاعدة البيانات"],
        ["اختبارات مكتملة", student.tests_count || 0, "قاعدة البيانات"],
        ["سجل محلي", history.length, "هذا الجهاز"]
    ].map(item => `
        <div class="stat">
            <span>${item[0]}</span>
            <b>${Number(item[1])}</b>
            <small>${item[2]}</small>
        </div>
    `).join("");

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

/* =========================================
   14. ترتيب الطلاب من Supabase
========================================= */

// يتطلب وجود دالة RPC باسم get_ranking في قاعدة بيانات تكي.

async function ranking() {
    if (!S.student) {
        $("#rankingTable").innerHTML =
            empty("سجّل الدخول أولًا");
        return;
    }

    if (!db) {
        $("#rankingTable").innerHTML = empty(
            "قاعدة البيانات غير مهيأة",
            "عدّل js/config.js"
        );
        return;
    }

    $("#rankingTable").innerHTML =
        empty("جارٍ تحميل الترتيب…");

    try {
        const { data, error } = await db.rpc("get_ranking");

        if (error) throw error;

        $("#rankingTable").innerHTML = (data || []).map(
            (student, index) => `
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
                            ${esc(student.name)}
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
            `
        ).join("") || empty("لا يوجد طلاب");

    } catch (error) {
        $("#rankingTable").innerHTML = empty(
            "تعذر تحميل الترتيب",
            error.message
        );
    }
}

/* =========================================
   15. التنبيهات
========================================= */

function renderNotifications() {
    $("#notificationsList").innerHTML =
        S.notifications.length
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
   16. التحديات
========================================= */

// هذه التحديات محلية للتجربة وليست منافسات حقيقية متعددة اللاعبين.

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
    const challenges = readChallenges();

    $("#challengeList").innerHTML = challenges.length
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
                "مسودة محلية فقط؛ المنافسة الحقيقية تحتاج إلى خادم وتزامن آمن."
            );
        };
    });
}

function challengeModal() {
    const options = S.subjects.map(subject => `
        <option>${esc(subject.title)}</option>
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
    $("#modalBackdrop").classList.add("hidden");
}

/* =========================================
   17. المساعد الذكي
========================================= */

// يستدعي وظيفة آمنة على Supabase Edge Functions.
// لا تضع مفاتيح Gemini السرية في هذا الملف.

async function askAI(event) {
    event.preventDefault();

    const question = $("#aiQuestion").value.trim();

    if (!question) return;

    if (!db) {
        msg(
            $("#aiMessage"),
            "أكمل إعدادات Supabase ثم انشر وظيفة ask-gemini مع مفاتيح Gemini كـ Secrets.",
            "error"
        );

        return;
    }

    const button = $("#askAI");

    button.disabled = true;
    button.textContent = "جارٍ إعداد الإجابة…";

    msg($("#aiMessage"), "");

    $("#aiAnswer").classList.add("hidden");

    try {
        const { data, error } = await db.functions.invoke(
            cfg.AI_FUNCTION_NAME || "ask-gemini",
            {
                body: { question }
            }
        );

        if (error) throw error;

        if (!data?.answer) {
            throw new Error(
                data?.error || "لم تصل إجابة"
            );
        }

        $("#aiAnswer").textContent = data.answer;
        $("#aiAnswer").classList.remove("hidden");
        $("#newAI").classList.remove("hidden");

        msg(
            $("#aiMessage"),
            "وصلت الإجابة. لم تُحفظ المحادثة في قاعدة البيانات.",
            "success"
        );

    } catch (error) {
        msg(
            $("#aiMessage"),
            "تعذر الحصول على إجابة. تحقق من نشر الوظيفة وإعداد مفاتيح Gemini. " +
            (error.message || ""),
            "error"
        );

    } finally {
        button.disabled = false;
        button.textContent = "إرسال الاستفسار ←";
    }
}

function resetAI() {
    $("#aiQuestion").value = "";
    $("#aiCount").textContent = "0 / 5000";

    $("#aiAnswer").textContent = "";
    $("#aiAnswer").classList.add("hidden");
    $("#newAI").classList.add("hidden");

    msg($("#aiMessage"), "");

    $("#aiQuestion").focus();
}

})();
