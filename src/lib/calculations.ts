import { RATES, RATES_YEAR } from './constants';

export interface Child {
  id: string;
  name: string;
  birthDate: Date | null;
  gender: 'male' | 'female' | null;
  isStudent: boolean;
  isMilitaryOrNationalService: boolean;
}

export type Gender = 'male' | 'female';
export type MedicalDisabilityCategory = 'under80' | '80-89' | '90+';
export type Incapacity = 60 | 65 | 74 | 100;

export interface WidowInput {
  age: number | null;
  gender: Gender | null;
  incapacity: Incapacity | null;
  medicalDisabilityCategory?: MedicalDisabilityCategory | null;
  disabilityAmount: number | null;
  hasIncomeSupport: boolean;
  isTemporaryDisability: boolean;
}

export interface DeceasedInput {
  seniorityYears: number | null;
  deathDate: Date | null;
}

export interface CalculatorInput {
  deceased: DeceasedInput;
  widow: WidowInput;
  children: Child[];
}

export interface ReadyCalculatorInput {
  deceased: { seniorityYears: number; deathDate: Date };
  widow: {
    age: number;
    gender: Gender | null;
    incapacity: Incapacity;
    medicalDisabilityCategory?: MedicalDisabilityCategory | null;
    disabilityAmount: number | null;
    hasIncomeSupport: boolean;
    isTemporaryDisability: boolean;
  };
  children: Child[];
}

export function isReadyForCalculation(input: CalculatorInput): input is ReadyCalculatorInput {
  return (
    input.deceased.seniorityYears !== null &&
    input.deceased.deathDate !== null &&
    input.widow.age !== null &&
    input.widow.incapacity !== null
  );
}

