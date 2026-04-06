"use client"

import { useLang } from "@/lib/lang"

const niches = {
  ru: [
    { rank: 1, medal: "🥇", priority: "high", title: "Рекрутинговые агентства", tag: "ПРИОРИТЕТ #1", dealSize: "25k–80k CZK + 5k/мес", speed: "1–2 недели", roi: "×5 вакансий на 1 рекрутера", automates: ["CV-скрининг через AI", "Расписание интервью", "Onboarding documents", "Follow-up кандидатов", "Bulk email по базе"], why: "80% работы рекрутера — повторяющиеся действия. ROI прозрачный.", market: "Тысячи агентств, особенно с иностранной рабочей силой (UA/SK/PL)", competition: "Низкая — нет готовых Czech AI-решений", status: "build" },
    { rank: 2, medal: "🥇", priority: "high", title: "Агентства недвижимости", tag: "ПРИОРИТЕТ #2", dealSize: "30k–100k CZK + 5k–8k/мес", speed: "2–3 недели", roi: "1 агент ведёт 20+ клиентов", automates: ["Лид-роутинг от входящих", "Follow-up последовательности", "Расписание показов + напоминания", "Генерация договоров", "Sync с sreality.cz / bezrealitky.cz"], why: "Агенты тратят 60% времени на admin. Теряют лиды каждый день.", market: "2,000+ агентств, концентрация в Праге", competition: "CoMakers есть, но без AI-специализации", status: "build" },
    { rank: 3, medal: "🥈", priority: "medium", title: "Бухгалтерские и налоговые фирмы", tag: "", dealSize: "20k–60k CZK + 3k–5k/мес", speed: "3–4 недели", roi: "Выживание в пиковые периоды (март-апрель)", automates: ["OCR счетов", "Напоминания клиентам о документах", "Сбор документов", "Генерация отчётов", "Интеграция с Pohoda/ABRA/Money S3"], why: "Сезонные пики убивают команды. Консервативные, но платят регулярно.", market: "Тысячи малых бухгалтерских фирм по всей ЧР", competition: "Legacy software (Pohoda, ABRA), но нет AI-агентов", status: "build" },
    { rank: 4, medal: "🥈", priority: "medium", title: "Маркетинговые агентства", tag: "МЕТА-КЛИЕНТ", dealSize: "20k–70k CZK + 4k–8k/мес", speed: "1–2 недели", roi: "1 клиент = потенциал для 10 их клиентов", automates: ["Автоматическая отчётность клиентам", "Scheduling контента", "Lead routing", "Client communication", "Performance reporting"], why: "Мета-стратегия: понимают ценность автоматизации и могут стать источником рефералов.", market: "Сотни агентств в Праге и Брно", competition: "Знают Zapier/Make, но не строят custom AI", status: "build" },
    { rank: 5, medal: "🥈", priority: "medium", title: "E-commerce бизнесы", tag: "", dealSize: "15k–50k CZK + 3k–6k/мес", speed: "1–2 недели", roi: "+1% конверсии = измеримые деньги", automates: ["Customer service FAQ бот", "Обработка возвратов", "Abandoned cart recovery", "Review collection", "Inventory alerts"], why: "ROI легко считать. Тысячи бизнесов в экосистеме Heureka.cz / Zboží.cz.", market: "Тысячи e-commerce бизнесов в ЧР", competition: "Много generic SaaS, но нет Czech custom AI-агентов", status: "build" },
    { rank: 6, medal: "🥉", priority: "low", title: "Юридические фирмы", tag: "ВЫСОКИЙ ЧЕК, ДОЛГИЙ ЦИКЛ", dealSize: "30k–100k CZK + 5k–10k/мес", speed: "4–8 недель", roi: "Максимальный чек", automates: ["Генерация договоров по шаблонам", "Client intake", "Deadline tracking", "Billing automation"], why: "Высокие требования к безопасности (GDPR++), медленные решения. Нужны референсы.", market: "Стабильный рынок, высокая маржа", competition: "Нет Czech AI-решений, но сложный вход", status: "later" },
    { rank: 7, medal: "🥉", priority: "low", title: "Частные клиники / Медицина", tag: "ЕСТЬ TEREZA", dealSize: "15k–40k CZK + 2k–4k/мес", speed: "3–4 недели", roi: "AI Reception уже адаптируем", automates: ["Онлайн-запись", "Напоминания пациентам", "Patient follow-up", "Документация"], why: "У Ailnex уже есть AI Reception — Telegram бот для записи. Можно адаптировать. GDPR чувствительность.", market: "Тысячи частных клиник по ЧР", competition: "Нет AI-специализированных решений", status: "later" },
    { rank: 8, medal: "", priority: "watch", title: "SaaS и tech стартапы", tag: "", dealSize: "20k–80k CZK", speed: "1 неделя", roi: "Быстрые решения", automates: ["Customer onboarding", "FAQ + тикеты", "Data pipelines", "Usage analytics reporting"], why: "Технические, быстрые решения. Но чешские стартапы часто с ограниченным бюджетом.", market: "Маленький рынок в ЧР", competition: "Понимают инструменты, могут строить сами", status: "watch" },
    { rank: 9, medal: "", priority: "watch", title: "Строительные компании / Девелоперы", tag: "КРУПНЫЕ ПРОЕКТЫ", dealSize: "40k–150k CZK", speed: "6–12 недель", roi: "Самые крупные проекты", automates: ["Project management workflows", "Subcontractor coordination", "Invoicing", "Safety compliance"], why: "После 6–12 месяцев работы, нужны кейсы и enterprise-продажи.", market: "Строительный бум в ЧР", competition: "Нет AI-решений, но долгий вход", status: "watch" },
    { rank: 10, medal: "", priority: "no", title: "Рестораны / HoReCa", tag: "АУТСАЙДЕР", dealSize: "8k–20k CZK", speed: "1 неделя", roi: "Низкий", automates: ["Резервации", "Staff scheduling", "Inventory"], why: "Низкий бюджет + высокий churn + сложный ROI. Не стоит времени.", market: "Большой рынок, но неплатёжеспособный", competition: "Много дешёвых решений", status: "skip" },
  ],
  en: [
    { rank: 1, medal: "🥇", priority: "high", title: "Recruiting Agencies", tag: "PRIORITY #1", dealSize: "25k–80k CZK + 5k/mo", speed: "1–2 weeks", roi: "×5 vacancies per recruiter", automates: ["AI CV screening", "Interview scheduling", "Onboarding documents", "Candidate follow-up", "Bulk email campaigns"], why: "80% of recruiter work is repetitive. Clear ROI.", market: "Thousands of agencies, especially with foreign workforce (UA/SK/PL)", competition: "Low — no ready Czech AI solutions", status: "build" },
    { rank: 2, medal: "🥇", priority: "high", title: "Real Estate Agencies", tag: "PRIORITY #2", dealSize: "30k–100k CZK + 5k–8k/mo", speed: "2–3 weeks", roi: "1 agent handles 20+ clients", automates: ["Inbound lead routing", "Follow-up sequences", "Showing schedule + reminders", "Contract generation", "Sync with sreality.cz / bezrealitky.cz"], why: "Agents spend 60% of time on admin. Losing leads every day.", market: "2,000+ agencies, concentrated in Prague", competition: "CoMakers exists, but without AI specialization", status: "build" },
    { rank: 3, medal: "🥈", priority: "medium", title: "Accounting & Tax Firms", tag: "", dealSize: "20k–60k CZK + 3k–5k/mo", speed: "3–4 weeks", roi: "Survival during peak periods (March-April)", automates: ["Invoice OCR", "Document reminders for clients", "Document collection", "Report generation", "Integration with Pohoda/ABRA/Money S3"], why: "Seasonal peaks kill teams. Conservative, but pay regularly.", market: "Thousands of small accounting firms across Czech Republic", competition: "Legacy software (Pohoda, ABRA), but no AI agents", status: "build" },
    { rank: 4, medal: "🥈", priority: "medium", title: "Marketing Agencies", tag: "META-CLIENT", dealSize: "20k–70k CZK + 4k–8k/mo", speed: "1–2 weeks", roi: "1 client = potential for 10 of their clients", automates: ["Automated client reporting", "Content scheduling", "Lead routing", "Client communication", "Performance reporting"], why: "Meta-strategy: they understand automation value and can become referral sources.", market: "Hundreds of agencies in Prague and Brno", competition: "Know Zapier/Make, but don't build custom AI", status: "build" },
    { rank: 5, medal: "🥈", priority: "medium", title: "E-commerce Businesses", tag: "", dealSize: "15k–50k CZK + 3k–6k/mo", speed: "1–2 weeks", roi: "+1% conversion = measurable money", automates: ["Customer service FAQ bot", "Return processing", "Abandoned cart recovery", "Review collection", "Inventory alerts"], why: "Easy ROI calculation. Thousands of businesses in Heureka.cz / Zboží.cz ecosystem.", market: "Thousands of e-commerce businesses in Czech Republic", competition: "Many generic SaaS, but no Czech custom AI agents", status: "build" },
    { rank: 6, medal: "🥉", priority: "low", title: "Law Firms", tag: "HIGH TICKET, LONG CYCLE", dealSize: "30k–100k CZK + 5k–10k/mo", speed: "4–8 weeks", roi: "Maximum ticket size", automates: ["Contract generation from templates", "Client intake", "Deadline tracking", "Billing automation"], why: "High security requirements (GDPR++), slow decisions. Need references.", market: "Stable market, high margins", competition: "No Czech AI solutions, but complex entry", status: "later" },
    { rank: 7, medal: "🥉", priority: "low", title: "Private Clinics / Healthcare", tag: "HAVE TEREZA", dealSize: "15k–40k CZK + 2k–4k/mo", speed: "3–4 weeks", roi: "AI Reception already adaptable", automates: ["Online booking", "Patient reminders", "Patient follow-up", "Documentation"], why: "Ailnex already has AI Reception — Telegram booking bot. Adaptable. GDPR sensitivity.", market: "Thousands of private clinics across Czech Republic", competition: "No AI-specialized solutions", status: "later" },
    { rank: 8, medal: "", priority: "watch", title: "SaaS & Tech Startups", tag: "", dealSize: "20k–80k CZK", speed: "1 week", roi: "Fast decisions", automates: ["Customer onboarding", "FAQ + tickets", "Data pipelines", "Usage analytics reporting"], why: "Technical, fast decisions. But Czech startups often have limited budgets.", market: "Small market in Czech Republic", competition: "Understand tools, can build themselves", status: "watch" },
    { rank: 9, medal: "", priority: "watch", title: "Construction / Developers", tag: "BIG PROJECTS", dealSize: "40k–150k CZK", speed: "6–12 weeks", roi: "Largest projects", automates: ["Project management workflows", "Subcontractor coordination", "Invoicing", "Safety compliance"], why: "After 6–12 months, need case studies and enterprise sales.", market: "Construction boom in Czech Republic", competition: "No AI solutions, but long entry", status: "watch" },
    { rank: 10, medal: "", priority: "no", title: "Restaurants / HoReCa", tag: "OUTSIDER", dealSize: "8k–20k CZK", speed: "1 week", roi: "Low", automates: ["Reservations", "Staff scheduling", "Inventory"], why: "Low budget + high churn + complex ROI. Not worth the time.", market: "Large market, but low spending power", competition: "Many cheap solutions", status: "skip" },
  ],
}

