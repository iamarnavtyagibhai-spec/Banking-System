/**
 * ============================================================================
 * QuizApp & NinjaBank - Google Apps Script (GAS) Backend & 24/7 Keep-Alive
 * Target URL: https://quizapp-3tdp.onrender.com
 * ============================================================================
 * 
 * FEATURES:
 * 1. 24/7 RENDER KEEP-ALIVE CRON:
 *    - Keeps https://quizapp-3tdp.onrender.com awake so Render never sleeps.
 * 
 * 2. GOOGLE SHEETS AS QUIZ DATABASE:
 *    - Sheet "Questions": Store and fetch questions dynamically via API.
 *    - Sheet "Leaderboard": Log player quiz scores, accuracy, and ranks.
 *    - Sheet "Uptime_Logs": Track 24/7 uptime health.
 * 
 * 3. REST API ENDPOINTS:
 *    - GET ?action=get_questions     -> Returns active quiz questions in JSON
 *    - GET ?action=get_leaderboard   -> Returns top scorers
 *    - GET ?action=ping              -> Manually triggers keep-alive ping
 *    - POST {action: "submit_score"} -> Saves student/player results to Sheet
 * ============================================================================
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  // Target Render URL to keep alive
  QUIZ_APP_URL: "https://quizapp-3tdp.onrender.com",
  
  // Also keep NinjaBank services alive if needed:
  BANKING_SERVICES: [
    "https://userservice-bank-spgh.onrender.com/health",
    "https://accountservice-bank-f76c.onrender.com/health",
    "https://transactionservice-bank-oxbz.onrender.com/health"
  ],

  ADMIN_EMAIL: "arnavtyagi96@gmail.com",
  SHEET_QUESTIONS: "Questions",
  SHEET_SCORES: "Quiz_Scores",
  SHEET_UPTIME: "Uptime_Logs"
};

/**
 * ----------------------------------------------------------------------------
 * 1. CRON JOB: Keep Render Alive Every 10 Minutes
 * (Render free-tier sleeps after 15 mins. This resets the timer!)
 * ----------------------------------------------------------------------------
 */
function keepQuizAppAlive() {
  const timestamp = new Date();
  const targets = [
    { name: "QuizApp", url: CONFIG.QUIZ_APP_URL },
    ...CONFIG.BANKING_SERVICES.map((u, i) => ({ name: `BankingService_${i + 1}`, url: u }))
  ];

  const results = [];

  targets.forEach(target => {
    try {
      const response = UrlFetchApp.fetch(target.url, {
        method: "get",
        muteHttpExceptions: true,
        followRedirects: true
      });
      const code = response.getResponseCode();
      results.push({ name: target.name, url: target.url, status: code, message: "OK" });
      Logger.log(`[PINGER] ${target.name} (${target.url}) -> HTTP ${code}`);
    } catch (e) {
      results.push({ name: target.name, url: target.url, status: "ERROR", message: e.message });
      Logger.log(`[PINGER ERROR] ${target.name} -> ${e.message}`);
    }
  });

  // Log to Google Sheet
  logUptime(timestamp, results);
}

/**
 * Log uptime heartbeat to Sheet
 */
