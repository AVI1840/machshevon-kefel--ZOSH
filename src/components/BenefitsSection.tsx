import { Lightbulb, Shield, Heart, Gift } from 'lucide-react';
import { BenefitsResult } from '@/lib/calculations';

interface BenefitsSectionProps {
  benefits: BenefitsResult;
}

const BenefitsSection = ({ benefits }: BenefitsSectionProps) => {
  return (
    <div className="section-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h2 className="section-title">
        <Lightbulb className="w-5 h-5 text-primary" />
        מה עוד חשוב לקחת בחשבון?
      </h2>
      
      <p className="text-muted-foreground mb-6">
        מלבד הסכום החודשי, כל מסלול מעניק זכויות שונות:
      </p>
      
      <div className="space-y-4">
        {/* 1. Grants section - FIRST (yellow) - includes marriage grant */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4" />
            🎁 מענקים רלוונטיים - במסלול שאירים:
          </h3>
          <ul className="space-y-2">
            {benefits.grants.map((grant, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-yellow-900">
                <span className="text-yellow-600 mt-1">•</span>
                <span>
                  {grant.text}
                  {grant.note && (
                    <span className="text-yellow-700 text-xs block">{grant.note}</span>
                  )}
                </span>
              </li>
            ))}
            {/* Marriage grant - conditional note */}
            <li className="flex items-start gap-2 text-sm text-yellow-900">
              <span className="text-yellow-600 mt-1">•</span>
              <span>מענק נישואין - 36 קצבאות חודשיות - <strong>רלוונטי רק באפשרויות בהן את/ה במסלול שאירים.</strong> שים/י לב: עם תשלום מענק הנישואין תופסק הזכאות לקצבת שאירים עבורך.</span>
            </li>
            {/* Income supplement option */}
            <li className="flex items-start gap-2 text-sm text-yellow-900">
              <span className="text-yellow-600 mt-1">•</span>
              <span>אפשרות לבחון זכאות לתוספת השלמת הכנסה</span>
            </li>
          </ul>
        </div>
        
        {/* 2. Disability benefits (blue) - personalized */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" />
            🔵 הטבות במסלול נכות כללית - לפי הנתונים שלך:
          </h3>
          <ul className="space-y-2">
            {benefits.disability.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  {benefit.text}
                  {benefit.condition && (
                    <span className="text-blue-700 text-xs block">{benefit.condition}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* 3. Survivors benefits (green) - personalized */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4" />
            💚 הטבות במסלול שאירים - לפי הנתונים שלך:
          </h3>
          <ul className="space-y-2">
            {benefits.survivors.length > 0 ? (
              benefits.survivors.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-900">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{benefit.text}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2 text-sm text-green-700">
                <span className="text-green-600 mt-1">•</span>
                <span>אין הטבות נוספות במסלול זה לפי הנתונים שהוזנו</span>
              </li>
            )}
          </ul>
        </div>

        {/* Special Mobility Benefit note */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-900">
            <strong>שים/י לב:</strong> אם את/ה מקבל/ת שר"מ - שירותים מיוחדים, בחירה בשאירים תפסיק את השר"מ הרגיל. יש לבדוק עם פקיד תביעות נכות כללית זכאות לשר"מ מיוחד - שר"מ מיוחד אינו כפל עם קצבת שאירים.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSection;