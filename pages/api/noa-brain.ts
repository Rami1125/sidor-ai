/**
 * NOA AI COMMANDER - CORE API
 * מוח מרכזי לניהול פקודות, גיליונות ודרייב
 */

const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  LOG_SHEET_NAME: "Log_Noa",
  SABAN_FILES_FOLDER_ID: "13Mdl9DJSEVVXEGwGifSQV3rTP_B4T6Y6", // שנה ל-ID של התיקייה בדרייב
  VERSION: "7.2.0"
};

/**
 * API Endpoint: מאזין לפקודות מה-Web App
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const response = processIncomingMessage(data.message, data.securityCode);
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * פונקציית הליבה: ניתוח הפקודה וביצוע
 */
function processIncomingMessage(message, securityCode) {
  try {
    // 1. אימות משתמש מול users_config
    const user = validateUser(securityCode);
    if (!user) throw new Error("קוד אבטחה שגוי");

    // 2. ניתוח הפקודה (NLP בסיסי + לוגיקה עסקית של ח. סבן)
    const decision = analyzeCommand(message, user);

    // 3. כתיבה לגיליון "דוח בוקר" או "זבולון"
    executeDataWrite(decision, user);

    // 4. תיעוד ביומן (Log_Noa)
    logAction(user.name, message, decision);

    return {
      status: "SUCCESS",
      decision: decision,
      user: user.name
    };

  } catch (error) {
    return { status: "ERROR", message: error.toString() };
  }
}

/**
 * ניתוח טקסט חופשי לפעולה לוגיסטית
 */
function analyzeCommand(text, user) {
  const lowerText = text.toLowerCase();
  let decision = {
    action: "UNKNOWN",
    item: "",
    qty: 0,
    driver: "ממתין",
    status: "בטיפול",
    details: ""
  };

  // זיהוי פריטים מהמלאי (חול, בלוק, מלט)
  if (text.includes("חול")) decision.item = "חול שק גדול";
  if (text.includes("בלוק")) decision.item = "בלוק 20/20/50";
  
  // זיהוי כמויות
  const matchQty = text.match(/\d+/);
  decision.qty = matchQty ? parseInt(matchQty[0]) : 1;

  // זיהוי נהג (חכמת למנוף, עלי לידני)
  if (text.includes("מנוף") || text.includes("בלה")) {
    decision.driver = "חכמת";
    decision.details = `הוזמן מנוף עבור ${decision.qty} ${decision.item}`;
  } else {
    decision.driver = "עלי";
    decision.details = `הוזמנה הובלה ידנית עבור ${decision.qty} ${decision.item}`;
  }

  return decision;
}

/**
 * כתיבה לגיליונות וניהול קבצים בדרייב
 */
function executeDataWrite(decision, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("דוח בוקר");
  
  // כתיבת השורה החדשה למערכת
  sheet.appendRow([
    new Date(),
    "07:00", // ברירת מחדל או חילוץ מהטקסט
    decision.driver,
    decision.driver === "חכמת" ? "מנוף" : "משאית",
    "מחסן החרש",
    user.project || "כללי",
    "יעד פרויקט",
    "✅ מוכנה",
    decision.details,
    user.securityCode
  ]);

  // יצירת תיקייה בדרייב במידה וצריך (חיבור לדרייב)
  syncToDrive(decision, user);
}

function syncToDrive(decision, user) {
  const folder = DriveApp.getFolderById(CONFIG.SABAN_FILES_FOLDER_ID);
  const subFolderName = `${user.name}_${new Date().toLocaleDateString()}`;
  
  // בדיקה אם קיימת תיקייה יומית, אם לא - צור
  const folders = folder.getFoldersByName(subFolderName);
  if (!folders.hasNext()) {
    folder.createFolder(subFolderName);
  }
}

function logAction(userName, request, decision) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.LOG_SHEET_NAME);
  sheet.appendRow([
    new Date(),
    userName,
    request,
    decision.details,
    decision.driver,
    "SUCCESS"
  ]);
}

function validateUser(code) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users_config");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === code.toString()) {
      return { name: data[i][1], role: data[i][2], securityCode: code };
    }
  }
  return null;
}

/**
 * פונקציה לשליפת לוגים חיים לממשק
 */
function getLiveLogs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log_Noa");
  return sheet.getRange(2, 1, 10, 6).getValues(); // 10 שורות אחרונות
}