function logUptime(timestamp, results) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    let sheet = ss.getSheetByName(CONFIG.SHEET_UPTIME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_UPTIME);
      sheet.appendRow(["Timestamp", "App Name", "HTTP Status", "URL", "Result"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
    }

    results.forEach(r => {
      sheet.appendRow([timestamp, r.name, r.status, r.url, r.message]);
    });

    // Auto cleanup old logs (keep last 300 rows)
    const lastRow = sheet.getLastRow();
    if (lastRow > 300) {
      sheet.deleteRows(2, lastRow - 300);
    }
  } catch (err) {
    Logger.log("Uptime log error: " + err.message);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 2. WEB APP API: HTTP GET
 * ----------------------------------------------------------------------------
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "status";

  // Force Ping Trigger
  if (action === "ping") {
    keepQuizAppAlive();
    return jsonResponse({
      success: true,
      message: "Keep-alive ping sent to QuizApp & Banking services!",
      timestamp: new Date().toISOString()
    });
  }

  // Fetch Questions from Google Sheet
  if (action === "get_questions") {
    return jsonResponse(fetchQuestionsFromSheet());
  }

  // Fetch Leaderboard from Google Sheet
  if (action === "get_leaderboard") {
    return jsonResponse(fetchLeaderboardFromSheet());
  }

  // Default Status Check
  return jsonResponse({
    success: true,
    application: "QuizApp & NinjaBank Google Backend Sentinel",
    quizAppUrl: CONFIG.QUIZ_APP_URL,
    uptimeCron: "Configured (10 mins)",
    endpoints: {
      getQuestions: "?action=get_questions",
      getLeaderboard: "?action=get_leaderboard",
      pingRender: "?action=ping"
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * ----------------------------------------------------------------------------
 * 3. WEB APP API: HTTP POST (Submit Score)
 * ----------------------------------------------------------------------------
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "submit_score";

    if (action === "submit_score") {
      const result = recordQuizScore(payload);
      return jsonResponse({ success: true, message: "Score saved to Google Sheet!", data: result });
    }

    if (action === "add_question") {
      addQuestionToSheet(payload);
      return jsonResponse({ success: true, message: "New question added successfully!" });
    }

    return jsonResponse({ success: false, error: "Invalid action" }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Fetch Questions from Sheet
 */
function fetchQuestionsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, error: "Spreadsheet not found" };

  let sheet = ss.getSheetByName(CONFIG.SHEET_QUESTIONS);
  if (!sheet) {
    seedInitialQuestions(ss);
    sheet = ss.getSheetByName(CONFIG.SHEET_QUESTIONS);
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, questions: [] };

  const headers = rows[0];
  const questions = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    questions.push({
      id: row[0],
      question: row[1],
      options: [row[2], row[3], row[4], row[5]],
      answer: row[6],
      category: row[7] || "General",
      difficulty: row[8] || "Medium"
    });
  }

  return { success: true, count: questions.length, questions: questions };
}

/**
 * Record Quiz Score to Sheet
 */
function recordQuizScore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  let sheet = ss.getSheetByName(CONFIG.SHEET_SCORES);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_SCORES);
    sheet.appendRow(["Timestamp", "Player Name", "Player Email", "Score", "Total Questions", "Percentage", "Time Taken (s)", "Rank/Badge"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#10b981");
  }

  const score = Number(data.score || 0);
  const total = Number(data.total || 10);
  const percentage = Math.round((score / total) * 100);

  let badge = "Novice";
  if (percentage >= 90) badge = "Ninja Master 🥷";
  else if (percentage >= 70) badge = "Chunin ⚔️";
  else if (percentage >= 50) badge = "Genin 🥋";

  sheet.appendRow([
    new Date(),
    data.name || "Anonymous",
    data.email || "N/A",
    score,
    total,
    `${percentage}%`,
    data.timeSeconds || 0,
    badge
  ]);

  return { score, total, percentage, badge };
}

/**
 * Fetch Leaderboard from Sheet
 */
function fetchLeaderboardFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, leaderboard: [] };

  const sheet = ss.getSheetByName(CONFIG.SHEET_SCORES);
  if (!sheet) return { success: true, leaderboard: [] };

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, leaderboard: [] };

  const scores = [];
  for (let i = 1; i < rows.length; i++) {
    scores.push({
      name: rows[i][1],
      score: rows[i][3],
      total: rows[i][4],
      percentage: rows[i][5],
      badge: rows[i][7]
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return { success: true, topScorers: scores.slice(0, 10) };
}

/**
 * Seed initial sample questions if sheet is empty
 */
function seedInitialQuestions(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_QUESTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_QUESTIONS);
    sheet.appendRow(["ID", "Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Category", "Difficulty"]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");

    const samples = [
      ["Q1", "Which protocol is used for secure communication over the web?", "HTTP", "HTTPS", "FTP", "SMTP", "HTTPS", "Computer Networks", "Easy"],
      ["Q2", "What does JVM stand for in Java?", "Java Virtual Machine", "Java Variable Method", "Joint Virtual Memory", "Java Verified Mode", "Java Virtual Machine", "Java", "Easy"],
      ["Q3", "In Spring Boot, which annotation marks a class as a REST Controller?", "@Service", "@Controller", "@RestController", "@Component", "@RestController", "Spring Boot", "Medium"],
      ["Q4", "Which data structure uses LIFO (Last In First Out)?", "Queue", "Stack", "Array", "Linked List", "Stack", "Data Structures", "Easy"],
      ["Q5", "What is the default port for PostgreSQL?", "3306", "5432", "27017", "8080", "5432", "Databases", "Easy"]
    ];

    samples.forEach(row => sheet.appendRow(row));
  }
}

/**
 * ----------------------------------------------------------------------------
 * 4. ONE-CLICK SETUP TRIGGER: Runs every 10 minutes
 * Run this function ONCE in the Apps Script editor!
 * ----------------------------------------------------------------------------
 */
function setupQuizAppKeepAliveTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepQuizAppAlive") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("keepQuizAppAlive")
    .timeBased()
    .everyMinutes(10)
    .create();

  Logger.log("✅ Keep-Alive 10-Minute Trigger successfully active for QuizApp!");
}

/**
 * JSON Helper
 */
function jsonResponse(data, code) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
