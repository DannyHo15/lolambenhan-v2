/**
 * Calculate age from birth year
 */
export function calculateAge(birthYear: number): number {
  const now = new Date();
  return now.getFullYear() - birthYear;
}

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export function calculateBMI(height: number, weight: number): number {
  if (!height || !weight || height <= 0) return 0;
  const heightInMeters = height * 0.01;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Get BMI classification according to WHO Asia
 */
export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return "gầy";
  if (bmi < 23) return "trung bình";
  if (bmi < 25) return "thừa cân";
  if (bmi < 27.5) return "tiền béo phì";
  if (bmi < 30) return "béo phì độ I";
  return "béo phì độ II";
}

/**
 * Format datetime-local input to Vietnamese format
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${hh} giờ ${mm} phút, ngày ${dd}/${MM}/${yyyy}`;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert newlines to <br/> tags
 */
export function nl2br(str: string): string {
  return escapeHtml(str).replace(/\n/g, "<br/>");
}

/**
 * Generate random room ID for sharing
 */
export function generateRoomId(): string {
  return (Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)).toLowerCase();
}

/**
 * Get client ID for WebSocket
 */
export function getClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "c_" + Math.random().toString(36).slice(2);
}
