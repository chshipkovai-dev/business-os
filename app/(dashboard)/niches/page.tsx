"use client"

const niches = [
  {
    rank: 1,
    medal: "🥇",
    priority: "high",
    title: "Рекрутинговые агентства",
    tag: "ПРИОРИТЕТ #1",
    dealSize: "25k–80k CZK + 5k/мес",
    speed: "1–2 недели",
    roi: "×5 вакансий на 1 рекрутера",
    automates: ["CV-скрининг через AI", "Расписание интервью", "Onboarding documents", "Follow-up кандидатов", "Bulk email по базе"],
    why: "80% работы рекрутера — повторяющиеся действия. ROI прозрачный.",
    market: "Тысячи агентств, особенно с иностранной рабочей силой (UA/SK/PL)",
    competition: "Низкая — нет готовых Czech AI-решений",
    status: "build",
  },
  {
    rank: 2,
    medal: "🥇",
    priority: "high",
    title: "Агентства недвижимости",
    tag: "ПРИОРИТЕТ #2",
    dealSize: "30k–100k CZK + 5k–8k/мес",
    speed: "2–3 недели",
    roi: "1 агент ведёт 20+ клиентов",
    automates: ["Лид-роутинг от входящих", "Follow-up последовательности", "Расписание показов + напоминания", "Генерация договоров", "Sync с sreality.cz / bezrealitky.cz"],
    why: "Агенты тратят 60% времени на admin. Теряют лиды каждый день.",
    market: "2,000+ агентств, концентрация в Праге",
    competition: "CoMakers есть, но без AI-специализации",
    status: "build",
  },
  {
    rank: 3,
    medal: "🥈",
    priority: "medium",
    title: "Бухгалтерские и налоговые фирмы",
    tag: "",
    dealSize: "20k–60k CZK + 3k–5k/мес",
    speed: "3–4 недели",
    roi: "Выживание в пиковые периоды (март-апрель)",
    automates: ["OCR счетов", "Напоминания клиентам о документах", "Сбор документов", "Генерация отчётов", "Интеграция с Pohoda/ABRA/Money S3"],
    why: "Сезонные пики убивают команды. Консервативные, но платят регулярно.",
    market: "Тысячи малых бухгалтерских фирм по всей ЧР",
    competition: "Legacy software (Pohoda, ABRA), но нет AI-агентов",
    status: "build",
  },
  {
    rank: 4,
    medal: "🥈",
    priority: "medium",
    title: "Маркетинговые агентства",
    tag: "МЕТА-КЛИЕНТ",
    dealSize: "20k–70k CZK + 4k–8k/мес",
    speed: "1–2 недели",
    roi: "1 клиент = потенциал для 10 их клиентов",
    automates: ["Автоматическая отчётность клиентам", "Scheduling контента", "Lead routing", "Client communication", "Performance reporting"],
    why: "Мета-стратегия: понимают ценность автоматизации и могут стать источником рефералов.",
    market: "Сотни агентств в Праге и Брно",
    competition: "Знают Zapier/Make, но не строят custom AI",
    status: "build",
  },
  {
    rank: 5,
    medal: "🥈",
    priority: "medium",
    title: "E-commerce бизнесы",
    tag: "",
    dealSize: "15k–50k CZK + 3k–6k/мес",
    speed: "1–2 недели",
    roi: "+1% конверсии = измеримые деньги",
    automates: ["Customer service FAQ бот", "Обработка возвратов", "Abandoned cart recovery", "Review collection", "Inventory alerts"],
    why: "ROI легко считать. Тысячи бизнесов в экосистеме Heureka.cz / Zboží.cz.",
    market: "Тысячи e-commerce бизнесов в ЧР",
    competition: "Много generic SaaS, но нет Czech custom AI-агентов",
    status: "build",
  },
  {
    rank: 6,
    medal: "🥉",
    priority: "low",
    title: "Юридические фирмы",
    tag: "ВЫСОКИЙ ЧЕК, ДОЛГИЙ ЦИКЛ",
    dealSize: "30k–100k CZK + 5k–10k/мес",
    speed: "4–8 недель",
    roi: "Максимальный чек",
    automates: ["Генерация договоров по шаблонам", "Client intake", "Deadline tracking", "Billing automation"],
    why: "Высокие требования к безопасности (GDPR++), медленные решения. Нужны референсы.",
    market: "Стабильный рынок, высокая маржа",
    competition: "Нет Czech AI-решений, но сложный вход",
    status: "later",
  },
  {
    rank: 7,
    medal: "🥉",
    priority: "low",
    title: "Частные клиники / Медицина",
    tag: "ЕСТЬ TEREZA",
    dealSize: "15k–40k CZK + 2k–4k/мес",
    speed: "3–4 недели",
    roi: "Tereza уже адаптируема",
    automates: ["Онлайн-запись", "Напоминания пациентам", "Patient follow-up", "Документация"],
    why: "У Ailnex уже есть Tereza — бот для записи. Можно адаптировать. GDPR чувствительность.",
    market: "Тысячи частных клиник по ЧР",
    competition: "Нет AI-специализированных решений",
    status: "later",
  },
  {
    rank: 8,
    medal: "",
    priority: "watch",
    title: "SaaS и tech стартапы",
    tag: "",
    dealSize: "20k–80k CZK",
    speed: "1 неделя",
    roi: "Быстрые решения",
    automates: ["Customer onboarding", "FAQ + тикеты", "Data pipelines", "Usage analytics reporting"],
    why: "Технические, быстрые решения. Но чешские стартапы часто с ограниченным бюджетом.",
    market: "Маленький рынок в ЧР",
    competition: "Понимают инструменты, могут строить сами",
    status: "watch",
  },
  {
    rank: 9,
    medal: "",
    priority: "watch",
    title: "Строительные компании / Девелоперы",
    tag: "КРУПНЫЕ ПРОЕКТЫ",
    dealSize: "40k–150k CZK",
    speed: "6–12 недель",
    roi: "Самые крупные проекты",
    automates: ["Project management workflows", "Subcontractor coordination", "Invoicing", "Safety compliance"],
    why: "После 6–12 месяцев работы, нужны кейсы и enterprise-продажи.",
    market: "Строительный бум в ЧР",
    competition: "Нет AI-решений, но долгий вход",
    status: "watch",
  },
  {
    rank: 10,
    medal: "",
    priority: "no",
    title: "Рестораны / HoReCa",
    tag: "АУТСАЙДЕР",
    dealSize: "8k–20k CZK",
    speed: "1 неделя",
    roi: "Низкий",
    automates: ["Резервации", "Staff scheduling", "Inventory"],
    why: "Низкий бюджет + высокий churn + сложный ROI. Не стоит времени.",
    market: "Большой рынок, но неплатёжеспособный",
    competition: "Много дешёвых решений",
    status: "skip",
  },
]

