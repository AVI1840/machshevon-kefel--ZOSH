import { Copy, Table2, Trash2, FileText, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalculationResult, BenefitsResult, CalculatorInput } from '@/lib/calculations';
import btlLogo from '@/assets/btl-logo.png';

interface ActionButtonsProps {
  result: CalculationResult;
  benefits: BenefitsResult;
  input: CalculatorInput;
  onReset: () => void;
}

const ActionButtons = ({ result, benefits, input, onReset }: ActionButtonsProps) => {
  const { toast } = useToast();

  // Gender-aware text: replaces slash-forms based on widow gender
  const genderize = (text: string): string => {
    const isMale = input.widow.gender === 'male';
    const replacements: [string | RegExp, string][] = isMale
      ? [
          ['המנוח/ה', 'המנוחה'],
          ['המנוח/ת', 'המנוחה'],
          ['זכאי/ת', 'זכאי'],
          ['אלמן/נה', 'אלמן'],
          ['אלמן/ה', 'אלמן'],
          ['שים/י לב', 'שים לב'],
          ['את/ה', 'אתה'],
          ['מקבל/ת', 'מקבל'],
          ['שבחר/ה', 'שבחר'],
          ['תבחר/י', 'תבחר'],
          ['שבחרה/ת', 'שבחר'],
        ]
      : [
          ['המנוח/ה', 'המנוח'],
          ['המנוח/ת', 'המנוח'],
          ['זכאי/ת', 'זכאית'],
          ['אלמן/נה', 'אלמנה'],
          ['אלמן/ה', 'אלמנה'],
          ['שים/י לב', 'שימי לב'],
          ['את/ה', 'את'],
          ['מקבל/ת', 'מקבלת'],
          ['שבחר/ה', 'שבחרה'],
          ['תבחר/י', 'תבחרי'],
          ['שבחרה/ת', 'שבחרה'],
        ];
    let output = text;
    for (const [from, to] of replacements) {
      output = output.split(from as string).join(to);
    }
    return output;
  };

  const generateTableHTML = () => {
    let html = `<table dir="rtl" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">`;
    html += `<thead><tr style="background-color: #0066CC; color: white;">`;
    html += `<th style="border: 1px solid #ccc; padding: 10px; text-align: right;">פירוט</th>`;
    
    result.options.forEach((option) => {
      html += `<th style="border: 1px solid #ccc; padding: 10px; text-align: center;">אפשרות ${option.letter}'</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // Widow row
    html += `<tr><td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">אלמן/נה</td>`;
    result.options.forEach(option => {
      const track = option.widowTrack === 'disability' ? 'נכות' : 'שאירים';
      const bgColor = option.widowTrack === 'disability' ? '#dbeafe' : '#dcfce7';
      html += `<td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
        <span style="background: ${bgColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${track}</span><br>
        <strong>${option.baseAmount.toLocaleString('he-IL')} ₪</strong>
      </td>`;
    });
    html += `</tr>`;
    
    // Children rows
    if (result.eligibleChildrenCount > 0 && result.options[0]?.childAllocations) {
      result.options[0].childAllocations.forEach((_, idx) => {
        const childName = result.options[0]?.childAllocations[idx]?.name || `ילד/ה ${idx + 1}`;
        const bgAlt = idx % 2 === 0 ? '#f9fafb' : 'white';
        html += `<tr style="background: ${bgAlt};"><td style="border: 1px solid #ccc; padding: 8px;">👶 ${childName}</td>`;
        result.options.forEach(option => {
          const allocation = option.childAllocations[idx];
          const isDisability = allocation?.track === 'disability';
          const track = isDisability ? 'ילד תלוי בנכות' : 'יתום בשאירים';
          const bgColor = isDisability ? '#dbeafe' : '#dcfce7';
          const amount = allocation?.amount || 0;
          html += `<td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
            <span style="background: ${bgColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${track}</span><br>
            ${amount > 0 ? `<strong>+${amount.toLocaleString('he-IL')} ₪</strong>` : '<small>תוספת בקצבת שאירים</small>'}
          </td>`;
        });
        html += `</tr>`;
      });
    }
    
    // Living allowance row
    if (result.livingAllowanceEligibleCount > 0) {
      html += `<tr><td style="border: 1px solid #ccc; padding: 8px;">דמי מחיה</td>`;
      result.options.forEach(option => {
        html += `<td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${option.livingAllowance > 0 ? `${option.livingAllowance.toLocaleString('he-IL')} ₪` : '-'}</td>`;
      });
      html += `</tr>`;
    }
    
    // Total row
    html += `<tr style="background: #f0f9ff; font-weight: bold;"><td style="border: 1px solid #ccc; padding: 10px;">💰 סה"כ לחודש</td>`;
    result.options.forEach(option => {
      html += `<td style="border: 1px solid #ccc; padding: 10px; text-align: center; font-size: 18px;">${option.total.toLocaleString('he-IL')} ₪</td>`;
    });
    html += `</tr>`;
    
    html += `</tbody></table>`;
    return genderize(html);
  };
  
  const generateOptionsText = () => {
    let text = 'להלן השוואה המותאמת לנתונים שלך:\n\n';
    
    result.options.forEach((option, index) => {
      const letter = ['א', 'ב', 'ג', 'ד'][index];
      text += `אפשרות ${letter}' - ${option.name}\n`;
      const widowType = option.widowTrack === 'disability' ? 'קצבת נכות' : 'קצבת שאירים';
      text += `  • אלמן/נה: ${widowType} ${option.baseAmount.toLocaleString('he-IL')} ₪\n`;
      
      if (option.childAllocations) {
        option.childAllocations.forEach(childData => {
          if (childData.track === 'disability') {
            text += `  • ${childData.name}: ילד תלוי בנכות +${childData.amount.toLocaleString('he-IL')} ₪\n`;
          } else if (childData.track === 'survivors' && childData.amount > 0) {
            text += `  • ${childData.name}: קצבת שאירים ${childData.amount.toLocaleString('he-IL')} ₪\n`;
          } else {
            text += `  • ${childData.name}: תוספת בקצבת שאירים\n`;
          }
        });
      }
      
      text += `  • סה"כ לחודש: ${option.total.toLocaleString('he-IL')} ₪\n\n`;
    });
    
    return genderize(text);
  };

  const generateLetterText = () => {
    let text = `נושא: בחירה בין קצבת נכות כללית לקצבת שאירים

שלום רב,

אנו משתתפים בצערך על פטירת המנוח/ה.

מבדיקת הנתונים עולה כי הינך זכאי/ת הן לקצבת שאירים והן לקצבת נכות כללית. לפי חוק הביטוח הלאומי (סעיף 320), לא ניתן לקבל את שתי הקצבאות במלואן באותה תקופה, אך החוק מאפשר לך לבחור את המסלול המתאים ביותר.

${input.widow.isTemporaryDisability ? 'הערה: מאחר שדרגת אי-הכושר נקבעה באופן זמני, יש לשלם את הקצבה הגבוהה מבין האפשרויות.\n\n' : ''}${generateOptionsText()}
---

מה עוד חשוב לקחת בחשבון?

`;

    text += `🎁 מענקים רלוונטיים (במסלול שאירים):\n`;
    benefits.grants.forEach(grant => {
      text += `  • ${grant.text}\n`;
    });
    text += `  • מענק נישואין בעתיד (36 קצבאות חודשיות) - רלוונטי רק באפשרויות בהן את/ה במסלול שאירים. שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.\n`;
    text += `  • אפשרות לבחון זכאות לתוספת השלמת הכנסה\n`;
    text += `\n`;

    text += `🔵 הטבות במסלול נכות כללית (לפי הנתונים שלך):\n`;
    benefits.disability.forEach(b => {
      text += `  • ${b.text}\n`;
    });
    text += `\n`;

    text += `💚 הטבות במסלול שאירים (לפי הנתונים שלך):\n`;
    if (benefits.survivors.length > 0) {
      benefits.survivors.forEach(b => {
        text += `  • ${b.text}\n`;
      });
    } else {
      text += `  • אין הטבות נוספות במסלול זה לפי הנתונים שהוזנו\n`;
    }
    text += `\n`;

    text += `---

לידיעתך:
• יש להשיב תוך 21 יום. אם לא תתקבל תשובה, תישלח תזכורת. אם לא תתקבל תשובה תוך 15 יום נוספים, נראה אותך כמי שבחר/ה בקצבה הנוכחית.
• הבחירה ניתנת לשינוי בעתיד אם יחול שינוי בנסיבותייך.
• אם תבחר/י בקצבת השאירים, ולאחר מכן זכאותך לקצבת שאירים תופסק - זכאותך לקצבת הנכות תתחדש מיד.
• שים/י לב: אם את/ה מקבל/ת שר"מ (שירותים מיוחדים), בחירה בשאירים תפסיק את השר"מ הרגיל. יש לבדוק עם פקיד תביעות נכות כללית זכאות לשר"מ מיוחד - שר"מ מיוחד אינו כפל עם קצבת שאירים.
• הסכומים מעודכנים לשנת 2026 בהתאם לחוזר תשלומים 33 וכפופים לשינויים.

בברכה,
הביטוח הלאומי`;

    return genderize(text);
  };

  const generateOptionsHTML = () => {
    let html = `<p style="text-align: right;"><strong>להלן השוואה המותאמת לנתונים שלך:</strong></p>`;
    
    result.options.forEach((option, index) => {
      const letter = ['א', 'ב', 'ג', 'ד'][index];
      html += `<div style="margin-bottom: 16px; text-align: right;">`;
      html += `<p style="font-weight: bold; margin-bottom: 8px;">אפשרות ${letter}' - ${option.name}</p>`;
      html += `<ul style="margin: 0; padding-right: 20px; list-style-type: disc;">`;
      
      const widowType = option.widowTrack === 'disability' ? 'קצבת נכות' : 'קצבת שאירים';
      html += `<li>אלמן/נה: ${widowType} ${option.baseAmount.toLocaleString('he-IL')} ₪</li>`;
      
      if (option.childAllocations) {
        option.childAllocations.forEach(childData => {
          if (childData.track === 'disability') {
            html += `<li>${childData.name}: ילד תלוי בנכות +${childData.amount.toLocaleString('he-IL')} ₪</li>`;
          } else if (childData.track === 'survivors' && childData.amount > 0) {
            html += `<li>${childData.name}: קצבת שאירים ${childData.amount.toLocaleString('he-IL')} ₪</li>`;
          } else {
            html += `<li>${childData.name}: תוספת בקצבת שאירים</li>`;
          }
        });
      }
      
      html += `<li><strong>סה"כ לחודש: ${option.total.toLocaleString('he-IL')} ₪</strong></li>`;
      html += `</ul></div>`;
    });
    
    return genderize(html);
  };

  const generateFullLetterHTML = () => {
    let html = `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; direction: rtl; text-align: right;">`;
    html += `<div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0066CC; margin: 0;">המוסד לביטוח לאומי</h2>
    </div>`;
    html += `<p style="text-align: right;"><strong>נושא: בחירה בין קצבת נכות כללית לקצבת שאירים</strong></p>`;
    html += `<p style="text-align: right;">שלום רב,</p>`;
    html += `<p style="text-align: right;">אנו משתתפים בצערך על פטירת המנוח/ה.</p>`;
    html += `<p style="text-align: right;">מבדיקת הנתונים עולה כי הינך זכאי/ת הן לקצבת שאירים והן לקצבת נכות כללית. לפי חוק הביטוח הלאומי (סעיף 320), לא ניתן לקבל את שתי הקצבאות במלואן באותה תקופה, אך החוק מאפשר לך לבחור את המסלול המתאים ביותר.</p>`;
    if (input.widow.isTemporaryDisability) {
      html += `<p style="text-align: right; background: #fff7ed; border: 1px solid #f97316; padding: 8px 12px; border-radius: 6px;"><strong>הערה: מאחר שדרגת אי-הכושר נקבעה באופן זמני, יש לשלם את הקצבה הגבוהה מבין האפשרויות.</strong></p>`;
    }
    html += generateOptionsHTML();
    html += `<hr style="margin: 20px 0;">`;
    html += `<h3 style="text-align: right;">מה עוד חשוב לקחת בחשבון?</h3>`;
    
    html += `<div style="background: #fef9c3; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: right;">`;
    html += `<h4 style="color: #92400e; margin: 0 0 8px 0;">🎁 מענקים רלוונטיים (במסלול שאירים):</h4>`;
    html += `<ul style="margin: 0; padding-right: 20px;">`;
    benefits.grants.forEach(grant => {
      html += `<li>${grant.text}</li>`;
    });
    html += `<li>מענק נישואין בעתיד (36 קצבאות חודשיות) - <strong>רלוונטי רק באפשרויות בהן את/ה במסלול שאירים.</strong> שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.</li>`;
    html += `<li>אפשרות לבחון זכאות לתוספת השלמת הכנסה</li>`;
    html += `</ul></div>`;
    
    html += `<div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: right;">`;
    html += `<h4 style="color: #1e40af; margin: 0 0 8px 0;">🔵 הטבות במסלול נכות כללית (לפי הנתונים שלך):</h4>`;
    html += `<ul style="margin: 0; padding-right: 20px;">`;
    benefits.disability.forEach(b => {
      html += `<li>${b.text}</li>`;
    });
    html += `</ul></div>`;
    
    html += `<div style="background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: right;">`;
    html += `<h4 style="color: #166534; margin: 0 0 8px 0;">💚 הטבות במסלול שאירים (לפי הנתונים שלך):</h4>`;
    html += `<ul style="margin: 0; padding-right: 20px;">`;
    if (benefits.survivors.length > 0) {
      benefits.survivors.forEach(b => {
        html += `<li>${b.text}</li>`;
      });
    } else {
      html += `<li>אין הטבות נוספות במסלול זה לפי הנתונים שהוזנו</li>`;
    }
    html += `</ul></div>`;
    
    html += `<hr style="margin: 20px 0;">`;
    html += `<p style="text-align: right;"><strong>לידיעתך:</strong></p>`;
    html += `<ul style="text-align: right;">
      <li>יש להשיב תוך 21 יום. אם לא תתקבל תשובה, תישלח תזכורת. אם לא תתקבל תשובה תוך 15 יום נוספים, נראה אותך כמי שבחר/ה בקצבה הנוכחית.</li>
      <li>הבחירה ניתנת לשינוי בעתיד אם יחול שינוי בנסיבותייך.</li>
      <li>אם תבחר/י בקצבת השאירים, ולאחר מכן זכאותך לקצבת שאירים תופסק - זכאותך לקצבת הנכות תתחדש מיד.</li>
      <li>שים/י לב: אם את/ה מקבל/ת שר"מ (שירותים מיוחדים), בחירה בשאירים תפסיק את השר"מ הרגיל. יש לבדוק עם פקיד תביעות נכות כללית זכאות לשר"מ מיוחד - שר"מ מיוחד אינו כפל עם קצבת שאירים.</li>
      <li>הסכומים מעודכנים לשנת 2026 בהתאם לחוזר תשלומים 33 וכפופים לשינויים.</li>
    </ul>`;
    
    html += `<p style="text-align: right;">בברכה,<br>הביטוח הלאומי</p>`;
    html += `</div>`;
    
    return genderize(html);
  };
  
  const generateWordTableHTML = () => {
    const g = genderize;
    let html = `<table dir="rtl" align="right" style="border-collapse: collapse; width: 100%; font-family: Arial; direction: rtl;">`;
    html += `<thead><tr style="background-color: #0066CC; color: white;">`;
    html += `<th dir="rtl" align="right" style="border: 1px solid #999; padding: 8px; text-align: right;">פירוט</th>`;
    result.options.forEach((option) => {
      html += `<th dir="rtl" align="center" style="border: 1px solid #999; padding: 8px; text-align: center;">אפשרות ${option.letter}'</th>`;
    });
    html += `</tr></thead><tbody>`;
    html += `<tr>`;
    html += `<td dir="rtl" align="right" style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">${g('אלמן/נה')}</td>`;
    result.options.forEach(option => {
      const track = option.widowTrack === 'disability' ? 'נכות' : 'שאירים';
      html += `<td dir="rtl" align="center" style="border: 1px solid #ccc; padding: 6px; text-align: center;">${track}<br/><b>${option.baseAmount.toLocaleString('he-IL')} ₪</b></td>`;
    });
    html += `</tr>`;
    if (result.eligibleChildrenCount > 0 && result.options[0]?.childAllocations) {
      result.options[0].childAllocations.forEach((_, idx) => {
        const childName = result.options[0]?.childAllocations[idx]?.name || `ילד/ה ${idx + 1}`;
        html += `<tr>`;
        html += `<td dir="rtl" align="right" style="border: 1px solid #ccc; padding: 6px;">👶 ${childName}</td>`;
        result.options.forEach(option => {
          const allocation = option.childAllocations[idx];
          const track = allocation?.track === 'disability' ? 'ילד תלוי בנכות' : 'יתום בשאירים';
          const amount = allocation?.amount || 0;
          html += `<td dir="rtl" align="center" style="border: 1px solid #ccc; padding: 6px; text-align: center;">${track}<br/>${amount > 0 ? `<b>+${amount.toLocaleString('he-IL')} ₪</b>` : 'תוספת בקצבת שאירים'}</td>`;
        });
        html += `</tr>`;
      });
    }
    if (result.livingAllowanceEligibleCount > 0) {
      html += `<tr>`;
      html += `<td dir="rtl" align="right" style="border: 1px solid #ccc; padding: 6px;">דמי מחיה</td>`;
      result.options.forEach(option => {
        html += `<td dir="rtl" align="center" style="border: 1px solid #ccc; padding: 6px; text-align: center;">${option.livingAllowance > 0 ? `${option.livingAllowance.toLocaleString('he-IL')} ₪` : '-'}</td>`;
      });
      html += `</tr>`;
    }
    html += `<tr style="background-color: #f0f9ff;">`;
    html += `<td dir="rtl" align="right" style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">💰 סה"כ לחודש</td>`;
    result.options.forEach(option => {
      html += `<td dir="rtl" align="center" style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold; font-size: 14pt;">${option.total.toLocaleString('he-IL')} ₪</td>`;
    });
    html += `</tr></tbody></table>`;
    return html;
  };

  const generateWordOptionsHTML = () => {
    const g = genderize;
    let html = '';
    result.options.forEach((option) => {
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; margin-bottom: 4px;"><b>○  אפשרות ${option.letter}' - ${option.name}</b></p>`;
      const widowTrackLabel = option.widowTrack === 'disability' ? 'נכות' : 'שאירים';
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; margin: 2px 0; padding-right: 30px;">${g('אלמן/נה')}: [${widowTrackLabel}] ${option.baseAmount.toLocaleString('he-IL')} ₪</p>`;
      if (option.childAllocations) {
        option.childAllocations.forEach(allocation => {
          const trackLabel = allocation.track === 'disability' ? 'ילד תלוי בנכות' : 'יתום בשאירים';
          const amountText = allocation.amount > 0 ? `+${allocation.amount.toLocaleString('he-IL')} ₪` : 'תוספת בקצבת שאירים';
          html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; margin: 2px 0; padding-right: 30px;">${allocation.name}: [${trackLabel}] ${amountText}</p>`;
        });
      }
      if (option.livingAllowance > 0) {
        html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; margin: 2px 0; padding-right: 30px;">דמי מחיה: ${option.livingAllowance.toLocaleString('he-IL')} ₪</p>`;
      }
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; margin: 2px 0 12px 0; padding-right: 30px;"><b>סה"כ לחודש: ${option.total.toLocaleString('he-IL')} ₪</b></p>`;
    });
    return html;
  };

  const downloadAsWord = async () => {
    try {
      const g = genderize;
      const p = (text: string, extra = '') => `<p dir="rtl" align="right" style="direction: rtl; text-align: right; font-family: Arial; font-size: 11pt; ${extra}">${g(text)}</p>`;
      const li = (text: string) => `<li dir="rtl" align="right" style="direction: rtl; text-align: right;">${g(text)}</li>`;

      // Convert logo to base64 for embedding in HTML
      const logoResponse = await fetch(btlLogo);
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
@page { margin: 2cm; }
body { direction: rtl; text-align: right; font-family: Arial; font-size: 11pt; }
p, li, td, th { direction: rtl; text-align: right; }
table { direction: rtl; }
</style></head>
<body dir="rtl" align="right" style="direction: rtl; text-align: right; font-family: Arial;">`;

      html += `<div style="text-align: center; margin-bottom: 10px;"><img src="${logoBase64}" width="160" height="55" style="display: block; margin: 0 auto;" /></div>`;
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; color: #0066CC; font-size: 16pt; font-weight: bold;">מאת: המוסד לביטוח לאומי</p>`;
      html += p('<b>נושא: בחירה בין קצבת נכות כללית לקצבת שאירים</b>', 'font-size: 13pt;');
      html += p('שלום רב,');
      html += p('אנו משתתפים בצערך על פטירת המנוח/ה.');
      html += p('מבדיקת הנתונים עולה כי הינך זכאי/ת הן לקצבת שאירים והן לקצבת נכות כללית. לפי חוק הביטוח הלאומי (סעיף 320), לא ניתן לקבל את שתי הקצבאות במלואן באותה תקופה, אך החוק מאפשר לך לבחור את המסלול המתאים ביותר.');

      if (input.widow.isTemporaryDisability) {
        html += p('<b>הערה: מאחר שדרגת אי-הכושר נקבעה באופן זמני, יש לשלם את הקצבה הגבוהה מבין האפשרויות.</b>');
      }

      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; font-size: 13pt; font-weight: bold;">האפשרויות העומדות בפניך:</p>`;
      html += generateWordOptionsHTML();

      html += p('<b>בחירתי: אפשרות _____</b>', 'margin-top: 16px;');
      html += p('תאריך: ___/___/______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;חתימה: ________________');

      html += `<br/>`;
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; font-size: 13pt; font-weight: bold;">טבלת סיכום:</p>`;
      html += generateWordTableHTML();

      html += `<br/>`;
      html += `<p dir="rtl" align="right" style="direction: rtl; text-align: right; font-size: 13pt; font-weight: bold;">מה עוד חשוב לקחת בחשבון?</p>`;

      html += p('<b>🎁 מענקים רלוונטיים (במסלול שאירים):</b>');
      html += `<ul dir="rtl" style="direction: rtl; text-align: right;">`;
      benefits.grants.forEach(grant => { html += li(grant.text); });
      html += li('מענק נישואין בעתיד (36 קצבאות חודשיות) - רלוונטי רק באפשרויות בהן את/ה במסלול שאירים. שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.');
      html += li('אפשרות לבחון זכאות לתוספת השלמת הכנסה');
      html += `</ul>`;

      html += p('<b>🔵 הטבות במסלול נכות כללית (לפי הנתונים שלך):</b>');
      html += `<ul dir="rtl" style="direction: rtl; text-align: right;">`;
      benefits.disability.forEach(b => { html += li(b.text); });
      html += `</ul>`;

      html += p('<b>💚 הטבות במסלול שאירים (לפי הנתונים שלך):</b>');
      html += `<ul dir="rtl" style="direction: rtl; text-align: right;">`;
      if (benefits.survivors.length > 0) {
        benefits.survivors.forEach(b => { html += li(b.text); });
      } else {
        html += li('אין הטבות נוספות במסלול זה לפי הנתונים שהוזנו');
      }
      html += `</ul>`;

      html += `<hr/>`;
      html += p('<b>לידיעתך:</b>');
      html += `<ul dir="rtl" style="direction: rtl; text-align: right;">`;
      html += li('יש להשיב תוך 21 יום. אם לא תתקבל תשובה, תישלח תזכורת. אם לא תתקבל תשובה תוך 15 יום נוספים, נראה אותך כמי שבחר/ה בקצבה הנוכחית.');
      html += li('הבחירה ניתנת לשינוי בעתיד אם יחול שינוי בנסיבותייך.');
      html += li('אם תבחר/י בקצבת השאירים, ולאחר מכן זכאותך לקצבת שאירים תופסק - זכאותך לקצבת הנכות תתחדש מיד.');
      html += li('שים/י לב: אם את/ה מקבל/ת שר"מ (שירותים מיוחדים), בחירה בשאירים תפסיק את השר"מ הרגיל. יש לבדוק עם פקיד תביעות נכות כללית זכאות לשר"מ מיוחד - שר"מ מיוחד אינו כפל עם קצבת שאירים.');
      html += li('הסכומים מעודכנים לשנת 2026 בהתאם לחוזר תשלומים 33 וכפופים לשינויים.');
      html += `</ul>`;

      html += p('בברכה,');
      html += p('<b>הביטוח הלאומי</b>');
      html += `</body></html>`;

      const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `מכתב_בחירה_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.doc`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "הקובץ הורד בהצלחה ✓",
        description: "קובץ Word נשמר למחשב",
      });
    } catch (err) {
      console.error('Error generating Word document:', err);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור קובץ Word",
        variant: "destructive"
      });
    }
  };
  
  const copyFullLetter = async () => {
    try {
      const htmlContent = generateFullLetterHTML();
      const textContent = generateLetterText();
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([textContent], { type: 'text/plain' })
          })
        ]);
        toast({
          title: "הועתק בהצלחה ✓",
          description: "המכתב המלא עם טבלה מעוצבת הועתק ללוח",
        });
      } catch {
        await navigator.clipboard.writeText(textContent);
        toast({
          title: "הועתק בהצלחה ✓",
          description: "המכתב הועתק כטקסט",
        });
      }
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק",
        variant: "destructive"
      });
    }
  };
  
  const copyTableOnly = async () => {
    try {
      const html = generateTableHTML();
      const plainText = result.options.map((option) => 
        `אפשרות ${option.letter}' (${option.name}): ${option.total.toLocaleString()} ₪`
      ).join('\n');
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          })
        ]);
        toast({
          title: "הועתק בהצלחה ✓",
          description: "הטבלה המעוצבת הועתקה ללוח",
        });
      } catch {
        await navigator.clipboard.writeText(plainText);
        toast({
          title: "הועתק בהצלחה ✓",
          description: "הטבלה הועתקה כטקסט",
        });
      }
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק",
        variant: "destructive"
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('בחירה בין קצבת נכות כללית לקצבת שאירים');
    const body = encodeURIComponent(generateLetterText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  
  if (result.isException) return null;
  
  return (
    <div className="section-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={downloadAsWord} className="gap-2 bg-primary hover:bg-primary/90 px-6 py-3">
          <Download className="w-4 h-4" />
          הורד כקובץ Word
        </Button>
        
        <Button variant="outline" onClick={copyFullLetter} className="gap-2 px-6 py-3">
          <FileText className="w-4 h-4" />
          העתק מכתב
        </Button>
        
        <Button variant="ghost" onClick={copyTableOnly} className="gap-2">
          <Table2 className="w-4 h-4" />
          העתק טבלה בלבד
        </Button>
        
        <Button variant="ghost" onClick={shareViaEmail} className="gap-2">
          <Mail className="w-4 h-4" />
          שלח במייל
        </Button>
        
        <Button variant="ghost" onClick={onReset} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
          נקה הכל
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
