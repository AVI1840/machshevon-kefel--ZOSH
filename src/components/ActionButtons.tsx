import { Copy, Table2, Trash2, FileText, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalculationResult, BenefitsResult, CalculatorInput } from '@/lib/calculations';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Header, ImageRun, HeadingLevel } from 'docx';
import btlLogo from '@/assets/btl-logo.png';

// Helper: creates a TextRun with full RTL settings
function hebrewText(text: string, options?: { bold?: boolean; size?: number; color?: string }): TextRun {
  return new TextRun({
    text,
    bold: options?.bold,
    size: options?.size,
    color: options?.color,
    rightToLeft: true,
    language: { value: "he-IL" }
  });
}

// Helper: creates a right-aligned RTL Paragraph
function hebrewParagraph(children: TextRun[], options?: { spacing?: any; indent?: any }): Paragraph {
  return new Paragraph({
    children,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: options?.spacing,
    indent: options?.indent,
  });
}

interface ActionButtonsProps {
  result: CalculationResult;
  benefits: BenefitsResult;
  input: CalculatorInput;
  onReset: () => void;
}

const ActionButtons = ({ result, benefits, input, onReset }: ActionButtonsProps) => {
  const { toast } = useToast();

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
    return html;
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
    
    return text;
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

    return text;
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
    
    return html;
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
    
    return html;
  };
  
  const downloadAsWord = async () => {
    try {
      const logoResponse = await fetch(btlLogo);
      const logoBlob = await logoResponse.blob();
      const logoArrayBuffer = await logoBlob.arrayBuffer();
      const logoUint8Array = new Uint8Array(logoArrayBuffer);

      const createOptionParagraphs = (): Paragraph[] => {
        const paragraphs: Paragraph[] = [];

        // כותרת
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: "האפשרויות העומדות בפניך:",
            bold: true,
            size: 26,
            rightToLeft: true
          })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          bidirectional: true
        }));

        // כל אפשרות - עיגול ריק + פירוט
        result.options.forEach((option, index) => {
          // שורת האפשרות הראשית עם עיגול
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: `○  אפשרות ${option.letter}' - ${option.name}`,
              bold: true,
              size: 24,
              rightToLeft: true
            })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 250, after: 80 },
            bidirectional: true,
            indent: { right: 200 }
          }));

          // פירוט: אלמן/ה
          const widowTrackLabel = option.widowTrack === 'disability' ? 'נכות' : 'שאירים';
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: `אלמן/ה: [${widowTrackLabel}] ${option.baseAmount.toLocaleString('he-IL')} ₪`,
              size: 22,
              rightToLeft: true
            })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            bidirectional: true,
            indent: { right: 600 }
          }));

          // פירוט: ילדים
          if (option.childAllocations && option.childAllocations.length > 0) {
            option.childAllocations.forEach(allocation => {
              const trackLabel = allocation.track === 'disability' ? 'ילד תלוי בנכות' : 'יתום בשאירים';
              const amountText = allocation.amount > 0
                ? `+${allocation.amount.toLocaleString('he-IL')} ₪`
                : 'תוספת בקצבת שאירים';
              paragraphs.push(new Paragraph({
                children: [new TextRun({
                  text: `${allocation.name}: [${trackLabel}] ${amountText}`,
                  size: 22,
                  rightToLeft: true
                })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 40 },
                bidirectional: true,
                indent: { right: 600 }
              }));
            });
          }

          // דמי מחיה (אם יש)
          if (option.livingAllowance > 0) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: `דמי מחיה: ${option.livingAllowance.toLocaleString('he-IL')} ₪`,
                size: 22,
                rightToLeft: true
              })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
              bidirectional: true,
              indent: { right: 600 }
            }));
          }

          // סה"כ - מודגש
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: `סה"כ לחודש: ${option.total.toLocaleString('he-IL')} ₪`,
              bold: true,
              size: 24,
              rightToLeft: true
            })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60 },
            bidirectional: true,
            indent: { right: 600 }
          }));

          // קו מפריד בין אפשרויות (חוץ מהאחרונה)
          if (index < result.options.length - 1) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: "─────────────────────────────",
                size: 18,
                color: "CCCCCC"
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 80 }
            }));
          }
        });

        // שורת בחירה
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: "בחירתי: אפשרות _____",
            bold: true,
            size: 24,
            rightToLeft: true
          })],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 300, after: 100 },
          bidirectional: true
        }));

        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: "תאריך: ___/___/______          חתימה: ________________",
            size: 22,
            rightToLeft: true
          })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300 },
          bidirectional: true
        }));

        return paragraphs;
      };

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                rightToLeft: true,
                language: { value: "he-IL" },
                font: "Arial"
              },
              paragraph: {
                bidirectional: true,
                alignment: AlignmentType.RIGHT
              } as any
            }
          }
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 }
            },
            bidi: true,
            titlePage: false
          } as any,
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new ImageRun({
                      data: logoUint8Array,
                      transformation: { width: 160, height: 55 },
                      type: 'png'
                    })
                  ]
                }),
                hebrewParagraph(
                  [hebrewText("המוסד לביטוח לאומי", { bold: true, size: 32, color: "0066CC" })],
                  { spacing: { after: 200 } }
                )
              ]
            })
          },
          children: [
            // Subject
            hebrewParagraph(
              [hebrewText("נושא: בחירה בין קצבת נכות כללית לקצבת שאירים", { bold: true, size: 28 })],
              { spacing: { after: 200 } }
            ),
            
            // Greeting
            hebrewParagraph(
              [hebrewText("שלום רב,")],
              { spacing: { after: 100 } }
            ),
            hebrewParagraph(
              [hebrewText("אנו משתתפים בצערך על פטירת המנוח/ה.")],
              { spacing: { after: 200 } }
            ),
            
            // Intro
            hebrewParagraph(
              [hebrewText("מבדיקת הנתונים עולה כי הינך זכאי/ת הן לקצבת שאירים והן לקצבת נכות כללית. לפי חוק הביטוח הלאומי (סעיף 320), לא ניתן לקבל את שתי הקצבאות במלואן באותה תקופה, אך החוק מאפשר לך לבחור את המסלול המתאים ביותר.")],
              { spacing: { after: 200 } }
            ),

            // Temporary disability note
            ...(input.widow.isTemporaryDisability ? [
              hebrewParagraph(
                [hebrewText("הערה: מאחר שדרגת אי-הכושר נקבעה באופן זמני, יש לשלם את הקצבה הגבוהה מבין האפשרויות.", { bold: true })],
                { spacing: { after: 200 } }
              )
            ] : []),

            // Options list with radio circles
            ...createOptionParagraphs(),
            
            // Benefits section
            hebrewParagraph(
              [hebrewText("מה עוד חשוב לקחת בחשבון?", { bold: true, size: 26 })],
              { spacing: { before: 400, after: 200 } }
            ),
            
            // 1. Grants
            ...(benefits.grants.length > 0 ? [
              hebrewParagraph(
                [hebrewText("🎁 מענקים רלוונטיים (במסלול שאירים):", { bold: true, color: "92400E" })],
                { spacing: { after: 100 } }
              ),
              ...benefits.grants.map(grant => hebrewParagraph(
                [hebrewText(`• ${grant.text}`)],
                { indent: { right: 400 } }
              )),
              hebrewParagraph(
                [hebrewText(`• מענק נישואין בעתיד (36 קצבאות חודשיות) - רלוונטי רק באפשרויות בהן את/ה במסלול שאירים. שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.`)],
                { indent: { right: 400 } }
              ),
              hebrewParagraph(
                [hebrewText(`• אפשרות לבחון זכאות לתוספת השלמת הכנסה`)],
                { indent: { right: 400 } }
              ),
              new Paragraph({ children: [], spacing: { after: 200 } })
            ] : [
              hebrewParagraph(
                [hebrewText("🎁 מענקים רלוונטיים (במסלול שאירים):", { bold: true, color: "92400E" })],
                { spacing: { after: 100 } }
              ),
              hebrewParagraph(
                [hebrewText(`• מענק נישואין בעתיד (36 קצבאות חודשיות) - רלוונטי רק באפשרויות בהן את/ה במסלול שאירים. שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.`)],
                { indent: { right: 400 } }
              ),
              hebrewParagraph(
                [hebrewText(`• אפשרות לבחון זכאות לתוספת השלמת הכנסה`)],
                { indent: { right: 400 } }
              ),
              new Paragraph({ children: [], spacing: { after: 200 } })
            ]),
            
            // 2. Disability benefits
            hebrewParagraph(
              [hebrewText("🔵 הטבות במסלול נכות כללית (לפי הנתונים שלך):", { bold: true, color: "1E40AF" })],
              { spacing: { after: 100 } }
            ),
            ...benefits.disability.map(b => hebrewParagraph(
              [hebrewText(`• ${b.text}`)],
              { indent: { right: 400 } }
            )),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            
            // 3. Survivors benefits
            hebrewParagraph(
              [hebrewText("💚 הטבות במסלול שאירים (לפי הנתונים שלך):", { bold: true, color: "166534" })],
              { spacing: { after: 100 } }
            ),
            ...(benefits.survivors.length > 0 
              ? benefits.survivors.map(b => hebrewParagraph(
                  [hebrewText(`• ${b.text}`)],
                  { indent: { right: 400 } }
                ))
              : [hebrewParagraph(
                  [hebrewText(`• אין הטבות נוספות במסלול זה לפי הנתונים שהוזנו`)],
                  { indent: { right: 400 } }
                )]),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            
            // Footer info
            hebrewParagraph(
              [hebrewText("לידיעתך:", { bold: true })],
              { spacing: { before: 200, after: 100 } }
            ),
            hebrewParagraph([hebrewText("• יש להשיב תוך 21 יום. אם לא תתקבל תשובה, תישלח תזכורת. אם לא תתקבל תשובה תוך 15 יום נוספים, נראה אותך כמי שבחר/ה בקצבה הנוכחית.")]),
            hebrewParagraph([hebrewText("• הבחירה ניתנת לשינוי בעתיד אם יחול שינוי בנסיבותייך.")]),
            hebrewParagraph([hebrewText("• אם תבחר/י בקצבת השאירים, ולאחר מכן זכאותך לקצבת שאירים תופסק - זכאותך לקצבת הנכות תתחדש מיד.")]),
            hebrewParagraph([hebrewText("• שים/י לב: אם את/ה מקבל/ת שר\"מ (שירותים מיוחדים), בחירה בשאירים תפסיק את השר\"מ הרגיל. יש לבדוק עם פקיד תביעות נכות כללית זכאות לשר\"מ מיוחד - שר\"מ מיוחד אינו כפל עם קצבת שאירים.")]),
            hebrewParagraph(
              [hebrewText(`• הסכומים מעודכנים לשנת 2026 בהתאם לחוזר תשלומים 33 וכפופים לשינויים.`)],
              { spacing: { after: 300 } }
            ),
            
            // Signature
            hebrewParagraph([hebrewText("בברכה,")]),
            hebrewParagraph([hebrewText("הביטוח הלאומי", { bold: true })])
          ]
        }]
      });

      const buffer = await Packer.toBlob(doc);
      
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url;
      a.download = `מכתב_בחירה_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.docx`;
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
