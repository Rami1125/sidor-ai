/**
 * GOOGLE SHEETS SYNC - SABAN OS
 * סנכרון פקודות ותנועות מלאי לגיליונות גוגל
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnZ8c0aZiRjIIH0FZ-GjAUCFYrYO7k3mDCY_YKmN8zie0Fi--khx7iQyDm7pp55tZInw/exec";

export const sheetsSync = {
  /**
   * שליחת פקודת "נועה" לביצוע בגיליון
   */
  async sendCommand(message: string, securityCode: string) {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Apps Script מעדיף לפעמים text/plain ב-CORS
        body: JSON.stringify({
          message: message,
          securityCode: securityCode
        }),
      });

      const result = await response.json();
      
      if (result.status === "ERROR") {
        throw new Error(result.message);
      }
      
      return result;
    } catch (error) {
      console.error("Sheets Sync Error:", error);
      return { status: "ERROR", message: "חיבור לגיליון נכשל" };
    }
  },

  /**
   * שליפת לוגים חיים להצגה ב-Dashboard
   */
  async getLiveLogs() {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getLogs`);
      return await response.json();
    } catch (error) {
      return [];
    }
  }
};
