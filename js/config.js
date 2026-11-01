"use strict";

window.TAKI_CONFIG = Object.freeze({
    appName: "TAKI Future",
    appNameArabic: "تكي",
    appVersion: "1.0.0",

    // بيانات مشروع TAKI على Supabase
    supabaseUrl: "https://nvbqejnvluadjtosfsvs.supabase.co",
    supabaseAnonKey: "sb_publishable_CeJQOKfELj-gihwNBsOJ1Q_JJWcAZ4q",

    // أسماء دوال قاعدة البيانات
    rpc: {
        loginStudent: "login_student",
        getRanking: "get_ranking",
        submitTestResult: "submit_test_result"
    },

    // ملفات البيانات
    data: {
        courses: "data/courses.json",
        subjects: "data/subjects.json",
        posts: "data/posts.json",
        notifications: "data/notifications.json"
    },

    // الاختبارات
    quiz: {
        defaultQuestionCount: 20,
        defaultDurationSeconds: 600,
        allowReview: true
    },

    // الترتيب
    ranking: {
        limit: 20
    },

    // التخزين المحلي
    storage: {
        history: "taki_user_history_v1",
        challenges: "taki_challenges_v1",
        preferences: "taki_preferences_v1"
    },

    // الذكاء الاصطناعي
    functions: {
        askGemini: "ask-gemini"
    },

    supportEmail: "muzamiltaki893@gmail.com"
});
