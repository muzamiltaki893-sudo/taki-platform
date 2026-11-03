"use strict";

window.TAKI_CONFIG = Object.freeze({

    appName: "TAKI Future",
    appNameArabic: "تكي",
    appVersion: "1.0.0",

    // ==================================
    // SUPABASE CONNECTION
    // ==================================

    supabaseUrl: "https://nvbqejnvluadjtosfsvs.supabase.co",

    supabaseAnonKey: "sb_publishable_CeJQOKfELj-gihwNBsOJ1Q_JJWcAZ4q",

    // ==================================
    // DATABASE FUNCTIONS
    // ==================================

    rpc: {
        loginStudent: "login_student",
        submitTestResult: "taki_submit_test_result",
        getRanking: "taki_get_ranking"
    },

    // ==================================
    // DATA FILES
    // ==================================

    data: {
        courses: "data/courses.json",
        subjects: "data/subjects.json",
        posts: "data/posts.json",
        notifications: "data/notifications.json"
    },

    // ==================================
    // QUIZ SETTINGS
    // ==================================

    quiz: {
        defaultQuestionCount: 20,
        defaultDurationSeconds: 600,
        allowReview: true
    },

    // ==================================
    // RANKING SETTINGS
    // ==================================

    ranking: {
        limit: 20
    },

    // ==================================
    // LOCAL STORAGE
    // ==================================

    storage: {
        history: "taki_user_history_v1",
        challenges: "taki_challenges_v1",
        preferences: "taki_preferences_v1"
    },

    // ==================================
    // AI SETTINGS
    // ==================================

    functions: {
        askGemini: "ask-gemini"
    },

    supportEmail: "muzamiltaki893@gmail.com"

});
