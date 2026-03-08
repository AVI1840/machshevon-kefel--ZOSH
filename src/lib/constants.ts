// === סכומים מעודכנים לינואר 2026 ===
// מקורות:
//   שאירים: חוזר תשלומים 33, המוסד לביטוח לאומי, 06/01/2026
//   נכות: טבלת שיעורי קצבת נכות כללית, ינואר 2026
export const RATES_YEAR = 2026;

export const RATES = {
  // --- נכות כללית ---
  // שים לב: תוספת ילד תלוי משתנה לפי דרגת אי-כושר!
  disability: {
    // קצבת בסיס לפי דרגת אי-כושר
    base_100: 4711,    // דרגה מלאה (100% או 75%)
    base_74: 3211,     // 74% אי-כושר
    base_65: 2894,     // 65% אי-כושר
    base_60: 2718,     // 60% אי-כושר
    // תוספת ילד תלוי לפי דרגת אי-כושר (עד 2 ילדים!)
    child_increment_100: 1214,  // תוספת ילד בדרגה מלאה
    child_increment_74: 898,    // תוספת ילד ב-74%
    child_increment_65: 789,    // תוספת ילד ב-65%
    child_increment_60: 728,    // תוספת ילד ב-60%
    max_dependent_children: 2
    // אין תוספת בן/בת זוג - המבוטח הוא אלמן/ה (בן הזוג נפטר)
  },

  // --- שאירים (חוזר 33, סעיף ב) ---
  survivors: {
    widow_only: 1838,           // אלמן/ה (גיל 50+)
    widow_young: 1381,          // אלמן/ה צעיר/ה (מתחת ל-50, ללא ילדים)
    widow_80plus: 1941,         // אלמן/ה בגיל 80+
    child_survivor: 862,        // ילד שאיר (רגיל)
    child_survivor_alone: 1142, // ילד שאיר בודד (יחיד על מסלול שאירים)
    // סכומים מחושבים:
    widow_1_child: 2700,        // 1838 + 862
    widow_2_children: 3562,     // 1838 + 862 * 2
    additional_child: 862,      // כל ילד נוסף (3+)
    seniority_rate: 0.02,
    seniority_max: 0.50
  },

  // --- תוספות ומענקים (חוזר 33, סעיפים ג, יב) ---
  supplements: {
    living_allowance: 683,      // דמי מחיה 6.5%
    living_allowance_high: 946, // דמי מחיה 9%
    bar_mitzva_grant: 7009,     // מענק בר/בת מצווה
    marriage_grant_months: 36
  },

};

export const INCAPACITY_OPTIONS = [
  { value: 60, label: '60%' },
  { value: 65, label: '65%' },
  { value: 74, label: '74%' },
  { value: 100, label: '100%' },
];

export const MEDICAL_DISABILITY_OPTIONS = [
  { value: 40, label: '40%' },
  { value: 50, label: '50%' },
  { value: 60, label: '60%' },
  { value: 70, label: '70%' },
  { value: 80, label: '80%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100%' },
];
