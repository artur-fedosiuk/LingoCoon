// File: src/components/ui/TypingDots.tsx
// Created: 2025-06-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Animated three-dot loading indicator shown while the AI is generating a reply.

// "use client" marks this as a Client Component — it runs in the browser,
// not on the server, because it needs CSS animations.
'use client';

/**
 * TypingDots
 *
 * Shows three bouncing dots (● ● ●) to indicate that the AI is thinking.
 * This component is used in GeneralChat, AiStudySession, and AiPanel.
 *
 * Why a separate component?
 * Before, this code was copy-pasted in TWO files. Now it lives here once.
 * If we ever want to change the animation, we change it in ONE place.
 * This is the DRY (Don't Repeat Yourself) principle.
 */
export default function TypingDots() {
  return (
    // A small horizontal flex container to line the dots up side by side.
    <div className="flex gap-1 items-center py-0.5">
      {/* Create three dots using an array [0, 1, 2] and map each to a span. */}
      {[0, 1, 2].map((dotIndex) => (
        <span
          key={dotIndex}
          className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{
            // Each dot starts its bounce animation slightly later than the previous.
            // This creates the "wave" effect instead of all three bouncing at once.
            animationDelay: `${dotIndex * 0.15}s`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </div>
  );
}
