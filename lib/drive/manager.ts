/**
 * DRIVE MANAGER - SABAN OS
 * ניהול היררכיית תיקיות בדרייב עבור ח. סבן
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnZ8c0aZiRjIIH0FZ-GjAUCFYrYO7k3mDCY_YKmN8zie0Fi--khx7iQyDm7pp55tZInw/exec";

export const driveManager = {
  /**
   * יצירת תיקייה חדשה או קבלת קיימת עבור פרויקט
   */
  async getOrCreateProjectFolder(projectName: string, securityCode: string) {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'GET_OR_CREATE_FOLDER',
          folderName: projectName,
          securityCode: securityCode
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Drive Manager Error:", error);
      throw error;
    }
  },

  /**
   * העלאת מסמך (תעודת משלוח/OCR) לתיקייה ספציפית
   */
  async uploadDeliveryNote(fileData: string, folderId: string, fileName: string) {
    // לוגיקה לחיבור ל-Route של העלאת קבצים שכבר קיים אצלך באפליקציה
    const res = await fetch('/api/upload-to-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, folderId, fileName }),
    });
    return res.json();
  }
};
