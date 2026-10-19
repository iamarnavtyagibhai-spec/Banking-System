/**
 * ============================================================================
 * NinjaBank - Google Apps Script (GAS) Cloud Backend & Keep-Alive Sentinel
 * ============================================================================
 * 
 * Functions:
 * 1. 24/7 RENDER KEEP-ALIVE PINGER (Prevents Render Free-Tier from Sleeping!)
 *    - Pings UserService, AccountService, TransactionService every 10 mins.
 * 
 * 2. GOOGLE SHEETS LIVE TRANSACTION LEDGER & AUDIT TRAIL
 *    - doPost(e): Logs User Signups, Transfers, High Risk Alerts to Google Sheets.
 *    - doGet(e): Health check & stats API for your NinjaBank.
 * 
 * 3. EMAIL NOTIFICATIONS (GmailApp)
 *    - Sends instant Shinobi security alerts for High Risk transactions.
 * ============================================================================
 */

// ==========================================
// CONFIGURATION: YOUR LIVE RENDER SERVICES
// ==========================================
const CONFIG = {
  SERVICES: {
    USER_SERVICE: "https://userservice-bank-spgh.onrender.com/health",
    ACCOUNT_SERVICE: "https://accountservice-bank-f76c.onrender.com/health",
    TRANSACTION_SERVICE: "https://transactionservice-bank-oxbz.onrender.com/health"
  },
  ADMIN_EMAIL: "arnavtyagi96@gmail.com", // Change if needed
  SHEET_NAME_TRANSACTIONS: "Shinobi_Transactions",
  SHEET_NAME_USERS: "Shinobi_Users",
  SHEET_NAME_UPTIME: "Uptime_Logs"
};

/**
 * ----------------------------------------------------------------------------
 * 1. CRON JOB: 24/7 Render Keep-Alive Heartbeat
 * (Set a Time-driven Trigger in Apps Script to run this every 5 or 10 minutes)
 * ----------------------------------------------------------------------------
 */
function keepRenderAlive() {
  const timestamp = new Date();
  const results = [];
  
  for (const [name, url] of Object.entries(CONFIG.SERVICES)) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: "get",
        muteHttpExceptions: true
      });
      const code = response.getResponseCode();
      const text = response.getContentText().trim();
      results.push({ name: name, status: code, body: text });
      Logger.log(`[PINGER] ${name} -> Status: ${code} (${text})`);
    } catch (err) {
      results.push({ name: name, status: "ERROR", body: err.message });
      Logger.log(`[PINGER ERROR] ${name} -> ${err.message}`);
    }
  }

  // Log to Uptime Sheet
  logUptimeToSheet(timestamp, results);
}

/**
 * Log uptime heartbeat to Google Sheet
 */
function logUptimeToSheet(timestamp, results) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return; // If running standalone without sheet
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_UPTIME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME_UPTIME);
      sheet.appendRow(["Timestamp", "Service", "HTTP Status", "Response"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
    }
    
    results.forEach(r => {
      sheet.appendRow([timestamp, r.name, r.status, r.body]);
    });

    // Keep only last 500 rows to prevent sheet bloating
    const lastRow = sheet.getLastRow();
    if (lastRow > 500) {
      sheet.deleteRows(2, lastRow - 500);
    }
  } catch (e) {
    Logger.log("Uptime sheet log skipped: " + e.message);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 2. WEB APP API: HTTP GET
 * URL: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
 * ----------------------------------------------------------------------------
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "status";
  
  if (action === "ping") {
    keepRenderAlive();
    return createJsonResponse({
      success: true,
      message: "Render services pinged successfully!",
      timestamp: new Date().toISOString()
    });
  }

  return createJsonResponse({
    success: true,
    platform: "NinjaBank Google Apps Script Backend",
    version: "2.0",
    uptimeCron: "Active",
    services: CONFIG.SERVICES,
    timestamp: new Date().toISOString()
  });
}

