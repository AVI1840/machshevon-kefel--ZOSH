import { Calculator, Users, Shield } from 'lucide-react';
import { CalculationResult } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  result: CalculationResult;
}

const ResultsTable = ({ result }: ResultsTableProps) => {
  if (result.isException) {
    return (
      <div className="section-card animate-fade-in bg-warning/10 border-warning/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-warning/20 rounded-full">
            <Calculator className="w-5 h-5 text-warning-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">שימו לב - חריג</h3>
            <p className="text-muted-foreground mt-1">{result.exceptionMessage}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const maxTotal = Math.max(...result.options.map(o => o.total));
  
  return (
    <div className="section-card animate-fade-in">
      <h2 className="section-title">
        <Calculator className="w-5 h-5 text-primary" />
        טבלת אפשרויות בחירה - מותאמת לנתונים שהוזנו
      </h2>
      <p className="text-xs text-muted-foreground mb-4">בהתאם לסעיף 320 לחוק הביטוח הלאומי (נוסח משולב), התשנ"ה-1995</p>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right py-3 px-4 font-semibold text-foreground">פירוט</th>
              {result.options.map((option) => (
                <th 
                  key={option.id} 
                  className={cn(
                    "text-center py-3 px-4 font-semibold min-w-[150px]",
                    option.total === maxTotal && "bg-success/10"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">אפשרות {option.letter}'</span>
                    <span className={cn(
                      "text-sm",
                      option.widowTrack === 'disability' && "text-primary",
                      option.widowTrack === 'survivors' && "text-success"
                    )}>
                      {option.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Widow track row */}
            <tr className="border-b border-border/50">
              <td className="py-3 px-4 text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                אלמן/נה
              </td>
              {result.options.map((option) => (
                <td key={option.id} className={cn(
                  "text-center py-3 px-4",
                  option.total === maxTotal && "bg-success/5"
                )}>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    option.widowTrack === 'disability' ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                  )}>
                    {option.widowTrack === 'disability' ? 'נכות' : 'שאירים'}
                  </span>
                  <div className="text-sm mt-1 font-medium">
                    {`${option.baseAmount.toLocaleString()} ₪`}
                  </div>
                </td>
              ))}
            </tr>
            
            {/* Children allocation rows - show for each child with amounts */}
            {result.eligibleChildrenCount > 0 && result.options[0]?.childAllocations.map((_, childIdx) => (
              <tr key={`child-${childIdx}`} className="border-b border-border/50">
                <td className="py-3 px-4 text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {result.options[0]?.childAllocations[childIdx]?.name || `ילד/ה ${childIdx + 1}`}
                </td>
                {result.options.map((option) => {
                  const allocation = option.childAllocations[childIdx];
                  if (!allocation) return <td key={option.id} className="text-center py-3 px-4">-</td>;
                  
                  // Calculate the amount for this specific child
                  let childAmount = '';
                  if (allocation.track === 'disability') {
                    if (allocation.amount > 0) {
                      childAmount = `+${allocation.amount.toLocaleString()} ₪`;
                    }
                  } else {
                    if (allocation.amount > 0) {
                      childAmount = `+${allocation.amount.toLocaleString()} ₪`;
                    } else {
                      childAmount = 'כלול בקצבה';
                    }
                  }
                  
                  return (
                    <td key={option.id} className={cn(
                      "text-center py-3 px-4",
                      option.total === maxTotal && "bg-success/5"
                    )}>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        allocation.track === 'disability' ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                      )}>
                        {allocation.track === 'disability' ? 'ילד תלוי בנכות' : 'יתום בשאירים'}
                      </span>
                      {childAmount && (
                        <div className="text-sm mt-1 font-medium">{childAmount}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Note for 3+ children */}
            {result.eligibleChildrenCount >= 3 && (
              <tr className="border-b border-border/50">
                <td colSpan={result.options.length + 1} className="py-2 px-4">
                  <p className="text-xs text-muted-foreground">
                    * עד 2 ילדים יכולים להיות תלויים במסלול נכות. ילד שלישי ומעלה מוכר כשאיר.
                  </p>
                </td>
              </tr>
            )}
            
            {/* Living allowance row */}
            {result.livingAllowanceEligibleCount > 0 && (
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-muted-foreground">דמי מחיה</td>
                {result.options.map((option) => (
                  <td key={option.id} className={cn(
                    "text-center py-3 px-4",
                    option.total === maxTotal && "bg-success/5"
                  )}>
                    {option.livingAllowance > 0 ? `${option.livingAllowance.toLocaleString()} ₪` : '-'}
                  </td>
                ))}
              </tr>
            )}
            
            {/* Total row */}
            <tr className="bg-muted/30 font-bold">
              <td className="py-4 px-4 text-foreground">סה"כ לחודש</td>
              {result.options.map((option) => (
                <td key={option.id} className={cn(
                  "text-center py-4 px-4 text-lg",
                  option.total === maxTotal ? "bg-success/20 text-success" : "text-foreground"
                )}>
                  {option.total.toLocaleString()} ₪
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;