'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Brain, Zap } from 'lucide-react';

interface WelcomeStepProps {
  /** Callback when user clicks to start */
  onNext: () => void;
}

/**
 * Welcome step - introduces the app and its value proposition.
 * First step in the onboarding flow.
 */
export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const benefits = [
    {
      icon: Brain,
      title: 'AI-Powered Personalization',
      description: 'Lessons adapt to your learning style and pace',
    },
    {
      icon: Sparkles,
      title: 'Smart Progress Tracking',
      description: 'Track your journey with detailed insights',
    },
    {
      icon: Zap,
      title: 'Learn Faster',
      description: 'Scientifically proven methods for retention',
    },
  ];

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="text-6xl mb-4" role="img" aria-label="Raccoon mascot">
          🦝
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome to LinguaCoon
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Learn languages with AI-powered personalization
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-4 w-full max-w-md">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 text-left"
          >
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <benefit.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button
        size="lg"
        onClick={onNext}
        className="w-full max-w-md text-lg py-6"
      >
        Get Started
      </Button>

      <p className="text-xs text-muted-foreground">
        Takes less than 2 minutes to set up
      </p>
    </div>
  );
}
