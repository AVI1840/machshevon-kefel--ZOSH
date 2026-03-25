import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DeceasedForm from '@/components/DeceasedForm';
import WidowForm from '@/components/WidowForm';
import ChildrenForm from '@/components/ChildrenForm';
import ResultsTable from '@/components/ResultsTable';
import BenefitsSection from '@/components/BenefitsSection';
import ActionButtons from '@/components/ActionButtons';
import { Button } from '@/components/ui/button';
import {
  CalculatorInput,
  DeceasedInput,
  WidowInput,
  Child,
  calculateOptions,
  calculateBenefits,
  isReadyForCalculation,
} from '@/lib/calculations';
import { useSavedClients, SavedClient } from '@/hooks/useSavedClients';
import { Save, Trash2, Upload, Clock } from 'lucide-react';



const getDefaultInput = (): CalculatorInput => ({
  deceased: {
    seniorityYears: null,
    deathDate: null,
  },
  widow: {
    age: null,
    gender: null,
    incapacity: null,
    medicalDisabilityCategory: null,
    disabilityAmount: null,
    hasIncomeSupport: false,
    isTemporaryDisability: false,
  },
  children: [],
});

const Index = () => {
  const [input, setInput] = useState<CalculatorInput>(getDefaultInput);
  const [formKey, setFormKey] = useState(0);
  const [pristine, setPristine] = useState(true);

  // Saved results - persist even when inputs change
  const [savedResult, setSavedResult] = useState<ReturnType<typeof calculateOptions> | null>(null);
  const [savedBenefits, setSavedBenefits] = useState<ReturnType<typeof calculateBenefits> | null>(null);
  const [savedInput, setSavedInput] = useState<CalculatorInput | null>(null);

  const { clients, saveClient, loadClient, deleteClient, clearAll } = useSavedClients();

  const handleDeceasedChange = (deceased: DeceasedInput) => {
    setPristine(false);
    setInput((prev) => ({ ...prev, deceased }));
  };

  const handleWidowChange = (widow: WidowInput) => {
    setPristine(false);
    setInput((prev) => ({ ...prev, widow }));
  };

  const handleChildrenChange = (children: Child[]) => {
    setPristine(false);
    setInput((prev) => ({ ...prev, children }));
  };

  // Auto-calculate whenever input changes
  useEffect(() => {
    if (!pristine && isReadyForCalculation(input)) {
      const newResult = calculateOptions(input);
      const newBenefits = calculateBenefits(input);
      setSavedResult(newResult);
      setSavedBenefits(newBenefits);
      setSavedInput(input);
    }
  }, [input, pristine]);

  const handleReset = () => {
    setInput(getDefaultInput());
    setPristine(true);
    setFormKey((k) => k + 1);
    setSavedResult(null);
    setSavedBenefits(null);
    setSavedInput(null);
  };

  const handleSaveClient = () => {
    saveClient(input);
  };

  const handleLoadClient = (id: string) => {
    const loaded = loadClient(id);
    if (loaded) {
      setInput(loaded);
      setPristine(false);
      setSavedResult(null);
      setSavedBenefits(null);
      setSavedInput(null);
      setFormKey((k) => k + 1);
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('he-IL')} ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6" key={formKey}>
          {/* Actions bar */}
          <div className="flex flex-wrap gap-2 justify-start">
            <Button variant="outline" onClick={handleReset}>
              התחלה חדשה / ניקוי נתונים
            </Button>
            {!pristine && (
              <Button variant="outline" onClick={handleSaveClient}>
                <Save className="h-4 w-4 ml-1" />
                שמור לקוח
              </Button>
            )}
          </div>

          {/* Saved clients */}
          {clients.length > 0 && (
            <div className="section-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  לקוחות אחרונים ({clients.length}/5)
                </h3>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
                  <Trash2 className="h-3 w-3 ml-1" />
                  נקה הכל
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {clients.map((c: SavedClient) => (
                  <div key={c.id} className="flex items-center gap-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-muted/30">
                    <button
                      onClick={() => handleLoadClient(c.id)}
                      className="hover:text-primary transition-colors flex items-center gap-1"
                      title={`טעינה - ${formatTimestamp(c.timestamp)}`}
                    >
                      <Upload className="h-3 w-3" />
                      {c.label}
                    </button>
                    <button
                      onClick={() => deleteClient(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors mr-1"
                      title="מחק"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Forms */}
          <DeceasedForm data={input.deceased} onChange={handleDeceasedChange} pristine={pristine} />
          <WidowForm data={input.widow} onChange={handleWidowChange} pristine={pristine} />
          <ChildrenForm children={input.children} onChange={handleChildrenChange} />

          {/* Results */}
          <div className="pt-6 border-t border-border">
            {pristine ? (
              <div className="section-card animate-fade-in">
                <h2 className="section-title">תוצאות</h2>
                <p className="text-muted-foreground">מלאו את שדות הגיל ושנות הוותק כדי לראות חישוב.</p>
              </div>
            ) : (
              <>
                {savedInput?.widow.isTemporaryDisability && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded-lg">
                    <span className="text-orange-800 text-sm font-medium">
                      ⚠️ הערה לפקיד: הנכות זמנית - יש לשלם למבוטח/ת את הקצבה הגבוהה מבין שתי האפשרויות.
                    </span>
                  </div>
                )}
                {savedResult && <ResultsTable result={savedResult} />}

                {savedResult && !savedResult.isException && savedBenefits && (
                  <>
                    <div className="mt-6">
                      <BenefitsSection benefits={savedBenefits} />
                    </div>
                    <div className="mt-6">
                      <ActionButtons
                        result={savedResult}
                        benefits={savedBenefits}
                        input={savedInput || input}
                        onReset={handleReset}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>הסכומים מעודכנים לשנת 2026 וכפופים לשינויים (חוזר תשלומים 33)</p>
          <p className="mt-1">אביעד יצחקי, מינהל גמלאות | ביטוח לאומי | v1.0 | מרץ 2026</p>
          <p className="mt-1 opacity-60 text-xs">עדכון אחרון: 24.03.2026</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
