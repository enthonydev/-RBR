import { useState } from "react";
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

type Screen = "dashboard" | "simulation" | "result" | "table" | "scenarios";
type SimulationStep = 1 | 2;

type IconType = typeof LayoutDashboard;

const navItems: Array<{ id: Screen; label: string; icon: IconType; section: string }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard, section: "Principal" },
  { id: "simulation", label: "Nova simulação", icon: Sparkles, section: "Principal" },
  { id: "result", label: "Resultado", icon: FileChartColumnIncreasing, section: "Análise" },
  { id: "table", label: "Tabela de amortização", icon: Table2, section: "Análise" },
  { id: "scenarios", label: "Cenários", icon: Target, section: "Análise" },
];

const scheduleRows = [
  { month: "Abr/26", number: "01", payment: "R$ 3.100", interest: "R$ 2.960", principal: "R$ 140", balance: "R$ 284.180", tag: "Agora" },
  { month: "Mai/26", number: "02", payment: "R$ 3.100", interest: "R$ 2.958", principal: "R$ 142", balance: "R$ 284.038" },
  { month: "Jun/26", number: "03", payment: "R$ 3.100", interest: "R$ 2.956", principal: "R$ 144", balance: "R$ 283.894" },
  { month: "Jul/26", number: "04", payment: "R$ 3.100", interest: "R$ 2.954", principal: "R$ 146", balance: "R$ 283.748" },
  { month: "Ago/26", number: "05", payment: "R$ 3.100", interest: "R$ 2.953", principal: "R$ 147", balance: "R$ 283.601" },
  { month: "Set/26", number: "06", payment: "R$ 3.100", interest: "R$ 2.951", principal: "R$ 149", balance: "R$ 283.452" },
  { month: "Out/26", number: "07", payment: "R$ 3.100", interest: "R$ 2.949", principal: "R$ 151", balance: "R$ 283.301" },
  { month: "Nov/26", number: "08", payment: "R$ 3.100", interest: "R$ 2.947", principal: "R$ 153", balance: "R$ 283.148" },
  { month: "Dez/26", number: "09", payment: "R$ 3.100", interest: "R$ 2.945", principal: "R$ 155", balance: "R$ 282.993" },
  { month: "Jan/27", number: "10", payment: "R$ 23.100", interest: "R$ 2.943", principal: "R$ 20.157", balance: "R$ 262.836", tag: "Extraordinária" },
];

const currency = (value: string) => value;

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

function AppShell({ screen, setScreen, children, onToast }: { screen: Screen; setScreen: (screen: Screen) => void; children: React.ReactNode; onToast: (text: string) => void }) {
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
        <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17} /><div><strong>Documentação</strong><span>Notas do produto</span></div><ArrowRight size={15} /></div><div className="user-row"><div className="avatar">RS</div><div><strong>Rafael Souza</strong><span>Plano pessoal</span></div><MoreHorizontal size={18} /></div></div>
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
    <section className="dashboard-grid main-dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><span className="section-kicker">PROJEÇÃO DO SALDO</span><h2>Como a dívida evolui</h2></div><button className="select-button">Próximos 30 anos <ChevronDown size={14} /></button></div><div className="chart-summary"><strong>R$ 284.320</strong><span><ArrowDownRight size={13} /> 5,3% desde o início</span></div><DebtChart /><div className="chart-footnote"><span><i className="legend-dot" />Saldo projetado</span><span><i className="legend-dot soft" />Amortização extraordinária em Jan/27</span></div></div><div className="side-stack"><div className="panel next-payment-panel"><div className="panel-heading compact"><div><span className="section-kicker">PRÓXIMO MOVIMENTO</span><h2>Amortização prevista</h2></div><div className="round-arrow"><ArrowUpRight size={17} /></div></div><div className="next-amount">R$ 20.000</div><div className="next-meta"><span><CalendarDays size={14} /> Janeiro de 2027</span><span><RepeatIcon /> Anual</span></div><div className="divider" /><p>Simule agora o impacto desse aporte no seu prazo e nos juros totais.</p><button className="primary-button full" onClick={() => setScreen("result")}>Ver impacto <ArrowRight size={16} /></button></div><div className="insight-card"><div className="insight-icon"><Zap size={17} /></div><div><span className="section-kicker">NOTA</span><p>O próximo aporte pode antecipar o fim do financiamento em <strong>18 meses</strong>.</p><button className="text-button" onClick={() => setScreen("result")}>Abrir simulação <ArrowRight size={14} /></button></div></div></div></section>
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

function Simulation({ step, setStep, setScreen }: { step: SimulationStep; setStep: (step: SimulationStep) => void; setScreen: (screen: Screen) => void }) {
  return <section className="simulation-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />NOVA SIMULAÇÃO</div><h1>Nova simulação</h1><p>Informe os dados do contrato e escolha uma estratégia de amortização.</p></div><StatusPill>Rascunho salvo automaticamente</StatusPill></section><Stepper step={step} />{step === 1 ? <div className="simulation-layout"><div className="panel form-panel"><div className="form-heading"><div className="form-number">01</div><div><span className="section-kicker">DADOS DO FINANCIAMENTO</span><h2>Vamos começar pelo básico.</h2><p>Use os dados do contrato para criar uma base fiel.</p></div></div><div className="form-grid"><Field label="Valor do imóvel" prefix="R$" value="300.000" /><Field label="Entrada" prefix="R$" value="30.000" hint="30% do valor do imóvel" /><Field label="Valor financiado" prefix="R$" value="270.000" /><Field label="Taxa de juros" value="12,5" suffix="% a.a." /><Field label="Sistema de amortização" value="Price" /><Field label="Prazo total" value="360" suffix="meses" /></div><div className="form-footer"><span><Info size={15} /> Você poderá ajustar esses dados depois.</span><button className="primary-button" onClick={() => setStep(2)}>Continuar <ArrowRight size={16} /></button></div></div><aside className="panel form-aside"><div className="aside-icon"><HomeIcon size={19} /></div><span className="section-kicker">CONTRATO</span><h3>Casa Vila Mariana</h3><p>Uma referência visual para o contrato que você está planejando.</p><div className="aside-details"><div><span>Financiado</span><strong>90%</strong></div><div><span>Parcela estimada</span><strong>R$ 3.100</strong></div></div><div className="aside-quote"><span>“</span><p>Dados do contrato. Decisões melhores.</p></div></aside></div> : <div className="simulation-layout"><div className="panel form-panel"><div className="form-heading"><div className="form-number green">02</div><div><span className="section-kicker">ESTRATÉGIA DE AMORTIZAÇÃO</span><h2>Defina a estratégia</h2><p>Escolha o tipo de aporte e o objetivo da amortização.</p></div></div><div className="strategy-options"><button className="strategy-option selected"><div className="strategy-radio"><Check size={13} /></div><div><strong>Amortização recorrente</strong><span>Simular aportes que acontecem todo ano.</span></div><span className="option-tag">Recomendado</span></button><button className="strategy-option" onClick={() => {}}><div className="strategy-radio" /><div><strong>Aporte único</strong><span>Entender o impacto de uma amortização pontual.</span></div></button></div><div className="form-grid strategy-grid"><Field label="Valor do aporte" prefix="R$" value="20.000" /><Field label="Frequência" value="Anual" /><Field label="Mês do aporte" value="Janeiro" /><Field label="Primeiro aporte" value="Janeiro de 2027" /></div><div className="objective-block"><span className="field-label">Objetivo da amortização</span><div className="segmented"><button className="selected"><TrendingDown size={16} />Reduzir prazo</button><button onClick={() => {}}><ReceiptText size={16} />Reduzir parcela</button></div></div><div className="form-footer"><button className="back-button" onClick={() => setStep(1)}><ArrowLeft size={16} /> Voltar</button><button className="primary-button" onClick={() => setScreen("result")}>Gerar simulação <Sparkles size={16} /></button></div></div><aside className="panel form-aside strategy-aside"><div className="strategy-preview"><span>IMPACTO PREVISTO</span><strong>- 18 meses</strong><small>no prazo total</small></div><div className="mini-bars"><div><span>Sem aporte</span><i style={{ width: "92%" }} /></div><div><span>Com aporte</span><i style={{ width: "78%" }} /></div></div><p className="aside-note"><Sparkles size={15} /> O resultado compara as duas estratégias.</p></aside></div>}</section>;
}

