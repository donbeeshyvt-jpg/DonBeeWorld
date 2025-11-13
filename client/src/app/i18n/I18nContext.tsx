"use client";

import { createContext, useCallback, useMemo, useState } from "react";

import { LocaleKey, messages } from "./locales";

type I18nValue = {
  locale: LocaleKey;
  t: (key: keyof typeof messages["zh-TW"]) => string;
  switchLocale: (next: LocaleKey) => void;
};

export const I18nContext = createContext<I18nValue>({
  locale: "zh-TW",
  t: (key) => messages["zh-TW"][key],
  switchLocale: () => undefined
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LocaleKey>("zh-TW");

  const t = useCallback(
    (key: keyof typeof messages["zh-TW"]) => messages[locale][key] ?? key,
    [locale]
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t,
      switchLocale: setLocale
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

