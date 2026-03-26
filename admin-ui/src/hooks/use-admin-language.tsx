import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getLanguages, type Language } from "@/api/client";

interface AdminLanguageContextType {
  languages: Language[];
  currentCode: string;
  currentLanguage: Language | undefined;
  setCurrentCode: (code: string) => void;
}

const AdminLanguageContext = createContext<AdminLanguageContextType>({
  languages: [],
  currentCode: "all",
  currentLanguage: undefined,
  setCurrentCode: () => {},
});

const STORAGE_KEY = "vibecms_admin_lang";

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentCode, setCurrentCodeState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "all";
  });

  useEffect(() => {
    getLanguages(true).then((langs) => {
      setLanguages(langs);
      // If stored code no longer exists, reset to default language or "all"
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== "all" && !langs.some((l) => l.code === stored)) {
        const def = langs.find((l) => l.is_default);
        const fallback = def?.code || "all";
        setCurrentCodeState(fallback);
        localStorage.setItem(STORAGE_KEY, fallback);
      }
    }).catch(() => {});
  }, []);

  function setCurrentCode(code: string) {
    setCurrentCodeState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }

  const currentLanguage = languages.find((l) => l.code === currentCode);

  return (
    <AdminLanguageContext.Provider value={{ languages, currentCode, currentLanguage, setCurrentCode }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  return useContext(AdminLanguageContext);
}
