import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "btl-feedback-calculator-overlap";
const PROJECT_NAME = "מחשבון כפל גמלאות";

// הדבק כאן את ה-URL של Google Apps Script Web App
const GOOGLE_SCRIPT_URL = "";

type Category = "🐛 באג" | "💡 שיפור" | "📊 נתונים" | "🎨 עיצוב";
type Severity = "קריטי" | "שיפור" | "קטן";

interface FeedbackEntry {
  id: number;
  category: Category | "";
  severity: Severity | "";
  text: string;
  timestamp: string;
  sent: boolean;
}

async function sendToSheet(entry: FeedbackEntry) {
  if (!GOOGLE_SCRIPT_URL) return false;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: PROJECT_NAME,
        category: entry.category,
        severity: entry.severity,
        text: entry.text,
        userAgent: navigator.userAgent,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<Category | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [text, setText] = useState("");
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<"" | "ok" | "offline">("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, [open]);

  useEffect(() => {
    if (!open || !GOOGLE_SCRIPT_URL) return;
    const unsent = items.filter((i) => !i.sent);
    if (!unsent.length) return;
    Promise.all(unsent.map((i) => sendToSheet(i))).then((results) => {
      const updated = items.map((item) => {
        const idx = unsent.findIndex((u) => u.id === item.id);
        if (idx >= 0 && results[idx]) return { ...item, sent: true };
        return item;
      });
      save(updated);
    });
  }, [open]);

  const save = (updated: FeedbackEntry[]) => {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    setLastStatus("");
    const entry: FeedbackEntry = {
      id: Date.now(),
      category,
      severity,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      sent: false,
    };
    const ok = await sendToSheet(entry);
    entry.sent = ok;
    save([entry, ...items]);
    setCategory("");
    setSeverity("");
    setText("");
    setSending(false);
    setLastStatus(ok ? "ok" : "offline");
    setTimeout(() => setLastStatus(""), 3000);
  };

  const handleExport = () => {
    if (!items.length) return;
    const lines = items.map((fb) =>
      `[${new Date(fb.timestamp).toLocaleString("he-IL")}] [${fb.category || "—"}] [${fb.severity || "—"}] ${fb.text}`
    );
    const content = `משובי פיילוט — ${PROJECT_NAME}\n${"=".repeat(50)}\n\n${lines.join("\n\n")}`;
    navigator.clipboard.writeText(content);
  };

  const handleClear = () => { save([]); };

  const sevColor = (s: Severity | "") =>
    s === "קריטי" ? "border-red-500 bg-red-50 text-red-700" :
    s === "שיפור" ? "border-orange-400 bg-orange-50 text-orange-700" :
    s === "קטן" ? "border-green-500 bg-green-50 text-green-700" : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg">💬 משוב פיילוט</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <p className="text-sm font-medium mb-2 text-right">קטגוריה</p>
            <div className="flex gap-2 flex-wrap justify-end">
              {(["🐛 באג", "💡 שיפור", "📊 נתונים", "🎨 עיצוב"] as Category[]).map((c) => (
                <button key={c} onClick={() => setCategory(category === c ? "" : c)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${category === c ? "border-[#1B3A5C] bg-[#1B3A5C] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#1B3A5C]"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-right">חומרה</p>
            <div className="flex gap-2 flex-wrap justify-end">
              {(["קריטי", "שיפור", "קטן"] as Severity[]).map((s) => (
                <button key={s} onClick={() => setSeverity(severity === s ? "" : s)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${severity === s ? `${sevColor(s)} border-2` : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-right">תיאור</p>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="תאר את המשוב..." className="min-h-[80px] text-right" dir="rtl" />
          </div>
          <div className="relative">
            <Button onClick={handleSubmit} disabled={!text.trim() || sending} className="w-full text-white" style={{ backgroundColor: "#1B3A5C" }}>
              {sending ? "שולח..." : "שלח משוב"}
            </Button>
            {lastStatus === "ok" && (
              <p className="text-xs text-green-600 text-center mt-1">✅ נשלח בהצלחה</p>
            )}
            {lastStatus === "offline" && (
              <p className="text-xs text-orange-500 text-center mt-1">📱 נשמר מקומית — יישלח כשיהיה חיבור</p>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <button onClick={handleClear} className="text-xs text-red-500 hover:underline">מחק הכל</button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{items.length} משובים</span>
                  <button onClick={handleExport} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">📋 ייצוא ללוח</button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((fb) => (
                  <div key={fb.id} className="bg-gray-50 rounded-lg p-3 text-right border border-gray-200">
                    <div className="flex items-center gap-2 mb-1 flex-wrap justify-end">
                      {fb.category && <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] font-medium">{fb.category}</span>}
                      {fb.severity && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sevColor(fb.severity as Severity)}`}>{fb.severity}</span>}
                      {!fb.sent && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">⏳ ממתין</span>}
                      {fb.sent && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">✅</span>}
                      <span className="text-xs text-gray-400">{new Date(fb.timestamp).toLocaleString("he-IL")}</span>
                    </div>
                    <p className="text-sm text-gray-800">{fb.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}