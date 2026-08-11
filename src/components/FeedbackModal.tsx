import React, { useState } from 'react';
import { X, Send, MessageSquare, Star, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      alert('피드백 의견을 입력해 주세요.');
      return;
    }

    setIsSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, email }),
      });
      setIsSending(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFeedback('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSending(false);
      alert('피드백 전달 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-900/60 rounded-2xl max-w-md w-full p-6 text-amber-50 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-100 font-serif">
              서비스 피드백 & 사용자 의견
            </h3>
            <p className="text-xs text-amber-300/70">
              사수자패트 AI 재학습 및 서비스 품질 개선에 반영됩니다.
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="text-base font-bold text-amber-100 font-serif">피드백이 소중히 접수되었습니다!</div>
            <p className="text-xs text-amber-300/70">감사합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-amber-300 mb-2">만족도 평가</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1">이메일 (선택)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3.5 py-2.5 text-amber-100 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1">개선 및 제안 의견</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="사주, 수리학, 자미두수 분석에 대한 의견이나 요청하고 싶은 기능을 자유롭게 적어주세요."
                rows={4}
                required
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl p-3.5 text-amber-100 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs shadow-md border border-amber-500/30 transition-all flex items-center justify-center space-x-1.5"
            >
              {isSending ? (
                <span>전송 중...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-200" />
                  <span>소중한 의견 전달하기</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
