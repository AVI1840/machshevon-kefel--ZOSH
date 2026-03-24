import { useState } from 'react';
import { Shield, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from '@/components/FeedbackModal';

const Header = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <header style={{ background: 'linear-gradient(135deg, #1B3A5C, #2A5A8C)' }} className="text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">מחשבון כפל גמלאות</h1>
                <p className="text-xs opacity-80">סעיף 320 | אביעד יצחקי, מינהלי גמלאות, ביטוח לאומי</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="gap-1 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/60"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">משוב פיילוט</span>
            </Button>
          </div>
        </div>
      </header>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};

export default Header;
