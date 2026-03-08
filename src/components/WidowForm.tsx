import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WidowInput } from '@/lib/calculations';
import { INCAPACITY_OPTIONS } from '@/lib/constants';
import { getDisabilityBaseAmount } from '@/lib/calculations';

interface WidowFormProps {
  data: WidowInput;
  onChange: (data: WidowInput) => void;
  pristine?: boolean;
}


const WidowForm = ({ data, onChange, pristine = false }: WidowFormProps) => {
  const [ageInput, setAgeInput] = useState('');
  const [disabilityAmountInput, setDisabilityAmountInput] = useState('');

  useEffect(() => {
    if (pristine) {
      setAgeInput('');
      setDisabilityAmountInput('');
      return;
    }

    setAgeInput(String(data.age ?? ''));
    setDisabilityAmountInput(String(data.disabilityAmount ?? ''));
  }, [data.age, data.disabilityAmount, pristine]);

  const handleIncapacityChange = (value: string) => {
    const incapacity = parseInt(value, 10) as 60 | 65 | 74 | 100;
    onChange({ ...data, incapacity });
  };

  const toDigits = (raw: string, maxLen = 9) => raw.replace(/\D/g, '').slice(0, maxLen);

  return (
    <div className="section-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h2 className="section-title">
        <Heart className="w-5 h-5 text-primary" />
        פרטי האלמן/נה
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="age" className="form-label">גיל</Label>
          <Input
            id="age"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={ageInput}
            onChange={(e) => {
              const digits = toDigits(e.target.value, 3);
              setAgeInput(digits);
              if (digits === '') {
                onChange({ ...data, age: null });
                return;
              }
              const parsed = parseInt(digits, 10);
              onChange({ ...data, age: parsed });
            }}
            onBlur={() => {
              if (ageInput === '' || data.age === null) return;
              const clamped = Math.min(119, Math.max(18, data.age));
              if (clamped !== data.age) {
                setAgeInput(String(clamped));
                onChange({ ...data, age: clamped });
              }
            }}
            className="text-right"
            placeholder="הזן"
          />
          <p className="text-xs text-muted-foreground mt-1">טווח: 18–119</p>
          {!pristine && data.age !== null && data.age < 40 && ageInput !== '' && (
            <p className="text-xs text-warning mt-1">שימו לב: אלמן/נה מתחת ל-40</p>
          )}
        </div>

        <div>
          <Label className="form-label">מין</Label>
          <RadioGroup
            value={data.gender ?? undefined}
            onValueChange={(v: 'male' | 'female') => onChange({ ...data, gender: v })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="widow-female" />
              <Label htmlFor="widow-female" className="text-sm cursor-pointer">נקבה</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="widow-male" />
              <Label htmlFor="widow-male" className="text-sm cursor-pointer">זכר</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="form-label">דרגת אי-כושר</Label>
          <Select value={data.incapacity?.toString()} onValueChange={handleIncapacityChange}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="בחר דרגה" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {INCAPACITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="form-label">סוג הנכות</Label>
          <RadioGroup
            value={data.isTemporaryDisability ? 'temporary' : 'permanent'}
            onValueChange={(v) => onChange({ ...data, isTemporaryDisability: v === 'temporary' })}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="permanent" id="permanent" />
              <Label htmlFor="permanent" className="text-sm cursor-pointer">לצמיתות</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="temporary" id="temporary" />
              <Label htmlFor="temporary" className="text-sm cursor-pointer">זמנית</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="disabilityAmount" className="form-label">סכום קצבת נכות חודשית (₪)</Label>
          <Input
            id="disabilityAmount"
            name="disabilityAmount"
            type="text"
            inputMode="numeric"
            min={0}
            autoComplete="off"
            value={disabilityAmountInput}
            onChange={(e) => {
              const digits = toDigits(e.target.value, 7);
              setDisabilityAmountInput(digits);
              if (digits === '') {
                onChange({ ...data, disabilityAmount: null });
                return;
              }
              onChange({ ...data, disabilityAmount: parseInt(digits, 10) || 0 });
            }}
            className="text-right"
            placeholder={data.incapacity ? getDisabilityBaseAmount(data.incapacity).toLocaleString() : 'הזן'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            ברירת מחדל: {data.incapacity ? getDisabilityBaseAmount(data.incapacity).toLocaleString() : '—'} ₪
          </p>
        </div>

        <div className="md:col-span-2 lg:col-span-3 space-y-3">
          <p className="text-xs text-muted-foreground">לחישוב מדויק של קיזוז הכנסות - פנה/י לפקיד תביעות</p>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="incomeSupport" className="form-label mb-0">זכאי/ת להשלמת הכנסה בשאירים?</Label>
              <p className="text-xs text-muted-foreground">משפיע על הטבות שאירים</p>
            </div>
            <Switch
              id="incomeSupport"
              checked={data.hasIncomeSupport}
              onCheckedChange={(checked) => onChange({ ...data, hasIncomeSupport: checked })}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default WidowForm;
