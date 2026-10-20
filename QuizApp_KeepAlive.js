/**
 * ============================================================================
 * QuizApp Keep-Alive Sentinel (Render Free-Tier 24/7 Awake)
 * URL: https://quizapp-3tdp.onrender.com
 * ============================================================================
 */

const TARGET_URL = "https://quizapp-3tdp.onrender.com";

/**
 * 1. Ping Function - Isse Render container sleep nahi hoga
 */
function pingQuizApp() {
  try {
    const response = UrlFetchApp.fetch(TARGET_URL, {
      method: "get",
      muteHttpExceptions: true,
      followRedirects: true
    });
    const statusCode = response.getResponseCode();
    Logger.log("✅ Ping Success! Status Code: " + statusCode + " | Time: " + new Date().toLocaleString());
  } catch (error) {
    Logger.log("⚠️ Ping Error: " + error.message);
  }
}

/**
 * 2. Setup Trigger - Yeh har 10 minute mein automatic ping karega
 * (Isko Apps Script editor mein ek baar RUN karna hai)
 */
function setupTrigger() {
  // Purane triggers delete karo taaki duplicate na bane
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "pingQuizApp") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Har 10 minute ka timer trigger banao
  ScriptApp.newTrigger("pingQuizApp")
    .timeBased()
    .everyMinutes(10)
    .create();

  Logger.log("🚀 Trigger Set! Ab https://quizapp-3tdp.onrender.com 24/7 active rahega!");
}

/**
 * 3. Web App Support (Optional: URL kholne par ping karega)
 */
function doGet() {
  pingQuizApp();
  return ContentService.createTextOutput("QuizApp Pinged Successfully at " + new Date().toISOString());
}
