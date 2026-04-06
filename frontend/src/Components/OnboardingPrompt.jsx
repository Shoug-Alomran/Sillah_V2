import React, { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function OnboardingPrompt({
  storageKey,
  title,
  body,
  actionLabel,
  onAction,
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === "dismissed";
    setVisible(!dismissed);
  }, [storageKey]);

  if (!visible) return null;

  return (
    <div className="onboarding-prompt" role="status" aria-live="polite">
      <div className="onboarding-prompt__content">
        <div className="onboarding-prompt__badge">
          <Sparkles className="onboarding-prompt__icon" />
        </div>
        <div>
          <h2 className="onboarding-prompt__title">{title}</h2>
          <p className="onboarding-prompt__body">{body}</p>
        </div>
      </div>

      <div className="onboarding-prompt__actions">
        {actionLabel && onAction && (
          <button type="button" className="onboarding-prompt__action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          className="onboarding-prompt__dismiss"
          onClick={() => {
            localStorage.setItem(storageKey, "dismissed");
            setVisible(false);
          }}
          aria-label={t("common.dismiss")}
        >
          <X className="onboarding-prompt__dismiss-icon" />
        </button>
      </div>
    </div>
  );
}
