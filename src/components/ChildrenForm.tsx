import { Users, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Child, calculateAge, classifyChild } from '@/lib/calculations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ChildrenFormProps {
  children: Child[];
  onChange: (children: Child[]) => void;
}

const ChildrenForm = ({ children, onChange }: ChildrenFormProps) => {
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});

  // Clear stale manual date inputs when the list resets (e.g., new clean entry)
  useEffect(() => {
    if (children.length === 0) {
      setDateInputs({});
      return;
    }

    // Prune removed children to avoid "old" values showing up
    setDateInputs(prev => {
      const next: Record<string, string> = {};
      for (const c of children) {
        if (prev[c.id] !== undefined) next[c.id] = prev[c.id];
      }
      return next;
    });
  }, [children]);

  const addChild = () => {
    if (children.length >= 10) return;
    const newChild: Child = {
      id: Date.now().toString(),
      name: '',
      birthDate: null,
      gender: null,
      isStudent: false,
      isMilitaryOrNationalService: false
    };
    onChange([...children, newChild]);
  };
  
  const removeChild = (id: string) => {
    onChange(children.filter(c => c.id !== id));
    setDateInputs(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  
  const updateChild = (id: string, updates: Partial<Child>) => {
    onChange(children.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const normalizeDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8); // ddmmyy or ddmmyyyy
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyyOrYy = digits.slice(4);

    let out = dd;
    if (digits.length > 2) out += `/${mm}`;
    if (digits.length > 4) out += `/${yyyyOrYy}`;
    return out;
  };

  const handleDateInputChange = (childId: string, value: string) => {
    const formatted = normalizeDateInput(value);
    setDateInputs(prev => ({ ...prev, [childId]: formatted }));

    // Parse only when fully typed (DD/MM/YY or DD/MM/YYYY)
    if (formatted.length === 8) {
      const parsed = parse(formatted, 'dd/MM/yy', new Date());
      if (isValid(parsed)) {
        updateChild(childId, { birthDate: parsed });
      }
    } else if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        updateChild(childId, { birthDate: parsed });
      }
    } else if (formatted === '') {
      updateChild(childId, { birthDate: null });
    }
  };

  const handleCalendarSelect = (childId: string, date: Date | undefined) => {
    if (date) {
      setDateInputs(prev => ({ ...prev, [childId]: format(date, 'dd/MM/yy') }));
      updateChild(childId, { birthDate: date });
    } else {
      setDateInputs(prev => ({ ...prev, [childId]: '' }));
      updateChild(childId, { birthDate: null });
    }
  };

  const getDateInput = (child: Child) => {
    if (dateInputs[child.id] !== undefined) {
      return dateInputs[child.id];
    }
    return child.birthDate ? format(child.birthDate, 'dd/MM/yy') : '';
  };
  
  return (
    <div className="section-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          ילדים ({children.length})
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addChild}
          disabled={children.length >= 10}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          הוסף ילד/ה
        </Button>
      </div>
      
      {children.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>לא הוזנו ילדים</p>
          <p className="text-sm">לחצו על "הוסף ילד/ה" להוספת ילדים</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child, index) => {
            const classification = classifyChild(child);
            const age = child.birthDate ? calculateAge(child.birthDate) : null;
            const showStudentToggle = age !== null && age >= 14 && age <= 20;
            const maxAge = child.isMilitaryOrNationalService ? 24 : 20;
            const isOverAge = age !== null && age > maxAge;
            const showMilitaryToggle = age !== null && age >= 18 && age <= 24;
            const needsStudentOrMilitarySelection = age !== null && age >= 18 && age <= 24 && !child.isStudent && !child.isMilitaryOrNationalService;
            
            return (
              <div key={child.id} className={cn(
                "p-4 bg-muted/30 rounded-lg border border-border",
                isOverAge && "border-warning/50 bg-warning/5"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">ילד/ה {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChild(child.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="form-label text-xs">שם/כינוי</Label>
                    <Input
                      value={child.name}
                      onChange={(e) => updateChild(child.id, { name: e.target.value })}
                      placeholder="לזיהוי בטבלה"
                      className="text-right text-sm"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div>
                    <Label className="form-label text-xs">תאריך לידה</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getDateInput(child)}
                        onChange={(e) => handleDateInputChange(child.id, e.target.value)}
                        placeholder="dd/mm/yy"
                        className="text-right text-sm flex-1"
                        dir="ltr"
                        inputMode="numeric"
                        pattern="\\d{2}/\\d{2}/\\d{2,4}"
                        autoComplete="off"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0 h-9 w-9">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={child.birthDate || undefined}
                            onSelect={(date) => handleCalendarSelect(child.id, date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {age !== null && (
                      <p className={cn(
                        "text-xs mt-1",
                        isOverAge ? "text-warning" : "text-muted-foreground"
                      )}>
                        גיל: {age}
                        {isOverAge && ` - מעל ${maxAge}, לא זכאי/ת לתוספת`}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="form-label text-xs">מין</Label>
                    <RadioGroup
                      value={child.gender ?? ''}
                      onValueChange={(value: 'male' | 'female') => updateChild(child.id, { gender: value })}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="male" id={`male-${child.id}`} />
                        <Label htmlFor={`male-${child.id}`} className="text-sm cursor-pointer">זכר</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="female" id={`female-${child.id}`} />
                        <Label htmlFor={`female-${child.id}`} className="text-sm cursor-pointer">נקבה</Label>
                      </div>
                    </RadioGroup>
                    {child.gender === null && child.birthDate !== null && (
                      <p className="text-xs text-destructive mt-1">יש לבחור מין</p>
                    )}
                  </div>
                  
                  {showStudentToggle && (
                    <div>
                      <Label className="form-label text-xs">תלמיד/ה?</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          checked={child.isStudent}
                          onCheckedChange={(checked) => updateChild(child.id, { isStudent: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {child.isStudent ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {showMilitaryToggle && (
                    <div>
                      <Label className="form-label text-xs">שירות צבאי/לאומי?</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          checked={child.isMilitaryOrNationalService}
                          onCheckedChange={(checked) => updateChild(child.id, { isMilitaryOrNationalService: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {child.isMilitaryOrNationalService ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {needsStudentOrMilitarySelection && (
                  <p className="text-xs text-destructive font-semibold mt-2">
                    יש לציין האם מדובר בתלמיד/ה או בשירות צבאי/לאומי
                  </p>
                )}
                
                {classification && !isOverAge && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {classification.isEligibleForDependentAdd && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">זכאי/ת לתוספת</span>
                      )}
                      {classification.isEligibleForLivingAllowance && (
                        <span className="px-2 py-1 bg-success/10 text-success rounded">זכאי/ת לדמי מחיה</span>
                      )}
                      {classification.isEligibleForBarMitzva && (
                        <span className="px-2 py-1 bg-warning/20 text-warning-foreground rounded">
                          {classification.barMitzvaType} בעוד {classification.yearsToBarMitzva} שנים
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChildrenForm;