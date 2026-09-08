import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  FileChartColumnIncreasing,
  FileText,
  Gauge,
  Home as HomeIcon,
  Info,
  Landmark,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  Sparkles,
  Table2,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { compareFinancing, parseCurrency, simulateFinancing, type AmortizationGoal, type ExtraordinaryPayment, type FinancingInput, type SimulationComparison } from "@shared/finance";

type Screen = "dashboard" | "simulation" | "result" | "table" | "scenarios";
type SimulationStep = 1 | 2;

type SimulationConfig = {
  financingId?: string;
  financing: FinancingInput;
  extraPayments: ExtraordinaryPayment[];
  goal: AmortizationGoal;
};

type User = { id: string; name: string; email: string };

const initialSimulation: SimulationConfig = {
  financing: { principal: 270000, annualRate: 12.5, termMonths: 360, method: "price" },
  extraPayments: [{ month: 10, amount: 20000 }],
  goal: "term",
};


type IconType = typeof LayoutDashboard;

const navItems: Array<{ id: Screen; label: string; icon: IconType; section: string }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard, section: "Principal" },
  { id: "simulation", label: "Nova simulação", icon: Sparkles, section: "Principal" },
  { id: "result", label: "Resultado", icon: FileChartColumnIncreasing, section: "Análise" },
  { id: "table", label: "Tabela de amortização", icon: Table2, section: "Análise" },
  { id: "scenarios", label: "Cenários", icon: Target, section: "Análise" },
];

const defaultFinancing = initialSimulation.financing;
const defaultExtraPayments = initialSimulation.extraPayments;
const defaultProjection = simulateFinancing(defaultFinancing, defaultExtraPayments);
const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const safeCurrency = (value: string) => {
  try {
    return parseCurrency(value);
  } catch {
    return 0;
  }
};
const formatMonth = (month: number) => new Date(2026, 3 + month - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
const formatDate = (month: number) => new Date(2026, 3 + month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
const comparisonFor = (simulation: SimulationConfig) => compareFinancing(simulation.financing, simulation.extraPayments, simulation.goal);
const scheduleRows = defaultProjection.schedule.slice(0, 10).map((row) => ({
  month: formatMonth(row.month),
  number: String(row.month).padStart(2, "0"),
  payment: formatCurrency(row.payment),
  interest: formatCurrency(row.interest),
  principal: formatCurrency(row.principal + row.extraordinary),
  balance: formatCurrency(row.closingBalance),
  tag: row.month === 1 ? "Agora" : row.extraordinary > 0 ? "Extraordinária" : undefined,
}));


function Logo() {
  return (
    <div className="brand-mark" aria-label="RBR">
      <div className="brand-symbol"><span /> <span /> <span /></div>
      <div>
        <strong>rbr<span>.</span></strong>
        <small>real balance room</small>
      </div>
    </div>
  );
}

function IconButton({ children, label, onClick, className = "" }: { children: React.ReactNode; label: string; onClick?: () => void; className?: string }) {
  return <button aria-label={label} className={`icon-button ${className}`} onClick={onClick}>{children}</button>;
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "accent" }) {
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>;
}

function MetricCard({ label, value, helper, icon, trend, accent = false }: { label: string; value: string; helper: string; icon: React.ReactNode; trend?: string; accent?: boolean }) {
  return (
    <div className={`metric-card ${accent ? "accent-card" : ""}`}>
      <div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div>
      <strong>{value}</strong>
      <div className="metric-helper">{trend && <span className="trend-positive"><ArrowDownRight size={13} />{trend}</span>}<span>{helper}</span></div>
    </div>
  );
}

function DebtChart() {
  return (
    <div className="debt-chart">
      <div className="chart-y-labels"><span>R$ 300k</span><span>R$ 250k</span><span>R$ 200k</span><span>R$ 150k</span><span>R$ 100k</span></div>
      <svg viewBox="0 0 780 255" preserveAspectRatio="none" role="img" aria-label="Evolução projetada do saldo devedor">
        
        {[25, 78, 131, 184, 237].map((y) => <line key={y} x1="0" x2="780" y1={y} y2={y} stroke="#e6e8e3" strokeWidth="1" strokeDasharray="3 5" />)}
        <path d="M0,24 C39,28 47,34 75,39 C112,45 124,49 153,59 C188,70 196,80 222,90 C251,101 264,104 294,116 C326,129 337,132 370,145 C407,160 420,167 455,176 C488,185 503,186 532,199 C566,214 577,217 613,224 C655,231 696,234 780,240 L780,255 L0,255 Z" fill="#e7edf5" />
        <path d="M0,24 C39,28 47,34 75,39 C112,45 124,49 153,59 C188,70 196,80 222,90 C251,101 264,104 294,116 C326,129 337,132 370,145 C407,160 420,167 455,176 C488,185 503,186 532,199 C566,214 577,217 613,224 C655,231 696,234 780,240" fill="none" stroke="#2457a6" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="222" x2="222" y1="0" y2="255" stroke="#9dd5ad" strokeWidth="1" strokeDasharray="4 5" />
        <circle cx="222" cy="90" r="6" fill="#fff" stroke="#2457a6" strokeWidth="3" />
        <circle cx="613" cy="224" r="6" fill="#fff" stroke="#2457a6" strokeWidth="3" />
        <g transform="translate(238 54)"><rect width="112" height="31" rx="8" fill="#18231e" /><text x="12" y="20" fill="#d8f4d9" fontSize="12" fontFamily="DM Sans, sans-serif">Jan/27 · R$ 263k</text></g>
      </svg>
      <div className="chart-x-labels"><span>Hoje</span><span>Jan/27</span><span>Jan/32</span><span>Jan/42</span><span>Jan/52</span></div>
    </div>
  );
}

function AppShell({ screen, setScreen, children, onToast, user, onLogout }: { screen: Screen; setScreen: (screen: Screen) => void; children: React.ReactNode; onToast: (text: string) => void; user: User; onLogout: () => void }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const sections = ["Principal", "Análise"];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="sidebar-top"><Logo /><IconButton label="Fechar menu" className="mobile-close" onClick={() => setMobileMenu(false)}><X size={18} /></IconButton></div>
        <div className="property-switcher"><div className="property-icon"><HomeIcon size={16} /></div><div><span>Financiamento atual</span><strong>Casa Vila Mariana</strong></div><ChevronDown size={15} /></div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {sections.map((section) => <div className="nav-section" key={section}><span className="nav-section-label">{section}</span>{navItems.filter((item) => item.section === section).map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => { setScreen(item.id); setMobileMenu(false); }}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.id === "result" && <span className="nav-badge">novo</span>}</button>; })}</div>)}
          <div className="nav-section nav-section-bottom"><span className="nav-section-label">Workspace</span><button className="nav-item muted" onClick={() => onToast("Histórico estará disponível em uma próxima versão.")}><Clock3 size={17} /><span>Histórico</span></button><button className="nav-item muted" onClick={() => onToast("Configurações estarão disponíveis em uma próxima versão.")}><Settings2 size={17} /><span>Configurações</span></button></div>
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17} /><div><strong>Documentação</strong><span>Notas do produto</span></div><ArrowRight size={15} /></div><button className="user-row" onClick={onLogout}><div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><MoreHorizontal size={18} /></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="topbar-left"><IconButton label="Abrir menu" className="mobile-menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></IconButton><span className="topbar-context">RBR <span>/</span> {screen === "dashboard" ? "Visão geral" : navItems.find((item) => item.id === screen)?.label}</span></div><div className="topbar-actions"><button className="support-button" onClick={() => onToast("Tudo certo por aqui. Este é um protótipo navegável.")}><CircleHelp size={16} />Ajuda</button><button className="topbar-text-button" onClick={() => onToast("Nenhum alerta novo.")}>Alertas</button><div className="top-avatar">RS</div></div></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function Dashboard({ setScreen, onToast }: { setScreen: (screen: Screen) => void; onToast: (text: string) => void }) {
  return <>
    <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />PANORAMA ATUAL</div><h1>Visão geral </h1><p>Saldo, parcela e próximos aportes em um só lugar.</p></div><div className="intro-actions"><StatusPill tone="positive">Atualizado hoje</StatusPill><button className="outline-button" onClick={() => onToast("Link de compartilhamento copiado.")}><Copy size={15} /> Exportar resumo</button></div></section>
    <section className="dashboard-grid metrics-grid"><MetricCard label="Saldo devedor" value="R$ 284.320" helper="de R$ 270.000 financiados" trend="5,3%" icon={<Landmark size={18} />} /><MetricCard label="Parcela mensal" value="R$ 3.100" helper="Price · sem seguros" icon={<ReceiptText size={18} />} /><MetricCard label="Prazo restante" value="342 meses" helper="até março de 2054" trend="18 meses" icon={<CalendarDays size={18} />} accent /></section>
    <section className="dashboard-grid main-dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><span className="section-kicker">PROJEÇÃO DO SALDO</span><h2>Como a dívida evolui</h2></div><button className="select-button">Próximos 30 anos <ChevronDown size={14} /></button></div><div className="chart-summary"><strong>R$ 284.320</strong><span><ArrowDownRight size={13} /> 5,3% desde o início</span></div><DebtChart /><div className="chart-footnote"><span><i className="legend-dot" />Saldo projetado</span><span><i className="legend-dot soft" />Amortização extraordinária em Jan/27</span></div></div><div className="side-stack"><div className="panel next-payment-panel"><div className="panel-heading compact"><div><span className="section-kicker">PRÓXIMO MOVIMENTO</span><h2>Amortização prevista</h2></div><div className="round-arrow"><ArrowUpRight size={17} /></div></div><div className="next-amount">R$ 20.000</div><div className="next-meta"><span><CalendarDays size={14} /> Janeiro de 2027</span><span><RepeatIcon /> Anual</span></div><div className="divider" /><p>Simule agora o impacto desse aporte no seu prazo e nos juros totais.</p><button className="primary-button full" onClick={() => setScreen("result")}>Ver impacto <ArrowRight size={16} /></button></div><div className="insight-card"><div className="insight-icon"><Zap size={17} /></div><div><span className="section-kicker">NOTA</span><p>O próximo aporte pode antecipar o fim do financiamento em <strong>{defaultProjection.payoffMonth < defaultFinancing.termMonths ? `${defaultFinancing.termMonths - defaultProjection.payoffMonth} meses` : "sem redução"}</strong>.</p><button className="text-button" onClick={() => setScreen("result")}>Abrir simulação <ArrowRight size={14} /></button></div></div></div></section>
    <section className="bottom-grid"><div className="panel overview-panel"><div className="panel-heading compact"><div><span className="section-kicker">RESUMO DO CONTRATO</span><h2>Casa Vila Mariana</h2></div><button className="more-button" onClick={() => onToast("Mais opções do contrato estarão disponíveis em breve.")}><MoreHorizontal size={18} /></button></div><div className="contract-grid"><div><span>Valor do imóvel</span><strong>R$ 300.000</strong></div><div><span>Entrada</span><strong>R$ 30.000</strong></div><div><span>Taxa de juros</span><strong>12,5% <small>a.a.</small></strong></div><div><span>Sistema</span><strong>Price</strong></div></div></div><div className="panel progress-panel"><div className="panel-heading compact"><div><span className="section-kicker">JORNADA DO FINANCIAMENTO</span><h2>Você já percorreu 5,3%</h2></div><Gauge size={21} className="muted-icon" /></div><div className="progress-track"><div className="progress-fill" /></div><div className="progress-labels"><span>Início · Abr/26</span><span>Fim · Mar/54</span></div></div></section>
  </>;
}