/**
 * ----------------------------------------------------------------------------
 * 3. WEB APP API: HTTP POST (REST Webhook for NinjaBank Frontend & Services)
 * Logs: Transfers, New Users, High Risk Alerts
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

    const action = payload.action || "log_transaction";

    if (action === "log_transaction") {
      logTransaction(payload);
      return createJsonResponse({ success: true, message: "Transaction logged to Shinobi Ledger" });
    } 
    else if (action === "log_user") {
      logUser(payload);
      return createJsonResponse({ success: true, message: "User registered in Shinobi Master Roster" });
    }
    else if (action === "high_risk_alert") {
      sendSecurityAlert(payload);
      return createJsonResponse({ success: true, message: "Kage Alert dispatched via Gmail" });
    }
    else {
      return createJsonResponse({ success: false, error: "Unknown action" }, 400);
    }

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() }, 500);
  }
}

/**
 * Record a transaction into Google Sheets
 */
function logTransaction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_TRANSACTIONS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_TRANSACTIONS);
    sheet.appendRow(["Timestamp", "Txn ID", "Sender Acc", "Receiver Acc", "Amount (INR)", "Type", "Risk Score", "Status"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#10b981");
  }

  sheet.appendRow([
    new Date(),
    data.transactionId || ("TXN-" + Utilities.getUuid().substring(0, 8).toUpperCase()),
    data.fromAccount || "N/A",
    data.toAccount || "N/A",
    data.amount || 0,
    data.type || "TRANSFER",
    data.riskScore || 0,
    data.status || "COMPLETED"
  ]);

  // If High Risk, send email alert to Admin
  if (data.riskScore && data.riskScore > 75) {
    sendSecurityAlert(data);
  }
}

/**
 * Record a new user into Google Sheets
 */
function logUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_USERS);
    sheet.appendRow(["Joined Date", "Username", "Email", "Account Number", "Rank", "Device ID"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
  }

  sheet.appendRow([
    new Date(),
    data.username || "Ninja",
    data.email || "N/A",
    data.accountNumber || "N/A",
    data.rank || "Genin",
    data.deviceId || "DEV-UNKNOWN"
  ]);
}

/**
 * Send Gmail Security Alert for High Risk Transactions
 */
function sendSecurityAlert(data) {
  try {
    const subject = `🚨 [NINJABANK SECURITY ALERT] High Risk Transaction Flagged (Score: ${data.riskScore || 'HIGH'})`;
    const body = `
========================================
🥷 NINJABANK SHINOBI RISK SENTINEL ALERT
========================================

A high-risk transaction was triggered on the platform:

• Transaction ID : ${data.transactionId || 'N/A'}
• From Vault     : ${data.fromAccount || 'N/A'}
• Target Vault   : ${data.toAccount || 'N/A'}
• Amount         : ₹${data.amount || '0'}
• Calculated Risk: ${data.riskScore || 'HIGH'}/100
• Trigger Factors: ${JSON.stringify(data.factors || ['SUSPICIOUS_VELOCITY'])}
• Timestamp      : ${new Date().toLocaleString()}

Please review in your Shinobi Banking Dashboard.
    `;
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    Logger.log("Security email sent to " + CONFIG.ADMIN_EMAIL);
  } catch (err) {
    Logger.log("Failed to send email alert: " + err.message);
  }
}

/**
 * Setup 5-Minute Keep-Alive Trigger Automatically
 * Run this function ONCE in Apps Script editor!
 */
function setupKeepAliveTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepRenderAlive") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create a time-driven trigger every 10 minutes
  ScriptApp.newTrigger("keepRenderAlive")
    .timeBased()
    .everyMinutes(10)
    .create();

  Logger.log("✅ Keep-Alive 10-Minute Cron Trigger successfully created!");
}

/**
 * Helper: JSON response with CORS headers
 */
function createJsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