const priorityMeta: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Топ приоритет" },
  medium: { color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: "Средний приоритет" },
  low:    { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Позже" },
  watch:  { color: "#525472", bg: "rgba(82,84,114,0.1)",   label: "Наблюдать" },
  no:     { color: "#EF4444", bg: "rgba(239,68,68,0.08)",  label: "Пропустить" },
}

const statusLabel: Record<string, string> = {
  build: "🔨 Строить сейчас",
  later: "⏳ После кейсов",
  watch: "👀 Наблюдать",
  skip:  "❌ Не идти",
}

export default function NichesPage() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
          Стратегия ниш
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          10 ниш · приоритизировано по deal size, скорости закрытия и плотности чешского рынка
        </p>
      </div>

      {/* 90-day focus */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: "3px solid #22C55E", borderRadius: 10, padding: "16px 20px", marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          🎯 Фокус первые 90 дней
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Первые деньги — сейчас</div>
            {["Beauty салоны → Tereza уже готова", "Рекрутинговые агентства → острая боль", "Маркетинговые агентства → мета-мультипликатор"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Рост — месяц 2–3</div>
            {["Агентства недвижимости", "E-commerce", "RU/UA бизнесы в ЧР"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#6366F1", fontWeight: 700, flexShrink: 0 }}>{i + 4}.</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 14px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", alignSelf: "flex-start" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Преимущество Ailnex</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              ✅ Публичные цены<br />
              ✅ Живое демо<br />
              ✅ CZ / EN / RU
            </div>
          </div>
        </div>
      </div>

      {/* Hidden niche */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.4)", borderLeft: "3px solid #F59E0B", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          💡 Скрытая ниша — RU/UA бизнесы в Чехии
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Тысячи украинских и русскоязычных предпринимателей в ЧР. Западные агентства не работают на их языке. Ailnex говорит на их языке → кратное доверие. Каналы: Facebook-группы украинцев в ЧР, LinkedIn, профессиональные сети.
        </p>
      </div>

      {/* Niche cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {niches.map(niche => {
          const meta = priorityMeta[niche.priority]
          return (
            <div key={niche.rank} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: 10,
              padding: "16px 20px",
            }}>
              {/* Top row */}
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
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{meta.label}</div>
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
                    {statusLabel[niche.status]}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Что автоматизируем</div>
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Почему</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{niche.why}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Рынок ЧР</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{niche.market}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Конкуренция</div>
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
