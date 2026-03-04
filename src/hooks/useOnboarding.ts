import { useState, useEffect } from "react";

const ONBOARDING_KEY = "onboarding_completed";

export function useOnboarding(userId: string | undefined) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `${ONBOARDING_KEY}_${userId}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, [userId]);

  const completeOnboarding = () => {
    if (!userId) return;
    const key = `${ONBOARDING_KEY}_${userId}`;
    localStorage.setItem(key, "true");
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}
