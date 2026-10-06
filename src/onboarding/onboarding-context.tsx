import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getOnboarding, type ActiveOnboardingConfig } from '@/api';

import {
  getOnboardingSeenVersion,
  setOnboardingSeenVersion,
} from './onboarding-storage';

export type OnboardingStatus = 'loading' | 'not-required' | 'required';

export interface OnboardingContextValue {
  status: OnboardingStatus;
  /**
   * The active backend config, present only while status === 'required'.
   * `null` everywhere else — the screen must not render slides without it.
   */
  config: ActiveOnboardingConfig | null;
  /**
   * Completion action (Skip or Get Started). Persists the current backend
   * version FIRST, then flips the state to not-required so the gate can
   * navigate. Throws on a failed write; the caller must stay on onboarding.
   */
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

function isUsableActiveConfig(config: unknown): config is ActiveOnboardingConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const candidate = config as Partial<ActiveOnboardingConfig>;

  if (candidate.enabled !== true) {
    return false;
  }

  // Spec §25 — invalid version (missing / <= 0 / non-integer) is an invalid remote config.
  if (!Number.isSafeInteger(candidate.version) || (candidate.version as number) <= 0) {
    return false;
  }

  // Spec §24 — an enabled config with zero slides is invalid (fail open, never mark seen).
  if (!Array.isArray(candidate.slides) || candidate.slides.length === 0) {
    return false;
  }

  return true;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const [config, setConfig] = useState<ActiveOnboardingConfig | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getOnboarding();

        if (!isUsableActiveConfig(response?.data)) {
          // Disabled (enabled=false) OR invalid/malformed remote config →
          // fail open, onboarding NOT required, seen version untouched.
          setConfig(null);
          setStatus('not-required');
          return;
        }

        // Remote config is valid and active. A local read failure or a missing
        // seen version must NOT fail open (spec §9): treat as unseen.
        const seenVersion = await getOnboardingSeenVersion();

        if (!isMounted) return;

        const isSeen = seenVersion !== null && seenVersion >= response.data.version;

        setConfig(isSeen ? null : response.data);
        setStatus(isSeen ? 'not-required' : 'required');
      } catch {
        // Remote failure (network / timeout / HTTP error / malformed body) →
        // fail open (spec §8): allow the app through, never block, never write
        // the seen version. Retried on the next authenticated startup.
        if (!isMounted) return;
        setConfig(null);
        setStatus('not-required');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (status !== 'required' || config === null) {
      throw new Error('Onboarding is not required — nothing to complete');
    }

    // Persistence BEFORE any state change (spec §17/§18). If the write fails we
    // leave status 'required' / config intact and rethrow so the screen can
    // reset and let the user retry (spec §19).
    await setOnboardingSeenVersion(config.version);

    setStatus('not-required');
    setConfig(null);
  }, [config, status]);

  const value = useMemo<OnboardingContextValue>(
    () => ({ status, config, completeOnboarding }),
    [status, config, completeOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}