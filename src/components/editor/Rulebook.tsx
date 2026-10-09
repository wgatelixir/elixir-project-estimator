import { t } from "@/lib/i18n";
import type { Locale, LocalizedString } from "@/lib/types";

// The "ESTIMATION RULEBOOK" tab of the V3 workbook, reworded where a rule
// described spreadsheet mechanics (copying the file, deleting tabs) into the
// app's equivalent. Rule 4 (duplicating whole tabs) has no app equivalent and is
// left out; the tabs' shared header note about adding "Part II" lines is folded
// into rule 6.
const RULES: LocalizedString[] = [
  {
    en: "The standard template is never edited. Every estimation is its own copy; use Duplicate on the dashboard to branch off a variant.",
    nl: "Het standaardtemplate wordt nooit aangepast. Elke estimation is een eigen kopie; gebruik Duplicate op het dashboard om een variant af te splitsen.",
  },
  {
    en: "Every tab is a workstream and every line is the effort for a session, session prep or setup. Uncheck what isn't needed.",
    nl: "Elk tabblad is een workstream en elke regel is de inspanning voor een sessie, sessievoorbereiding of setup. Vink uit wat niet nodig is.",
  },
  {
    en: "Need extra lines or sessions? Add a new line, filled in the same way as the existing ones.",
    nl: "Extra regels of sessies nodig? Voeg een nieuwe regel toe, ingevuld op dezelfde manier als de bestaande regels.",
  },
  {
    en: "Standard Effort is the agreed effort for a normal, mid-sized project, including preparing, holding and processing the session.",
    nl: "Standard Effort is de afgesproken inspanning voor een normaal, middelgroot project, inclusief voorbereiden, houden en uitwerken van de sessie.",
  },
  {
    en: 'Don\'t change Standard Effort; use the Complexity factor to lower or raise it. Need more sessions? Don\'t raise the complexity, add a new line instead (e.g. "Data/IT Interview Part II").',
    nl: 'Pas Standard Effort niet aan; gebruik de complexiteitsfactor om de inspanning te verlagen of te verhogen. Meer sessies nodig? Verhoog dan niet de complexiteit, maar voeg een nieuwe regel toe (bijv. "Data/IT Interview Part II").',
  },
  {
    en: "Integrations: don't use the old Sales Cheatsheet. Use the ElixirSync or Third Party Integration tab, and involve tech people where needed.",
    nl: "Integraties: gebruik niet meer de oude Sales Cheatsheet. Gebruik het ElixirSync- of Third Party Integration-tabblad en betrek waar nodig technische collega's.",
  },
  {
    en: "Always briefly check the totals. The calculations should work, but every change carries a risk.",
    nl: "Controleer altijd kort de totalen. De berekeningen zouden moeten kloppen, maar elke wijziging brengt een risico met zich mee.",
  },
  {
    en: "Always check the hourly rate: it differs considerably between countries, projects and customers.",
    nl: "Controleer altijd het uurtarief: dat verschilt sterk per land, project en klant.",
  },
  {
    en: "Always check the subscription cost when an integration is part of the offer.",
    nl: "Controleer altijd de abonnementskosten als er een integratie in het aanbod zit.",
  },
  {
    en: "In the end the estimation contains only what the client's scope truly asks for. Leave everything else unchecked.",
    nl: "Uiteindelijk bevat de estimation alleen wat de scope van de klant echt vraagt. Laat al het andere uitgevinkt.",
  },
  {
    en: "Four-eyes principle: have every estimation counter-checked by a senior or an expert in the estimated areas.",
    nl: "Vier-ogenprincipe: laat elke estimation controleren door een senior of een expert in de geschatte onderdelen.",
  },
  {
    en: "Feedback on the estimation template: comment on the Elixir Operational Project Task, or send it to David directly.",
    nl: "Feedback op het estimation-template: plaats een comment in de Elixir Operational Project Task, of stuur het direct naar David.",
  },
];

const TITLE: LocalizedString = { en: "Estimation rulebook", nl: "Estimation-rulebook" };
const INTRO: LocalizedString = {
  en: "Follow these rules to use the estimation template the right way.",
  nl: "Volg deze regels om het estimation-template op de juiste manier te gebruiken.",
};

export function Rulebook({ locale }: { locale: Locale }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <span>
          <span className="text-sm font-semibold text-brand-ink">{t(TITLE, locale)}</span>
          <span className="ml-2 text-xs text-slate-500">{t(INTRO, locale)}</span>
        </span>
        <span className="text-xs text-slate-400 group-open:rotate-90">&#9656;</span>
      </summary>
      <ol className="list-decimal space-y-1.5 border-t border-slate-100 py-3 pl-9 pr-4 text-sm text-slate-600">
        {RULES.map((rule) => (
          <li key={rule.en}>{t(rule, locale)}</li>
        ))}
      </ol>
    </details>
  );
}
