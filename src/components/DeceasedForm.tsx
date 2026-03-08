import { User, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeceasedInput } from '@/lib/calculations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface DeceasedFormProps {
  data: DeceasedInput;
  onChange: (data: DeceasedInput) => void;
  pristine?: boolean;
}

const DeceasedForm = ({ data, onChange, pristine = false }: DeceasedFormProps) => {
  const [seniorityInput, setSeniorityInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');

  // Keep local input state in sync when parent resets/changes
  useEffect(() => {
    if (pristine) {
      setSeniorityInput('');
      setDateInput('');
      setDateError('');
      return;
    }

    setSeniorityInput(data.seniorityYears !== null ? String(data.seniorityYears) : '');
    setDateInput(data.deathDate ? format(data.deathDate, 'dd/MM/yy') : '');
    setDateError('');
  }, [data.deathDate, data.seniorityYears, pristine]);

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

  const handleDateInputChange = (value: string) => {
    const formatted = normalizeDateInput(value);
    setDateInput(formatted);
    setDateError('');

    // Parse only when fully typed (DD/MM/YY or DD/MM/YYYY)
    if (formatted.length === 8) {
      const parsed = parse(formatted, 'dd/MM/yy', new Date());
      if (isValid(parsed)) {
        onChange({ ...data, deathDate: parsed });
      } else {
        setDateError('תאריך לא תקין');
      }
    } else if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        onChange({ ...data, deathDate: parsed });
      } else {
        setDateError('תאריך לא תקין');
      }
    } else if (formatted === '') {
      onChange({ ...data, deathDate: null });
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setDateInput(format(date, 'dd/MM/yy'));
      onChange({ ...data, deathDate: date });
    } else {
      setDateInput('');
      onChange({ ...data, deathDate: null });
    }
  };

  const handleSeniorityChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setSeniorityInput(digits);

    if (digits === '') {
      onChange({ ...data, seniorityYears: null });
      return;
    }

    const value = Math.min(25, Math.max(0, parseInt(digits, 10)));
    onChange({ ...data, seniorityYears: value });
  };

  return (
    <div className="section-card animate-fade-in">
      <h2 className="section-title">
        <User className="w-5 h-5 text-primary" />
        פרטי המנוח/ה
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="seniority" className="form-label">שנות ותק *</Label>
          <Input
            id="seniority"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={seniorityInput}
            onChange={(e) => handleSeniorityChange(e.target.value)}
            className="text-right"
            placeholder="הזן"
          />
          <p className="text-xs text-muted-foreground mt-1">0–25 שנים</p>
        </div>

        <div>
          <Label htmlFor="deathDate" className="form-label">תאריך פטירה *</Label>
          <div className="flex gap-2">
            <Input
              id="deathDate"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={dateInput}
              onChange={(e) => handleDateInputChange(e.target.value)}
              className="text-right flex-1"
              placeholder="DD/MM/YY"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.deathDate || undefined}
                  onSelect={handleCalendarSelect}
                  locale={he}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {dateError && <p className="text-xs text-destructive mt-1">{dateError}</p>}
          
        </div>
      </div>
    </div>
  );
};

export default DeceasedForm;