function Result({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <section className="result-page"><section className="page-intro result-intro"><div><div className="eyebrow"><span className="eyebrow-line" />RESULTADO DA SIMULAÇÃO</div><h1>Impacto da estratégia</h1><p>Veja como os aportes anuais alteram o prazo e o custo total do financiamento.</p></div><div className="result-actions"><button className="outline-button"><Copy size={15} /> Exportar resumo</button><button className="primary-button" onClick={() => setScreen("table")}>Ver tabela completa <ArrowRight size={16} /></button></div></section><div className="result-highlight"><div className="highlight-icon"><TrendingDown size={22} /></div><div><span>ECONOMIA TOTAL DE JUROS</span><strong>R$ 187.640</strong><small>ao longo do financiamento</small></div><div className="highlight-divider" /><div className="highlight-mini"><span>Prazo reduzido</span><strong>18 meses</strong><small>de 360 para 342 meses</small></div><div className="highlight-mini"><span>Estratégia</span><strong>Redução de prazo</strong><small>mantendo a parcela atual</small></div></div><div className="comparison-grid"><div className="comparison-card neutral"><div className="comparison-head"><div><span className="section-kicker">SEM AMORTIZAÇÃO</span><h2>Plano original</h2></div><span className="comparison-label">Base</span></div><div className="comparison-value">Mar/54</div><p>Fim estimado do financiamento</p><div className="comparison-stats"><div><span>Juros totais</span><strong>R$ 846.720</strong></div><div><span>Parcelas restantes</span><strong>342</strong></div></div><div className="long-bar"><i style={{ width: "100%" }} /></div></div><div className="comparison-card featured"><div className="comparison-head"><div><span className="section-kicker">COM ESTRATÉGIA</span><h2>Aportes anuais</h2></div><span className="comparison-label positive">Mais econômico</span></div><div className="comparison-value">Set/52 <span>- 18 meses</span></div><p>Fim estimado do financiamento</p><div className="comparison-stats"><div><span>Juros totais</span><strong>R$ 659.080</strong></div><div><span>Parcelas restantes</span><strong>324</strong></div></div><div className="long-bar green"><i style={{ width: "82%" }} /></div></div></div><div className="result-bottom"><div className="panel decision-panel"><div className="panel-heading compact"><div><span className="section-kicker">EFEITO ACUMULADO</span><h2>Menos juros no longo prazo.</h2></div><div className="decision-badge"><TrendingUp size={15} /> 22% menos juros</div></div><p>A parcela permanece igual, mas o saldo diminui mais rápido. Ao final, são <strong>R$ 187.640</strong> que deixam de sair do seu bolso.</p><div className="decision-foot"><span><Zap size={15} /> Efeito acumulado até 2052</span><button className="text-button" onClick={() => setScreen("scenarios")}>Comparar outros cenários <ArrowRight size={14} /></button></div></div><div className="panel next-step-panel"><span className="section-kicker">PRÓXIMO PASSO</span><h3>Ver o detalhamento</h3><p>Consulte saldo, juros e amortização mês a mês.</p><button className="secondary-button full" onClick={() => setScreen("table")}>Abrir tabela de amortização <Table2 size={15} /></button></div></div></section>;
}

function AmortizationTable({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const filtered = scheduleRows.filter((row) => `${row.month} ${row.number}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="table-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />DETALHAMENTO</div><h1>Tabela de amortização</h1><p>Consulte a evolução do contrato, mês a mês.</p></div><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={16} /> Adicionar amortização</button></section><div className="table-toolbar"><div className="table-tabs"><button className="active">Amortização mensal</button><button onClick={() => setScreen("result")}>Resumo da estratégia</button></div><div className="table-tools"><div className="search-input"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar mês" /></div><button className="filter-button"><CalendarDays size={15} /> Abr/26 — Mar/54 <ChevronDown size={14} /></button></div></div><div className="panel table-panel"><div className="table-caption"><div><span className="section-kicker">CRONOGRAMA PROJETADO</span><h2>Primeiros movimentos</h2></div><StatusPill tone="accent">Price · 360 meses</StatusPill></div><div className="data-table-wrap"><table><thead><tr><th>MÊS</th><th>PARCELA</th><th>JUROS</th><th>AMORTIZAÇÃO</th><th>SALDO DEVEDOR</th><th /></tr></thead><tbody>{filtered.map((row) => <tr key={row.number} className={row.tag ? "highlight-row" : ""}><td><div className="month-cell"><span className="month-number">{row.number}</span><strong>{row.month}</strong>{row.tag && <span className={`row-tag ${row.tag === "Agora" ? "now" : "extra"}`}>{row.tag}</span>}</div></td><td>{row.payment}</td><td className="muted-value">{row.interest}</td><td className={row.tag === "Extraordinária" ? "green-value" : "muted-value"}>{row.principal}</td><td><strong>{row.balance}</strong></td><td><button className="row-more" aria-label={`Mais opções para ${row.month}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Mostrando {filtered.length} de 360 parcelas</span><div className="pagination"><button disabled><ArrowLeft size={14} /></button><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>36</button><button><ArrowRight size={14} /></button></div></div></div><div className="table-insight"><div className="insight-icon"><Sparkles size={17} /></div><p><strong>Janeiro de 2027 é o ponto de virada.</strong> É quando seu primeiro aporte extraordinário reduz o saldo em R$ 20.000 de uma vez.</p><button className="text-button" onClick={() => setScreen("result")}>Voltar ao resultado <ArrowRight size={14} /></button></div>{showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal-card" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="section-kicker">NOVA ENTRADA</span><h2>Adicionar amortização</h2></div><IconButton label="Fechar" onClick={() => setShowAdd(false)}><X size={17} /></IconButton></div><p>Este é um ponto de interação do protótipo. A funcionalidade real será conectada ao motor financeiro.</p><Field label="Valor do aporte" prefix="R$" value="20.000" /><Field label="Mês do aporte" value="Janeiro de 2027" /><button className="primary-button full" onClick={() => setShowAdd(false)}><Check size={16} /> Salvar no protótipo</button></div></div>}</section>;
}

function Scenarios({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return <section className="scenarios-page"><section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-line" />VISÃO DE CENÁRIOS</div><h1>Comparar estratégias</h1><p>Compare prazo, juros e esforço de aporte.</p></div><button className="outline-button" onClick={() => setScreen("simulation")}><Plus size={15} /> Novo cenário</button></section><div className="scenario-hero"><div><span className="section-kicker">CENÁRIO SELECIONADO</span><h2>Referência <span>·</span> aporte anual de R$ 20 mil</h2><p>Use este cenário como referência para comparar outras estratégias.</p></div><div className="scenario-hero-result"><span>ECONOMIA EM JUROS</span><strong>R$ 187.640</strong><small>- 18 meses no prazo</small></div></div><div className="scenario-table panel"><div className="scenario-table-heading"><div><span className="section-kicker">COMPARAÇÃO RÁPIDA</span><h2>Cenários comparados</h2></div><button className="filter-button">Ordenar: economia <ChevronDown size={14} /></button></div><div className="scenario-list"><div className="scenario-row header"><span>CENÁRIO</span><span>APORTE</span><span>PRAZO FINAL</span><span>JUROS TOTAIS</span><span>ECONOMIA</span><span /></div><div className="scenario-row selected"><div className="scenario-name"><div className="scenario-dot reference" /><div><strong>Referência</strong><small>Seu planejamento atual</small></div></div><span>R$ 20.000 / ano</span><span>Set/52</span><span>R$ 659.080</span><strong className="green-value">R$ 187.640</strong><button className="row-more"><MoreHorizontal size={17} /></button></div><div className="scenario-row"><div className="scenario-name"><div className="scenario-dot ambitious" /><div><strong>Acelerar</strong><small>R$ 30 mil / ano</small></div></div><span>R$ 30.000 / ano</span><span>Jun/49</span><span>R$ 530.220</span><strong className="green-value">R$ 316.500</strong><button className="row-more"><MoreHorizontal size={17} /></button></div><div className="scenario-row"><div className="scenario-name"><div className="scenario-dot calm" /><div><strong>Constante</strong><small>Sem aporte extra</small></div></div><span>R$ 0 / ano</span><span>Mar/54</span><span>R$ 846.720</span><strong className="muted-value">—</strong><button className="row-more"><MoreHorizontal size={17} /></button></div></div></div><div className="scenario-bottom"><div className="panel scenario-chart-card"><div className="panel-heading compact"><div><span className="section-kicker">ESFORÇO × RESULTADO</span><h2>Aporte anual × economia de juros</h2></div><Info size={17} className="muted-icon" /></div><div className="scatter"><div className="scatter-axis-y"><span>R$ 350k</span><span>R$ 200k</span><span>R$ 0</span></div><div className="scatter-field"><div className="scatter-line" /><div className="scatter-point point-a"><span>Acelerar</span></div><div className="scatter-point point-b"><span>Referência</span></div><div className="scatter-point point-c"><span>Constante</span></div><div className="scatter-x"><span>R$ 0</span><span>R$ 15k</span><span>R$ 30k</span></div></div></div></div><div className="panel compare-cta"><div className="compare-icon"><Copy size={18} /></div><h3>Comparar dois cenários</h3><p>Coloque duas estratégias lado a lado.</p><button className="secondary-button full" onClick={() => setScreen("result")}>Abrir comparação <ArrowRight size={15} /></button></div></div></section>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [simulationStep, setSimulationStep] = useState<SimulationStep>(1);
  const [toast, setToast] = useState<string | null>(null);

  const goTo = (next: Screen) => {
    setScreen(next);
    if (next === "simulation") setSimulationStep(1);
  };

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 3200);
  };

  return <AppShell screen={screen} setScreen={goTo} onToast={notify}>{screen === "dashboard" && <Dashboard setScreen={goTo} onToast={notify} />}{screen === "simulation" && <Simulation step={simulationStep} setStep={setSimulationStep} setScreen={goTo} />}{screen === "result" && <Result setScreen={goTo} />}{screen === "table" && <AmortizationTable setScreen={goTo} />}{screen === "scenarios" && <Scenarios setScreen={goTo} />}{toast && <div className="toast"><div className="toast-check"><Check size={14} /></div><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Fechar mensagem"><X size={14} /></button></div>}</AppShell>;
}