export interface ChildClassification {
  age: number;
  isMinor: boolean;
  isEligibleForDependentAdd: boolean;
  isEligibleForLivingAllowance: boolean;
  isEligibleForBarMitzva: boolean;
  yearsToBarMitzva: number;
  monthsToBarMitzva: number;
  barMitzvaType: string;
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateAgeAtDate(birthDate: Date, targetDate: Date): number {
  let age = targetDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = targetDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function classifyChild(child: Child, deathDate?: Date | null): ChildClassification | null {
  if (!child.birthDate) return null;

  const age = calculateAge(child.birthDate);
  const barMitzvaAge = child.gender === 'male' ? 13 : 12;

  // Check bar mitzvah eligibility based on age at death date if available
  const ageAtDeath = deathDate ? calculateAgeAtDate(child.birthDate, deathDate) : age;

  // חישוב שנים + חודשים עד בר/בת מצווה
  const today = new Date();
  const birth = new Date(child.birthDate);
  const barMitzvaDate = new Date(birth);
  barMitzvaDate.setFullYear(barMitzvaDate.getFullYear() + barMitzvaAge);

  let yearsTo = 0;
  let monthsTo = 0;
  if (barMitzvaDate > today) {
    const diffMs = barMitzvaDate.getTime() - today.getTime();
    const totalMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    yearsTo = Math.floor(totalMonths / 12);
    monthsTo = totalMonths % 12;
  }

  const maxAge = child.isMilitaryOrNationalService ? 24 : 20;
  return {
    age,
    isMinor: age < 18,
    isEligibleForDependentAdd: age < 18 || (age <= maxAge && (child.isStudent || child.isMilitaryOrNationalService)),
    isEligibleForLivingAllowance: age >= 14 && age <= maxAge && child.isStudent,
    isEligibleForBarMitzva: child.gender !== null && ageAtDeath < barMitzvaAge,
    yearsToBarMitzva: yearsTo,
    monthsToBarMitzva: monthsTo,
    barMitzvaType: child.gender === 'male' ? 'בר מצווה' : child.gender === 'female' ? 'בת מצווה' : ''
  };
}

export function getDisabilityBaseAmount(incapacity: number): number {
  switch (incapacity) {
    case 100: return RATES.disability.base_100;
    case 74: return RATES.disability.base_74;
    case 65: return RATES.disability.base_65;
    case 60: return RATES.disability.base_60;
    default: return RATES.disability.base_60;
  }
}

// תוספת ילד תלוי - משתנה לפי דרגת אי-כושר
export function getChildIncrement(incapacity: number): number {
  switch (incapacity) {
    case 100: return RATES.disability.child_increment_100;  // 1,214
    case 74: return RATES.disability.child_increment_74;    // 898
    case 65: return RATES.disability.child_increment_65;    // 789
    case 60: return RATES.disability.child_increment_60;    // 728
    default: return RATES.disability.child_increment_60;
  }
}

export interface ChildAllocation {
  name: string;
  track: 'disability' | 'survivors';
  amount: number;
  includesSeniority: boolean;
}

export interface CalculationOption {
  id: string;
  letter: string;
  name: string;
  description: string;
  widowTrack: 'disability' | 'survivors';
  childAllocations: ChildAllocation[];
  baseAmount: number;
  childrenInDisability: number;
  childrenInSurvivors: number;
  disabilityChildrenAddition: number;
  orphanPension: number;
  seniorityAddition: number;
  livingAllowance: number;
  total: number;
  details: {
    label: string;
    value: number;
  }[];
}

export interface CalculationResult {
  isException: boolean;
  exceptionMessage?: string;
  options: CalculationOption[];
  eligibleChildrenCount: number;
  livingAllowanceEligibleCount: number;
}

// Calculate orphan pension (when widow is in disability track)
// numOrphans = מספר ילדים על מסלול שאירים
function calcOrphanPension(numOrphans: number, seniorityYears: number): number {
  if (numOrphans === 0) return 0;

  let base: number;
  if (numOrphans === 1) {
    // ילד שאיר בודד - סכום מוגדל (חוזר 33)
    base = RATES.survivors.child_survivor_alone;
  } else {
    // 2+ ילדים שאירים: כל אחד 862
    base = RATES.survivors.child_survivor * numOrphans;
  }

  const seniorityRate = Math.min(
    seniorityYears * RATES.survivors.seniority_rate,
    RATES.survivors.seniority_max
  );
  return Math.round(base * (1 + seniorityRate));
}

// Calculate survivors base for widow + children
function calcSurvivorsBase(widowAge: number, childrenCount: number): number {
  if (childrenCount === 0) {
    // אלמן/נה ללא ילדים - לפי גיל
    if (widowAge >= 50) {
      return RATES.survivors.widow_only;
    } else {
      return RATES.survivors.widow_young;
    }
  }

  // אלמן/נה עם ילדים
  if (childrenCount === 1) return RATES.survivors.widow_1_child;
  if (childrenCount === 2) return RATES.survivors.widow_2_children;
  return RATES.survivors.widow_2_children +
    (childrenCount - 2) * RATES.survivors.additional_child;
}

/**
 * מחשב את הצירוף האופטימלי של ילדים בין נכות לשאירים.
 */
function findOptimalAllocation(
  children: { child: Child; classification: ChildClassification }[],
  numInDisability: number,
  childIncrement: number,
  childSurvivorBase: number,
  childSurvivorAlone: number,
  livingAllowanceAmount: number,
  seniorityRate: number
): { name: string; track: 'disability' | 'survivors' }[] {
  const n = children.length;

  if (n === 0) return [];
  if (numInDisability === 0) {
    return children.map(c => ({ name: c.child.name || 'ילד/ה', track: 'survivors' as const }));
  }
  if (numInDisability >= n) {
    return children.map(c => ({ name: c.child.name || 'ילד/ה', track: 'disability' as const }));
  }

  const numInSurvivors = n - numInDisability;
  const survivorPerChild = numInSurvivors === 1 ? childSurvivorAlone : childSurvivorBase;

  const childScores = children.map((c, idx) => {
    const livingAllowance = c.classification.isEligibleForLivingAllowance ? livingAllowanceAmount : 0;
    const survivorsValue = Math.round(survivorPerChild * (1 + seniorityRate)) + livingAllowance;
    const disabilityValue = childIncrement;
    return {
      idx,
      name: c.child.name || 'ילד/ה',
      gainFromSurvivors: survivorsValue - disabilityValue
    };
  });

  childScores.sort((a, b) => b.gainFromSurvivors - a.gainFromSurvivors);

  const allocations = childScores.map((cs, sortedIdx) => ({
    name: cs.name,
    track: sortedIdx < numInSurvivors ? 'survivors' as const : 'disability' as const,
    originalIdx: cs.idx
  }));

  allocations.sort((a, b) => a.originalIdx - b.originalIdx);

  return allocations.map(a => ({ name: a.name, track: a.track }));
}

export function calculateOptions(input: ReadyCalculatorInput): CalculationResult {
  const { widow, deceased, children } = input;

  // Count eligible children
  const classifiedChildren = children
    .map(child => ({ child, classification: classifyChild(child, deceased.deathDate) }))
    .filter(c => c.classification !== null && c.classification.isEligibleForDependentAdd);
  
  const eligibleChildrenCount = classifiedChildren.length;
  const livingAllowanceEligibleCount = classifiedChildren.filter(c => c.classification!.isEligibleForLivingAllowance).length;
  
  // Exception: Widow under 40 with no children
  if (widow.age < 40 && eligibleChildrenCount === 0) {
    return {
      isException: true,
      exceptionMessage: 'אלמן/נה מתחת לגיל 40 ללא ילדים זכאי/ת למענק שאירים חד-פעמי בלבד. אין כפל גמלאות.',
      options: [],
      eligibleChildrenCount: 0,
      livingAllowanceEligibleCount: 0
    };
  }
  
  const options: CalculationOption[] = [];
  
  // Calculate common values
  const seniorityRate = Math.min(deceased.seniorityYears * RATES.survivors.seniority_rate, RATES.survivors.seniority_max);
  const disabilityBase = widow.disabilityAmount || getDisabilityBaseAmount(widow.incapacity);
  const childIncrement = getChildIncrement(widow.incapacity);
  const livingAllowance = livingAllowanceEligibleCount * RATES.supplements.living_allowance;

  // Exception: Temporary disability higher than survivors, no income support
  if (widow.isTemporaryDisability && !widow.hasIncomeSupport) {
    const survivorsBase = calcSurvivorsBase(widow.age, eligibleChildrenCount);
    const tempSeniorityRate = Math.min(deceased.seniorityYears * RATES.survivors.seniority_rate, RATES.survivors.seniority_max);
    const survivorsWithSeniority = Math.round(survivorsBase * (1 + tempSeniorityRate));
    
    if (disabilityBase > survivorsWithSeniority) {
      return {
        isException: true,
        exceptionMessage: 'חל חריג: נכות זמנית גבוהה מקצבת שאירים ואין זכאות להשלמת הכנסה. אין לשלוח מכתב בחירה - יש לשלם קצבת נכות זמנית אוטומטית. בתום הזמניות תקום מחדש זכות הבחירה.',
        options: [],
        eligibleChildrenCount,
        livingAllowanceEligibleCount
      };
    }
  }
  
  const letters = ['א', 'ב', 'ג', 'ד'];
  let optionIndex = 0;

  // Helper to create child allocation with amounts
  const createChildAllocation = (
    name: string,
    track: 'disability' | 'survivors',
    childIndex: number,
    childrenInDisability: number,
    seniorityYears: number,
    totalChildrenInSurvivors: number,
    incapacity: number
  ): ChildAllocation => {
    let amount = 0;
    let includesSeniority = false;

    if (track === 'disability') {
      // Track already determined by optimal allocation; just check max
      amount = getChildIncrement(incapacity);
    } else {
      // ילד שאיר - בודק אם הוא יחיד על המסלול
      const basePerChild = totalChildrenInSurvivors === 1
        ? RATES.survivors.child_survivor_alone  // 1,142 - ילד שאיר בודד
        : RATES.survivors.child_survivor;        // 862 - ילד שאיר רגיל

      const seniorityRate = Math.min(
        seniorityYears * RATES.survivors.seniority_rate,
        RATES.survivors.seniority_max
      );
      amount = Math.round(basePerChild * (1 + seniorityRate));
      includesSeniority = seniorityRate > 0;
    }

    return { name, track, amount, includesSeniority };
  };

  // Helper to create an option
  const createOption = (
    id: string,
    name: string,
    description: string,
    widowTrack: 'disability' | 'survivors',
    childrenInDisability: number,
    childrenInSurvivors: number,
    childAllocationsInput: { name: string; track: 'disability' | 'survivors' }[]
  ): CalculationOption => {
    const details: { label: string; value: number }[] = [];
    
    let total = 0;
    let baseAmount = 0;
    let disabilityChildrenAddition = 0;
    let orphanPension = 0;
    let seniorityAddition = 0;
    let optionLivingAllowance = 0;
    
    // Create child allocations with amounts
    const childAllocations: ChildAllocation[] = childAllocationsInput.map((ca, idx) => 
      createChildAllocation(ca.name, ca.track, idx, childrenInDisability, deceased.seniorityYears, childrenInSurvivors, widow.incapacity)
    );
    
    if (widowTrack === 'disability') {
      // Widow in disability
      baseAmount = disabilityBase;
      details.push({ label: 'קצבת נכות לאלמן/נה', value: baseAmount });
      total += baseAmount;
      
      // Children in disability (max 2!)
      const actualChildrenInDisability = Math.min(childrenInDisability, RATES.disability.max_dependent_children);
      disabilityChildrenAddition = actualChildrenInDisability * getChildIncrement(widow.incapacity);
      if (disabilityChildrenAddition > 0) {
        details.push({ label: `תוספת ילדים תלויים בנכות (${actualChildrenInDisability})`, value: disabilityChildrenAddition });
        total += disabilityChildrenAddition;
      }
      
      // Children in survivors = orphans (get orphan pension + seniority)
      if (childrenInSurvivors > 0) {
        orphanPension = calcOrphanPension(childrenInSurvivors, deceased.seniorityYears);
        details.push({ label: `קצבת יתומים (${childrenInSurvivors})`, value: orphanPension });
        total += orphanPension;
        
        // Living allowance for ALL eligible children if at least one child is in survivors
        if (childrenInSurvivors > 0) {
          optionLivingAllowance = livingAllowanceEligibleCount * RATES.supplements.living_allowance;
          details.push({ label: `דמי מחיה (${livingAllowanceEligibleCount})`, value: optionLivingAllowance });
          total += optionLivingAllowance;
        }
      }
    } else {
      // Widow in survivors - include seniority in base amount
      const baseWithoutSeniority = calcSurvivorsBase(widow.age, childrenInSurvivors);
      seniorityAddition = Math.round(baseWithoutSeniority * seniorityRate);
      baseAmount = baseWithoutSeniority + seniorityAddition;
      details.push({ label: `קצבת שאירים`, value: baseAmount });
      total += baseAmount;
      
      // Living allowance for all children in survivors
      if (livingAllowanceEligibleCount > 0) {
        optionLivingAllowance = livingAllowance;
        details.push({ label: `דמי מחיה (${livingAllowanceEligibleCount})`, value: optionLivingAllowance });
        total += optionLivingAllowance;
      }
    }
    
    return {
      id,
      letter: letters[optionIndex++],
      name,
      description,
      widowTrack,
      childAllocations,
      baseAmount,
      childrenInDisability,
      childrenInSurvivors,
      disabilityChildrenAddition,
      orphanPension,
      seniorityAddition,
      livingAllowance: optionLivingAllowance,
      total,
      details
    };
  };

  // Build child allocation arrays
  const childNames = classifiedChildren.map(c => c.child.name || 'ילד/ה');

  // Optimal allocation helper
  const optimalAlloc = (numInDisability: number) => findOptimalAllocation(
    classifiedChildren as { child: Child; classification: ChildClassification }[],
    numInDisability, childIncrement,
    RATES.survivors.child_survivor, RATES.survivors.child_survivor_alone,
    RATES.supplements.living_allowance, seniorityRate
  );

  // ============ CASE: No children ============
  if (eligibleChildrenCount === 0) {
    // Option A: Full Survivors
    options.push(createOption(
      'survivors_full',
      'שאירים',
      'קצבת שאירים מלאה',
      'survivors',
      0,
      0,
      []
    ));
    
    // Option B: Full Disability
    options.push(createOption(
      'disability_full',
      'נכות כללית',
      'קצבת נכות כללית',
      'disability',
      0,
      0,
      []
    ));
  }
  
  // ============ CASE: 1 child ============
  else if (eligibleChildrenCount === 1) {
    // Option A: All in Survivors
    options.push(createOption(
      'survivors_full',
      'שאירים',
      'אלמן/נה וילד/ה בשאירים',
      'survivors',
      0,
      1,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
    
    // Option B: Widow disability + child disability
    options.push(createOption(
      'disability_with_child',
      'נכות + ילד תלוי',
      'אלמן/נה בנכות + ילד/ה תלוי',
      'disability',
      1,
      0,
      childNames.map(name => ({ name, track: 'disability' as const }))
    ));
    
    // Option C: Widow disability + child survivors (orphan)
    options.push(createOption(
      'disability_child_survivors',
      'נכות + יתום בשאירים',
      'אלמן/נה בנכות + ילד/ה בשאירים (יתום)',
      'disability',
      0,
      1,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
  }
  
  // ============ CASE: 2 children ============
  else if (eligibleChildrenCount === 2) {
    // Option A: All in Survivors
    options.push(createOption(
      'survivors_full',
      'שאירים',
      'אלמן/נה וכל הילדים בשאירים',
      'survivors',
      0,
      2,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
    
    // Option B: Widow disability + 2 children disability
    options.push(createOption(
      'disability_2_children',
      'נכות + 2 ילדים',
      'אלמן/נה בנכות + 2 ילדים תלויים',
      'disability',
      2,
      0,
      childNames.map(name => ({ name, track: 'disability' as const }))
    ));
    
    // Option C: Widow disability + 1 child disability + 1 child survivors
    options.push(createOption(
      'disability_mixed',
      'נכות + ילד + יתום בשאירים',
      'אלמן/נה בנכות + ילד תלוי + ילד יתום בשאירים',
      'disability',
      1,
      1,
      optimalAlloc(1)
    ));
    
    // Option D: Widow disability + 2 children survivors
    options.push(createOption(
      'disability_children_survivors',
      'נכות + 2 יתומים בשאירים',
      'אלמן/נה בנכות + 2 ילדים בשאירים (יתומים)',
      'disability',
      0,
      2,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
  }
  
  // ============ CASE: 3+ children ============
  else {
    // Option A: All in Survivors
    options.push(createOption(
      'survivors_full',
      'שאירים',
      'אלמן/נה וכל הילדים בשאירים',
      'survivors',
      0,
      eligibleChildrenCount,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
    
    // Option B: Widow disability + 2 children disability (max!) + rest in survivors
    options.push(createOption(
      'disability_2_plus_survivors',
      'נכות + 2 ילדים + יתומים בשאירים',
      `אלמן/נה בנכות + 2 תלויים + ${eligibleChildrenCount - 2} יתומים בשאירים`,
      'disability',
      2,
      eligibleChildrenCount - 2,
      optimalAlloc(2)
    ));
    
    // Option C: Widow disability + 1 child disability + rest in survivors
    options.push(createOption(
      'disability_1_plus_survivors',
      'נכות + ילד + יתומים בשאירים',
      `אלמן/נה בנכות + 1 תלוי + ${eligibleChildrenCount - 1} יתומים בשאירים`,
      'disability',
      1,
      eligibleChildrenCount - 1,
      optimalAlloc(1)
    ));
    
    // Option D: Widow disability + all children in survivors
    options.push(createOption(
      'disability_all_survivors',
      'נכות + כולם יתומים בשאירים',
      'אלמן/נה בנכות + כל הילדים יתומים בשאירים',
      'disability',
      0,
      eligibleChildrenCount,
      childNames.map(name => ({ name, track: 'survivors' as const }))
    ));
  }
  
  // Always show all options (removed retirement age filter per user request)
  
  // Sort by total (descending)
  options.sort((a, b) => b.total - a.total);
  
  // Re-assign letters after sorting
  const letters2 = ['א', 'ב', 'ג', 'ד'];
  options.forEach((opt, idx) => {
    opt.letter = letters2[idx];
  });
  
  return {
    isException: false,
    options,
    eligibleChildrenCount,
    livingAllowanceEligibleCount
  };
}

export interface Benefit {
  text: string;
  condition?: string;
  always?: boolean;
  note?: string;
}

export interface BenefitsResult {
  disability: Benefit[];
  survivors: Benefit[];
  grants: Benefit[];
}

// Personalized benefits based on incapacity, medical disability, income support, age, gender
export function getPersonalizedBenefits(input: {
  incapacity: number;
  hasIncomeSupport: boolean;
  age: number;
  gender: 'male' | 'female' | null;
}): { disabilityBenefits: string[]; survivorsBenefits: string[] } {

  const disabilityBenefits: string[] = [];
  const survivorsBenefits: string[] = [];

  // ===== הטבות נכות =====

  // לכל מקבלי קצבת נכות כללית:
  disabilityBenefits.push('50% הנחה בתחבורה ציבורית (משרד התחבורה)');
  disabilityBenefits.push('פטור מהשתתפות עצמית - טופס 17, רופא מקצועי ועוד (קופת חולים)');

  // רק ל-100% אי-כושר (דרגה מלאה, 75% ומעלה):
  if (input.incapacity === 100) {
    disabilityBenefits.push('הנחה במס רכישה - דירת מגורים/קרקע (רשות המיסים - מיסוי מקרקעין)');
    disabilityBenefits.push('סיוע בשכר דירה או דיור ציבורי (משרד הבינוי והשיכון)');
    disabilityBenefits.push('הנחה בארנונה - שיעור נקבע ע"י הרשות (רשות מקומית)');
  }

  // ===== הטבות שאירים =====

  // לכל מקבלי קצבת שאירים:
  if (input.age >= 67) {
    survivorsBenefits.push('פטור מלא מתשלום בתחבורה ציבורית (מעל גיל 67)');
  } else {
    survivorsBenefits.push('50% הנחה בתחבורה ציבורית (משרד התחבורה)');
  }

  // מענק עבודה - לעובדים עד רמת שכר מסוימת:
  survivorsBenefits.push('אפשרות למענק עבודה ("מס הכנסה שלילי") - לעובדים עד רמת שכר מסוימת (רשות המיסים)');

  // הנחה בארנונה - מעל גיל פרישה, או עם השלמת הכנסה:
  const retirementAge = input.gender === 'male' ? 67 : 62;
  if (input.age >= retirementAge || input.hasIncomeSupport) {
    survivorsBenefits.push('הנחה בארנונה - שיעור נקבע ע"י הרשות (רשות מקומית)');
  } else {
    survivorsBenefits.push('הנחה בארנונה - בכפוף לקבלת תוספת השלמת הכנסה (רשות מקומית)');
  }

  return { disabilityBenefits, survivorsBenefits };
}

export function calculateBenefits(input: ReadyCalculatorInput): BenefitsResult {
  const benefits: BenefitsResult = {
    disability: [],
    survivors: [],
    grants: []
  };

  const { widow, children } = input;

  // Get personalized benefits
  const personalized = getPersonalizedBenefits({
    incapacity: widow.incapacity,
    hasIncomeSupport: widow.hasIncomeSupport,
    age: widow.age,
    gender: widow.gender
  });
  
  // Add disability benefits
  personalized.disabilityBenefits.forEach(text => {
    benefits.disability.push({ text });
  });
  
  // Add survivors benefits (personalized, not including marriage grant - it goes to grants)
  personalized.survivorsBenefits.forEach(text => {
    benefits.survivors.push({ text });
  });
  
  // Child-specific grants (including marriage grant)
  children.forEach(child => {
    const classification = classifyChild(child, input.deceased.deathDate);
    if (!classification) return;
    
    if (classification.isEligibleForLivingAllowance) {
      benefits.grants.push({
        text: `דמי מחיה ל${child.name || 'ילד/ה'} (${RATES.supplements.living_allowance} ₪/חודש)`,
        note: 'לתלמידים בגילאי 14-20'
      });
    }
    
    if (classification.isEligibleForBarMitzva) {
      const y = classification.yearsToBarMitzva;
      const m = classification.monthsToBarMitzva;
      let yearsText = '';

      if (y === 0 && m === 0) {
        yearsText = 'החודש';
      } else if (y === 0) {
        yearsText = m === 1 ? 'בעוד חודש' : `בעוד ${m} חודשים`;
      } else if (m === 0) {
        yearsText = y === 1 ? 'בעוד שנה' : `בעוד ${y} שנים`;
      } else {
        const yText = y === 1 ? 'שנה' : `${y} שנים`;
        const mText = m === 1 ? 'חודש' : `${m} חודשים`;
        yearsText = `בעוד ${yText} ו-${mText}`;
      }

      benefits.grants.push({
        text: `מענק ${classification.barMitzvaType} ל${child.name || 'ילד/ה'} (${RATES.supplements.bar_mitzva_grant.toLocaleString()} ₪) - ${yearsText}`
      });
    }
  });
  
  return benefits;
}
