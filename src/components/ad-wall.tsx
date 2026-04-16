"use client";

import { useState, useEffect, useCallback } from "react";

interface AdWallProps {
  onComplete: () => void;
  onCancel: () => void;
  reason?: string;
}

export default function AdWall({ onComplete, onCancel, reason }: AdWallProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSkip = useCallback(() => {
    if (canSkip) onComplete();
  }, [canSkip, onComplete]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📺</span>
          </div>

          <h3 className="font-semibold text-lg mb-2">观看广告解锁</h3>
          {reason && (
            <p className="text-sm text-muted-foreground mb-4">{reason}</p>
          )}

          <div className="bg-muted rounded-xl p-8 mb-4 relative overflow-hidden">
            <div className="text-muted-foreground text-sm">广告位</div>
            <div className="text-xs text-muted-foreground mt-1">
              这里将展示广告内容
            </div>
            <div
              className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm hover:bg-border transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSkip}
              disabled={!canSkip}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all disabled:opacity-40"
            >
              {canSkip ? "继续" : `${countdown}s 后可跳过`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
