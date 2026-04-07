import React, { useMemo, useState } from "react";
import { CheckCircle, FileText, HelpCircle, Mail, MessageCircle, Shield } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

const SUPPORT_COPY = {
  en: {
    help: {
      eyebrow: "Support",
      title: "Help Center",
      intro: "Find quick guidance for using Sillah’s family health tools, appointments, and account settings.",
      faqTitle: "Quick Answers",
      cards: [
        ["Getting started", "Create your profile, add family members, and review your risk dashboard."],
        ["Appointments", "Book, track, and update appointment details with your connected care team."],
        ["Privacy", "Learn how Sillah protects your health information and account access."],
      ],
      faqs: [
        ["How do I switch languages?", "Use the English/Arabic toggle in the top navigation. The app will remember your choice."],
        ["How do I add family health records?", "Open Family Tree, select Add Family Member, and enter the relationship and health details you know."],
        ["Why do I need to type DELETE before deleting my account?", "That confirmation prevents accidental permanent removal of your account and health data."],
        ["How do I reach support?", "Use the Contact Us page from the footer and submit the support form."],
      ],
    },
    privacy: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      intro: "Sillah is designed around patient privacy, limited access, and transparent handling of family health data.",
      sections: [
        ["Information we collect", "We store account details, family health records, appointments, medications, alerts, and care-team connections needed to provide the service."],
        ["How we use information", "Your information is used to show health dashboards, coordinate appointments, support risk awareness, and keep your profile accurate."],
        ["Access and control", "Patients can manage their account data and request deletion from the dashboard. Providers should only access patient records needed for care."],
        ["Security", "Sensitive operations happen through protected server routes and authenticated sessions. Admin secrets are never stored in frontend code."],
      ],
    },
    terms: {
      eyebrow: "Legal",
      title: "Terms of Service",
      intro: "These terms explain the responsible use of Sillah as a family health management system.",
      sections: [
        ["Use of Sillah", "Use Sillah to organize family health information, appointments, medications, and awareness resources."],
        ["Health guidance", "Sillah supports awareness and organization. It does not replace professional medical diagnosis, emergency care, or direct provider advice."],
        ["User responsibilities", "Keep your login secure, enter information honestly, and only access records you are authorized to view."],
        ["Account deletion", "Deleting your account permanently removes linked account data where supported by the application and database rules."],
      ],
    },
    contact: {
      eyebrow: "Support",
      title: "Contact Us",
      intro: "Send the Sillah team a message. We’ll use this form to collect the details needed to help you.",
      name: "Your name",
      email: "Email address",
      message: "How can we help?",
      submit: "Send message",
      success: "Thanks. Your message is ready for the Sillah support team.",
      required: "Please complete all fields before sending.",
      emailInvalid: "Enter a valid email address.",
    },
  },
  ar: {
    help: {
      eyebrow: "الدعم",
      title: "مركز المساعدة",
      intro: "اعثر على إرشادات سريعة لاستخدام أدوات صحة العائلة والمواعيد وإعدادات الحساب في صلة.",
      faqTitle: "إجابات سريعة",
      cards: [
        ["البدء", "أنشئ ملفك، وأضف أفراد العائلة، وراجع لوحة المخاطر."],
        ["المواعيد", "احجز المواعيد وتابع تفاصيلها مع فريق الرعاية المرتبط بك."],
        ["الخصوصية", "تعرّف على طريقة حماية معلوماتك الصحية والوصول إلى حسابك."],
      ],
      faqs: [
        ["كيف أغيّر اللغة؟", "استخدم زر التبديل بين English والعربية في أعلى الصفحة. سيتذكر التطبيق اختيارك."],
        ["كيف أضيف سجلات صحة العائلة؟", "افتح شجرة العائلة، ثم اختر إضافة فرد عائلة وأدخل صلة القرابة والتفاصيل الصحية المتوفرة."],
        ["لماذا أكتب DELETE قبل حذف الحساب؟", "هذا التأكيد يمنع الحذف النهائي غير المقصود لحسابك وبياناتك الصحية."],
        ["كيف أتواصل مع الدعم؟", "استخدم صفحة تواصل معنا من التذييل وأرسل نموذج الدعم."],
      ],
    },
    privacy: {
      eyebrow: "قانوني",
      title: "سياسة الخصوصية",
      intro: "تم تصميم صلة حول خصوصية المريض، والوصول المحدود، والتعامل الواضح مع بيانات صحة العائلة.",
      sections: [
        ["المعلومات التي نجمعها", "نخزن تفاصيل الحساب وسجلات صحة العائلة والمواعيد والأدوية والتنبيهات وروابط فريق الرعاية اللازمة لتقديم الخدمة."],
        ["كيف نستخدم المعلومات", "تُستخدم معلوماتك لعرض لوحات الصحة، وتنسيق المواعيد، ودعم الوعي بالمخاطر، والحفاظ على دقة ملفك."],
        ["الوصول والتحكم", "يمكن للمرضى إدارة بيانات الحساب وطلب الحذف من لوحة التحكم. يجب على مقدمي الرعاية الوصول فقط إلى السجلات اللازمة للرعاية."],
        ["الأمان", "تتم العمليات الحساسة عبر مسارات خادم محمية وجلسات موثقة. لا يتم تخزين أسرار الإدارة في كود الواجهة."],
      ],
    },
    terms: {
      eyebrow: "قانوني",
      title: "شروط الخدمة",
      intro: "توضح هذه الشروط الاستخدام المسؤول لتطبيق صلة كنظام لإدارة صحة العائلة.",
      sections: [
        ["استخدام صلة", "استخدم صلة لتنظيم معلومات صحة العائلة والمواعيد والأدوية وموارد التوعية."],
        ["الإرشاد الصحي", "يدعم صلة الوعي والتنظيم، ولا يستبدل التشخيص الطبي المتخصص أو الرعاية الطارئة أو نصيحة مقدم الرعاية المباشرة."],
        ["مسؤوليات المستخدم", "حافظ على أمان تسجيل الدخول، وأدخل المعلومات بصدق، ولا تصل إلا إلى السجلات المصرح لك بعرضها."],
        ["حذف الحساب", "يؤدي حذف حسابك إلى إزالة البيانات المرتبطة به نهائياً عندما تدعم قواعد التطبيق وقاعدة البيانات ذلك."],
      ],
    },
    contact: {
      eyebrow: "الدعم",
      title: "تواصل معنا",
      intro: "أرسل رسالة إلى فريق صلة. سنستخدم هذا النموذج لجمع التفاصيل اللازمة لمساعدتك.",
      name: "اسمك",
      email: "البريد الإلكتروني",
      message: "كيف يمكننا مساعدتك؟",
      submit: "إرسال الرسالة",
      success: "شكراً لك. رسالتك جاهزة لفريق دعم صلة.",
      required: "يرجى إكمال جميع الحقول قبل الإرسال.",
      emailInvalid: "أدخل بريداً إلكترونياً صحيحاً.",
    },
  },
};