function RepeatIcon() { return <span className="repeat-icon">↻</span>; }

function Stepper({ step }: { step: SimulationStep }) {
  return <div className="stepper"><div className={`step ${step >= 1 ? "done" : ""} ${step === 1 ? "current" : ""}`}><span>{step > 1 ? <Check size={13} /> : "1"}</span><strong>Financiamento</strong></div><div className={`step-line ${step > 1 ? "filled" : ""}`} /><div className={`step ${step >= 2 ? "done" : ""} ${step === 2 ? "current" : ""}`}><span>2</span><strong>Estratégia</strong></div><div className="step-line" /><div className="step"><span>3</span><strong>Resultado</strong></div></div>;
}

function Field({ label, value, hint, prefix, suffix, onChange }: { label: string; value: string; hint?: string; prefix?: string; suffix?: string; onChange?: (value: string) => void }) {
  return <label className="field"><span>{label}</span><div className="input-wrap">{prefix && <b>{prefix}</b>}<input value={value} onChange={(event) => onChange?.(event.target.value)} />{suffix && <em>{suffix}</em>}</div>{hint && <small>{hint}</small>}</label>;
}

function Simulation({ step, setStep, setScreen, onGenerate }: { step: SimulationStep; setStep: (step: SimulationStep) => void; setScreen: (screen: Screen) => void; onGenerate: (simulation: SimulationConfig) => void | Promise<void> }) {
  const [propertyValue, setPropertyValue] = useState("300.000");
  const [downPayment, setDownPayment] = useState("30.000");
  const [financedValue, setFinancedValue] = useState("270.000");
  const [annualRate, setAnnualRate] = useState("12,5");
  const [termMonths, setTermMonths] = useState("360");
  const [extraValue, setExtraValue] = useState("20.000");
  const [extraMonth, setExtraMonth] = useState("10");
  const [goal, setGoal] = useState<"term" | "payment">("term");
  const [error, setError] = useState<string | null>(null);

  const financing: FinancingInput = {
    principal: safeCurrency(financedValue),
    annualRate: safeCurrency(annualRate),
    termMonths: Number(termMonths),
    method: "price",
  };
  const extraPayments: ExtraordinaryPayment[] = [{ month: Number(extraMonth), amount: safeCurrency(extraValue) }];
  const projection = (() => {
    try {
      return simulateFinancing(financing, extraPayments, goal);
    } catch {
      return null;
    }
  })();

  const continueToStrategy = () => {
    try {
      const property = parseCurrency(propertyValue);
      const down = parseCurrency(downPayment);
      const financed = parseCurrency(financedValue);
      const months = Number(termMonths);
      if (property <= 0 || down < 0 || financed <= 0 || months <= 0) throw new Error("Revise os dados do contrato.");
      if (Math.abs(property - down - financed) > 0.01) throw new Error("Entrada e valor financiado devem fechar o valor do imóvel.");
      setError(null);
      setStep(2);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Revise os dados do contrato.");
    }
  };

  return <section className="simulation-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />NOVA SIMULAÇÃO</div><h1>Nova simulação</h1><p>Informe os dados do contrato e escolha uma estratégia de amortização.</p></div><StatusPill>Dados locais e salvos</StatusPill></section><Stepper step={step} />{step === 1 ? <div className="simulation-layout"><div className="panel form-panel"><div className="form-heading"><div className="form-number">01</div><div><span className="section-kicker">DADOS DO FINANCIAMENTO</span><h2>Vamos começar pelo básico.</h2><p>Use os dados do contrato para criar uma base fiel.</p></div></div><div className="form-grid"><Field label="Valor do imóvel" prefix="R$" value={propertyValue} onChange={setPropertyValue} /><Field label="Entrada" prefix="R$" value={downPayment} hint="A entrada será abatida do valor financiado." onChange={(value) => { setDownPayment(value); setFinancedValue(String(Math.max(0, safeCurrency(propertyValue) - safeCurrency(value)))); }} /><Field label="Valor financiado" prefix="R$" value={financedValue} onChange={setFinancedValue} /><Field label="Taxa de juros" value={annualRate} suffix="% a.a." onChange={setAnnualRate} /><Field label="Sistema de amortização" value="Price" /><Field label="Prazo total" value={termMonths} suffix="meses" onChange={setTermMonths} /></div>{error && <p className="field-error">{error}</p>}<div className="form-footer"><span><Info size={15} /> Os dados ficam nesta sessão até salvar.</span><button className="primary-button" onClick={continueToStrategy}>Continuar <ArrowRight size={16} /></button></div></div><aside className="panel form-aside"><div className="aside-icon"><HomeIcon size={19} /></div><span className="section-kicker">CONTRATO</span><h3>Casa Vila Mariana</h3><p>Uma referência para o contrato que você está planejando.</p><div className="aside-details"><div><span>Financiado</span><strong>{safeCurrency(propertyValue) > 0 ? `${Math.round(safeCurrency(financedValue) / safeCurrency(propertyValue) * 100)}%` : "—"}</strong></div><div><span>Parcela estimada</span><strong>{projection ? formatCurrency(projection.scheduledPayment) : "—"}</strong></div></div><div className="aside-quote"><span>“</span><p>Dados do contrato. Decisões melhores.</p></div></aside></div> : <div className="simulation-layout"><div className="panel form-panel"><div className="form-heading"><div className="form-number green">02</div><div><span className="section-kicker">ESTRATÉGIA DE AMORTIZAÇÃO</span><h2>Defina a estratégia</h2><p>Escolha o aporte e o objetivo da amortização.</p></div></div><div className="strategy-options"><button className="strategy-option selected"><div className="strategy-radio"><Check size={13} /></div><div><strong>Amortização extraordinária</strong><span>Aplicar um aporte na parcela escolhida.</span></div><span className="option-tag">Disponível</span></button></div><div className="form-grid strategy-grid"><Field label="Valor do aporte" prefix="R$" value={extraValue} onChange={setExtraValue} /><Field label="Parcela do aporte" value={extraMonth} suffix="mês" onChange={setExtraMonth} /><Field label="Frequência" value="Único" /><Field label="Sistema" value="Price" /></div><div className="objective-block"><span className="field-label">Objetivo da amortização</span><div className="segmented"><button className={goal === "term" ? "selected" : ""} onClick={() => setGoal("term")}><TrendingDown size={16} />Reduzir prazo</button><button className={goal === "payment" ? "selected" : ""} onClick={() => setGoal("payment")}><ReceiptText size={16} />Reduzir parcela</button></div></div><div className="form-footer"><button className="back-button" onClick={() => setStep(1)}><ArrowLeft size={16} /> Voltar</button><button className="primary-button" onClick={() => { if (!projection) { setError("Revise os dados da amortização."); return; } void onGenerate({ financing, extraPayments, goal }); }}>Salvar e gerar simulação <Sparkles size={16} /></button></div></div><aside className="panel form-aside strategy-aside"><div className="strategy-preview"><span>IMPACTO PREVISTO</span><strong>{projection ? `- ${Math.max(0, financing.termMonths - projection.payoffMonth)} meses` : "—"}</strong><small>no prazo total</small></div><div className="mini-bars"><div><span>Sem aporte</span><i style={{ width: "92%" }} /></div><div><span>Com aporte</span><i style={{ width: projection && financing.termMonths > 0 ? `${Math.max(20, projection.payoffMonth / financing.termMonths * 92)}%` : "92%" }} /></div></div><p className="aside-note"><Info size={15} /> O resultado será calculado com os dados informados.</p></aside></div>}</section>;
}
function Result({ comparison, setScreen }: { comparison: SimulationComparison; setScreen: (screen: Screen) => void }) {
  const { baseline, scenario } = comparison;
  const interestReduction = baseline.totalInterest > 0 ? Math.round(comparison.interestSavings / baseline.totalInterest * 100) : 0;
  return <section className="result-page"><section className="page-intro result-intro"><div><div className="eyebrow"><span className="eyebrow-line" />RESULTADO DA SIMULAÇÃO</div><h1>Impacto da estratégia</h1><p>Veja como o aporte altera o prazo e o custo total do financiamento.</p></div><div className="result-actions"><button className="outline-button"><Copy size={15} /> Exportar resumo</button><button className="primary-button" onClick={() => setScreen("table")}>Ver tabela completa <ArrowRight size={16} /></button></div></section><div className="result-highlight"><div className="highlight-icon"><TrendingDown size={22} /></div><div><span>ECONOMIA TOTAL DE JUROS</span><strong>{formatCurrency(comparison.interestSavings)}</strong><small>ao longo do financiamento</small></div><div className="highlight-divider" /><div className="highlight-mini"><span>Prazo reduzido</span><strong>{comparison.monthsReduced} meses</strong><small>de {baseline.payoffMonth} para {scenario.payoffMonth} meses</small></div><div className="highlight-mini"><span>Estratégia</span><strong>{comparison.monthsReduced > 0 ? "Redução de prazo" : "Redução de parcela"}</strong><small>{comparison.monthsReduced > 0 ? "mantendo a parcela" : "mantendo o prazo"}</small></div></div><div className="comparison-grid"><div className="comparison-card neutral"><div className="comparison-head"><div><span className="section-kicker">SEM AMORTIZAÇÃO</span><h2>Plano original</h2></div><span className="comparison-label">Base</span></div><div className="comparison-value">{formatDate(baseline.payoffMonth)}</div><p>Fim estimado do financiamento</p><div className="comparison-stats"><div><span>Juros totais</span><strong>{formatCurrency(baseline.totalInterest)}</strong></div><div><span>Parcelas</span><strong>{baseline.payoffMonth}</strong></div></div><div className="long-bar"><i style={{ width: "100%" }} /></div></div><div className="comparison-card featured"><div className="comparison-head"><div><span className="section-kicker">COM ESTRATÉGIA</span><h2>Aporte extraordinário</h2></div><span className="comparison-label positive">Mais econômico</span></div><div className="comparison-value">{formatDate(scenario.payoffMonth)} <span>- {comparison.monthsReduced} meses</span></div><p>Fim estimado do financiamento</p><div className="comparison-stats"><div><span>Juros totais</span><strong>{formatCurrency(scenario.totalInterest)}</strong></div><div><span>Parcelas</span><strong>{scenario.payoffMonth}</strong></div></div><div className="long-bar green"><i style={{ width: `${Math.max(10, scenario.totalInterest / baseline.totalInterest * 100)}%` }} /></div></div></div><div className="result-bottom"><div className="panel decision-panel"><div className="panel-heading compact"><div><span className="section-kicker">EFEITO ACUMULADO</span><h2>Menos juros no longo prazo.</h2></div><div className="decision-badge"><TrendingUp size={15} /> {interestReduction}% menos juros</div></div><p>O saldo diminui mais rápido com o aporte. Ao final, são <strong>{formatCurrency(comparison.interestSavings)}</strong> que deixam de sair do seu bolso.</p><div className="decision-foot"><span><Zap size={15} /> Efeito acumulado até {formatDate(scenario.payoffMonth)}</span><button className="text-button" onClick={() => setScreen("scenarios")}>Comparar outros cenários <ArrowRight size={14} /></button></div></div><div className="panel next-step-panel"><span className="section-kicker">PRÓXIMO PASSO</span><h3>Ver o detalhamento</h3><p>Consulte saldo, juros e amortização mês a mês.</p><button className="secondary-button full" onClick={() => setScreen("table")}>Abrir tabela de amortização <Table2 size={15} /></button></div></div></section>;
}
function AmortizationTable({ comparison, setScreen, onAddAmortization }: { comparison: SimulationComparison; setScreen: (screen: Screen) => void; onAddAmortization: (payment: ExtraordinaryPayment) => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("20.000");
  const [month, setMonth] = useState("10");
  const pageSize = 10;
  const filtered = comparison.scenario.schedule.map((row) => ({ ...row, monthLabel: formatMonth(row.month) })).filter((row) => `${row.monthLabel} ${row.month}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return <section className="table-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />DETALHAMENTO</div><h1>Tabela de amortização</h1><p>Consulte a evolução do contrato, mês a mês.</p></div><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={16} /> Adicionar amortização</button></section><div className="table-toolbar"><div className="table-tabs"><button className="active">Amortização mensal</button><button onClick={() => setScreen("result")}>Resumo da estratégia</button></div><div className="table-tools"><div className="search-input"><Search size={15} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar mês" /></div><button className="filter-button"><CalendarDays size={15} /> {formatMonth(1)} — {formatMonth(comparison.scenario.payoffMonth)} <ChevronDown size={14} /></button></div></div><div className="panel table-panel"><div className="table-caption"><div><span className="section-kicker">CRONOGRAMA CALCULADO</span><h2>Parcelas do financiamento</h2></div><StatusPill tone="accent">Price · {comparison.scenario.payoffMonth} meses</StatusPill></div><div className="data-table-wrap"><table><thead><tr><th>MÊS</th><th>PARCELA</th><th>JUROS</th><th>AMORTIZAÇÃO</th><th>SALDO DEVEDOR</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.month} className={row.extraordinary > 0 || row.month === 1 ? "highlight-row" : ""}><td><div className="month-cell"><span className="month-number">{String(row.month).padStart(2, "0")}</span><strong>{row.monthLabel}</strong>{row.month === 1 && <span className="row-tag now">Agora</span>}{row.extraordinary > 0 && <span className="row-tag extra">Extraordinária</span>}</div></td><td>{formatCurrency(row.payment)}</td><td className="muted-value">{formatCurrency(row.interest)}</td><td className={row.extraordinary > 0 ? "green-value" : "muted-value"}>{formatCurrency(row.principal + row.extraordinary)}</td><td><strong>{formatCurrency(row.closingBalance)}</strong></td><td><button className="row-more" aria-label={`Mais opções para ${row.monthLabel}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Mostrando {rows.length} de {filtered.length} parcelas</span><div className="pagination"><button className="row-more" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior"><ArrowLeft size={15} /></button><span>Página {currentPage} de {pageCount}</span><button className="row-more" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Próxima página"><ArrowRight size={15} /></button></div></div></div><div className="table-insight"><div className="insight-icon"><Info size={17} /></div><p><strong>Amortização extraordinária.</strong> O aporte é abatido do saldo na parcela informada.</p><button className="text-button" onClick={() => setScreen("result")}>Voltar ao resultado <ArrowRight size={14} /></button></div>{showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal-card" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="section-kicker">NOVA ENTRADA</span><h2>Adicionar amortização</h2></div><IconButton label="Fechar" onClick={() => setShowAdd(false)}><X size={17} /></IconButton></div><p>O aporte será salvo no financiamento e recalculará o cronograma.</p><Field label="Valor do aporte" prefix="R$" value={amount} onChange={setAmount} /><Field label="Parcela do aporte" value={month} suffix="mês" onChange={setMonth} /><button className="primary-button full" onClick={async () => { await onAddAmortization({ month: Number(month), amount: safeCurrency(amount) }); setShowAdd(false); }}><Check size={16} /> Salvar amortização</button></div></div>}</section>;
}
function Scenarios({ comparison, simulation, setScreen }: { comparison: SimulationComparison; simulation: SimulationConfig; setScreen: (screen: Screen) => void }) {
  const accelerated = comparisonFor({ ...simulation, extraPayments: simulation.extraPayments.map((payment) => ({ ...payment, amount: payment.amount * 1.5 })) });
  const rows = [
    { name: "Referência", detail: "Seu planejamento atual", amount: comparison.scenario.schedule.find((row) => row.extraordinary > 0)?.extraordinary ?? 0, result: comparison.scenario },
    { name: "Acelerar", detail: "Aporte 50% maior", amount: accelerated.scenario.schedule.find((row) => row.extraordinary > 0)?.extraordinary ?? 0, result: accelerated.scenario },
    { name: "Constante", detail: "Sem aporte extra", amount: 0, result: comparison.baseline },
  ];
  return <section className="scenarios-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />VISÃO DE CENÁRIOS</div><h1>Comparar estratégias</h1><p>Compare prazo, juros e esforço de aporte.</p></div><button className="outline-button" onClick={() => setScreen("simulation")}><Plus size={15} /> Novo cenário</button></section><div className="scenario-hero"><div><span className="section-kicker">CENÁRIO SELECIONADO</span><h2>Referência · {formatCurrency(rows[0].amount)}</h2><p>Use este cenário como referência para comparar outras estratégias.</p></div><div className="scenario-hero-result"><span>ECONOMIA EM JUROS</span><strong>{formatCurrency(comparison.interestSavings)}</strong><small>- {comparison.monthsReduced} meses no prazo</small></div></div><div className="scenario-table panel"><div className="scenario-table-heading"><div><span className="section-kicker">COMPARAÇÃO RÁPIDA</span><h2>Cenários comparados</h2></div><span className="filter-button">Ordenar: economia</span></div><div className="scenario-list"><div className="scenario-row header"><span>CENÁRIO</span><span>APORTE</span><span>PRAZO FINAL</span><span>JUROS TOTAIS</span><span>ECONOMIA</span><span /></div>{rows.map((row, index) => <div className={`scenario-row ${index === 0 ? "selected" : ""}`} key={row.name}><div className="scenario-name"><div className={`scenario-dot ${index === 0 ? "reference" : index === 1 ? "ambitious" : "calm"}`} /><div><strong>{row.name}</strong><small>{row.detail}</small></div></div><span>{formatCurrency(row.amount)}</span><span>{formatDate(row.result.payoffMonth)}</span><span>{formatCurrency(row.result.totalInterest)}</span><strong className={index === 2 ? "muted-value" : "green-value"}>{index === 2 ? "—" : formatCurrency(comparison.baseline.totalInterest - row.result.totalInterest)}</strong><button className="row-more"><MoreHorizontal size={17} /></button></div>)}</div></div><div className="scenario-bottom"><div className="panel scenario-chart-card"><div className="panel-heading compact"><div><span className="section-kicker">ESFORÇO × RESULTADO</span><h2>Aporte anual × economia de juros</h2></div><Info size={17} className="muted-icon" /></div><div className="scatter"><div className="scatter-axis-y"><span>{formatCurrency(comparison.baseline.totalInterest)}</span><span>{formatCurrency(comparison.interestSavings)}</span><span>R$ 0</span></div><div className="scatter-field"><div className="scatter-line" /><div className="scatter-point point-a"><span>Acelerar</span></div><div className="scatter-point point-b"><span>Referência</span></div><div className="scatter-point point-c"><span>Constante</span></div><div className="scatter-x"><span>R$ 0</span><span>{formatCurrency(rows[0].amount)}</span><span>{formatCurrency(rows[1].amount)}</span></div></div></div></div><div className="panel compare-cta"><div className="compare-icon"><Copy size={18} /></div><h3>Comparar dois cenários</h3><p>Coloque duas estratégias lado a lado.</p><button className="secondary-button full" onClick={() => setScreen("result")}>Abrir comparação <ArrowRight size={15} /></button></div></div></section>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível autenticar.");
      onAuthenticated(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page"><div className="auth-panel"><div className="brand-mark" aria-label="RBR"><div className="brand-symbol"><span /> <span /> <span /></div><div><strong>rbr<span>.</span></strong><small>real balance room</small></div></div><div className="eyebrow"><span className="eyebrow-line" />ACESSO SEGURO</div><h1>{mode === "login" ? "Entre no RBR" : "Crie sua conta"}</h1><p>{mode === "login" ? "Acesse seus financiamentos salvos." : "Salve suas simulações e amortizações."}</p>{mode === "register" && <Field label="Nome" value={name} onChange={setName} />}<Field label="E-mail" value={email} onChange={setEmail} /><Field label="Senha" value={password} onChange={setPassword} /><button className="primary-button full" disabled={busy} onClick={() => void submit()}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>{error && <p className="field-error">{error}</p>}<button className="text-button auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>{mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}</button></div></main>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [simulationStep, setSimulationStep] = useState<SimulationStep>(1);
  const [simulation, setSimulation] = useState<SimulationConfig>(initialSimulation);
  const [toast, setToast] = useState<string | null>(null);
  const comparison = comparisonFor(simulation);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : null)
      .then((savedUser: User | null) => { setUser(savedUser); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/financings")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API indisponível")))
      .then((items: Array<{ id: string }>) => items[0] ? fetch(`/api/financings/${items[0].id}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("Financiamento indisponível"))) : null)
      .then((saved: { id: string; principal: number; annualRate: number; termMonths: number; method: FinancingInput["method"]; amortizations?: Array<{ month: number; amount: number; goal: AmortizationGoal }> } | null) => {
        if (!active || !saved) return;
        setSimulation({ financingId: saved.id, financing: { principal: saved.principal, annualRate: saved.annualRate, termMonths: saved.termMonths, method: saved.method }, extraPayments: saved.amortizations?.map(({ month, amount }) => ({ month, amount })) ?? [], goal: saved.amortizations?.[0]?.goal ?? "term" });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [user?.id]);

  const goTo = (next: Screen) => { setScreen(next); if (next === "simulation") setSimulationStep(1); };
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(null), 3200); };
  const generateSimulation = async (next: SimulationConfig) => {
    try {
      const response = await fetch(next.financingId ? `/api/financings/${next.financingId}` : "/api/financings", { method: next.financingId ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next.financing, name: "Meu financiamento", goal: next.goal, extraPayments: next.extraPayments }) });
      if (!response.ok) throw new Error("Não foi possível salvar");
      const saved = await response.json() as { id: string };
      setSimulation({ ...next, financingId: saved.id });
    } catch {
      setSimulation(next);
      notify("Simulação calculada localmente. O banco estará disponível quando o servidor estiver ativo.");
    }
    setScreen("result");
  };
  const addAmortization = async (payment: ExtraordinaryPayment) => {
    if (!Number.isInteger(payment.month) || payment.month <= 0 || payment.amount <= 0) { notify("Informe uma parcela e um valor de aporte válidos."); return; }
    const next = { ...simulation, extraPayments: [...simulation.extraPayments, payment] };
    if (!simulation.financingId) { setSimulation(next); return; }
    try {
      const response = await fetch(`/api/financings/${simulation.financingId}/amortizations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payment, goal: simulation.goal }) });
      if (!response.ok) throw new Error("Não foi possível salvar");
    } catch { notify("A amortização foi aplicada nesta sessão, mas não foi persistida no banco."); }
    setSimulation(next);
  };

  if (!authChecked) return <main className="auth-page"><div className="auth-panel"><strong>Carregando...</strong></div></main>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined); setUser(null); };
  return <AppShell screen={screen} setScreen={goTo} onToast={notify} user={user} onLogout={() => void logout()}>{screen === "dashboard" && <Dashboard setScreen={goTo} onToast={notify} />}{screen === "simulation" && <Simulation step={simulationStep} setStep={setSimulationStep} setScreen={goTo} onGenerate={generateSimulation} />}{screen === "result" && <Result comparison={comparison} setScreen={goTo} />}{screen === "table" && <AmortizationTable comparison={comparison} setScreen={goTo} onAddAmortization={addAmortization} />}{screen === "scenarios" && <Scenarios comparison={comparison} simulation={simulation} setScreen={goTo} />}{toast && <div className="toast"><div className="toast-check"><Check size={14} /></div><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Fechar mensagem"><X size={14} /></button></div>}</AppShell>;
}
