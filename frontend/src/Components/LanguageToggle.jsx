import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import Tooltip from "./Tooltip";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Tooltip content={t("common.languageToggle")}>
      <button
        type="button"
        className="language-toggle"
        onClick={toggleLanguage}
        aria-label={t("common.languageToggle")}
      >
        <Languages className="language-toggle-icon" />
        <span>{language === "en" ? t("common.arabic") : t("common.english")}</span>
      </button>
    </Tooltip>
  );
}
