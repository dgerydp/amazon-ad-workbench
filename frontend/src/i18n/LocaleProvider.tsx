import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { PropsWithChildren } from "react";

import { messages, type Locale } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "amazon-ad-workbench-locale";

const LocaleContext = createContext<LocaleContextValue | null>(null);

function replaceVars(template: string, vars?: Record<string, string | number>) {
  if (!vars) {
    return template;
  }
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template,
  );
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") {
      return saved;
    }
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => {
        const template = messages[locale][key] ?? messages.en[key] ?? key;
        return replaceVars(template, vars);
      },
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used within LocaleProvider.");
  }
  return value;
}