function useSupportCopy(key) {
  const { language } = useLanguage();
  return SUPPORT_COPY[language]?.[key] ?? SUPPORT_COPY.en[key];
}

function SupportHero({ icon: Icon, copy }) {
  return (
    <section className="support-hero">
      <div className="support-hero-icon">
        <Icon />
      </div>
      <div>
        <p className="support-eyebrow">{copy.eyebrow}</p>
        <h1 className="support-title">{copy.title}</h1>
        <p className="support-intro">{copy.intro}</p>
      </div>
    </section>
  );
}

function SupportSections({ sections }) {
  return (
    <div className="support-section-grid">
      {sections.map(([title, body]) => (
        <article className="support-card" key={title}>
          <CheckCircle className="support-card-icon" />
          <h2>{title}</h2>
          <p>{body}</p>
        </article>
      ))}
    </div>
  );
}

export function HelpCenterPage() {
  const copy = useSupportCopy("help");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="support-page">
      <SupportHero icon={HelpCircle} copy={copy} />
      <SupportSections sections={copy.cards} />

      <section className="support-panel">
        <p className="support-eyebrow">FAQ</p>
        <h2>{copy.faqTitle}</h2>
        <div className="support-faq-list">
          {copy.faqs.map(([question, answer], index) => (
            <button
              type="button"
              className={`support-faq ${openFaq === index ? "support-faq--open" : ""}`}
              key={question}
              onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
            >
              <span>{question}</span>
              {openFaq === index && <small>{answer}</small>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PrivacyPolicyPage() {
  const copy = useSupportCopy("privacy");
  return (
    <div className="support-page">
      <SupportHero icon={Shield} copy={copy} />
      <SupportSections sections={copy.sections} />
    </div>
  );
}

export function TermsOfServicePage() {
  const copy = useSupportCopy("terms");
  return (
    <div className="support-page">
      <SupportHero icon={FileText} copy={copy} />
      <SupportSections sections={copy.sections} />
    </div>
  );
}

export function ContactUsPage() {
  const copy = useSupportCopy("contact");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Sillah support request from ${form.name || "user"}`);
    const body = encodeURIComponent(`${form.message}\n\nReply to: ${form.email}`);
    return `mailto:inquiry@shoug-tech.com?subject=${subject}&body=${body}`;
  }, [form]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(false);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError(copy.required);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(copy.emailInvalid);
      return;
    }

    setError("");
    setSent(true);
    window.location.href = mailtoHref;
  };

  return (
    <div className="support-page">
      <SupportHero icon={MessageCircle} copy={copy} />
      <section className="support-panel support-contact-panel">
        <div className="support-contact-note">
          <Mail />
          <div>
            <h2>{copy.title}</h2>
            <p>{copy.intro}</p>
          </div>
        </div>

        <form className="support-contact-form" onSubmit={handleSubmit} noValidate>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder={copy.name}
          />
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder={copy.email}
            type="email"
          />
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder={copy.message}
            rows={6}
          />
          {error && <p className="support-form-error">{error}</p>}
          {sent && <p className="support-form-success">{copy.success}</p>}
          <button type="submit" className="support-submit-btn">{copy.submit}</button>
        </form>
      </section>
    </div>
  );
}