const priorityMeta: Record<string, { color: string; bg: string; label: { ru: string; en: string } }> = {
  high:   { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: { ru: "Топ приоритет", en: "Top priority" } },
  medium: { color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: { ru: "Средний приоритет", en: "Medium priority" } },
  low:    { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: { ru: "Позже", en: "Later" } },
  watch:  { color: "#525472", bg: "rgba(82,84,114,0.1)",   label: { ru: "Наблюдать", en: "Watch" } },
  no:     { color: "#EF4444", bg: "rgba(239,68,68,0.08)",  label: { ru: "Пропустить", en: "Skip" } },
}

const statusLabels: Record<string, { ru: string; en: string }> = {
  build: { ru: "🔨 Строить сейчас", en: "🔨 Build now" },
  later: { ru: "⏳ После кейсов", en: "⏳ After case studies" },
  watch: { ru: "👀 Наблюдать", en: "👀 Watch" },
  skip:  { ru: "❌ Не идти", en: "❌ Skip" },
}

export default function NichesPage() {
  const { lang } = useLang()
  const list = niches[lang]

  return (
    <div style={{ animation: "fadeIn 0.2s ease", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
          {lang === "ru" ? "Стратегия ниш" : "Niche Strategy"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {lang === "ru"
            ? "10 ниш · приоритизировано по deal size, скорости закрытия и плотности чешского рынка"
            : "10 niches · prioritized by deal size, close speed, and Czech market density"}
        </p>
      </div>

      {/* 90-day focus */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: "3px solid #22C55E", borderRadius: 10, padding: "16px 20px", marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          🎯 {lang === "ru" ? "Фокус первые 90 дней" : "First 90 days focus"}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              {lang === "ru" ? "Первые деньги — сейчас" : "First revenue — now"}
            </div>
            {(lang === "ru"
              ? ["Beauty салоны → AI Reception уже готов", "Рекрутинговые агентства → острая боль", "Маркетинговые агентства → мета-мультипликатор"]
              : ["Beauty salons → AI Reception ready", "Recruiting agencies → acute pain", "Marketing agencies → meta-multiplier"]
            ).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              {lang === "ru" ? "Рост — месяц 2–3" : "Growth — month 2–3"}
            </div>
            {(lang === "ru"
              ? ["Агентства недвижимости", "E-commerce", "RU/UA бизнесы в ЧР"]
              : ["Real estate agencies", "E-commerce", "RU/UA businesses in Czech Republic"]
            ).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#6366F1", fontWeight: 700, flexShrink: 0 }}>{i + 4}.</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 14px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", alignSelf: "flex-start" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              {lang === "ru" ? "Преимущество Ailnex" : "Ailnex advantage"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              ✅ {lang === "ru" ? "Фиксированная цена" : "Fixed price"}<br />
              ✅ 3 {lang === "ru" ? "языка: CZ / EN / RU" : "languages: CZ / EN / RU"}<br />
              ✅ Voice AI + Claude API<br />
              ✅ {lang === "ru" ? "Клиент владеет кодом" : "Client owns the code"}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden niche */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.4)", borderLeft: "3px solid #F59E0B", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          💡 {lang === "ru" ? "Скрытая ниша — RU/UA бизнесы в Чехии" : "Hidden niche — RU/UA businesses in Czech Republic"}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          {lang === "ru"
            ? "Тысячи украинских и русскоязычных предпринимателей в ЧР. Западные агентства не работают на их языке. Ailnex говорит на их языке → кратное доверие. Каналы: Facebook-группы украинцев в ЧР, LinkedIn, профессиональные сети."
            : "Thousands of Ukrainian and Russian-speaking entrepreneurs in Czech Republic. Western agencies don't speak their language. Ailnex speaks their language → multiplied trust. Channels: Facebook groups of Ukrainians in Czech Republic, LinkedIn, professional networks."}
        </p>
      </div>

      {/* Niche cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map(niche => {
          const meta = priorityMeta[niche.priority]
          return (
            <div key={niche.rank} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{niche.medal || `#${niche.rank}`}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{niche.title}</span>
                      {niche.tag && (
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30`, fontWeight: 600 }}>
                          {niche.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{meta.label[lang]}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: "#22C55E", fontWeight: 600, border: "1px solid rgba(34,197,94,0.2)" }}>
                    💰 {niche.dealSize}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    ⚡ {niche.speed}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    {statusLabels[niche.status][lang]}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    {lang === "ru" ? "Что автоматизируем" : "What we automate"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {niche.automates.map((item, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ color: meta.color, flexShrink: 0 }}>→</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      {lang === "ru" ? "Почему" : "Why"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{niche.why}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      {lang === "ru" ? "Рынок ЧР" : "Czech Market"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{niche.market}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      {lang === "ru" ? "Конкуренция" : "Competition"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{niche.competition}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
