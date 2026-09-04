import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Router as WouterRouter, Switch, useRoute } from 'wouter';
import {
  getListActionsQueryKey,
  getListFeedbackQueryKey,
  useCreateFeedback,
  useListActions,
  useListFeedback,
  useUpdateAction,
} from '@workspace/api-client-react';
import type { ActionStatus } from '@workspace/api-client-react';
import AdminApp from './admin/AdminApp';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  Gauge,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Network,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type StatusIndex = 0 | 1 | 2 | 3;

const seededRatingData = [
  { month: 'Sep', score: 4.1, responses: 24 },
  { month: 'Oct', score: 4.2, responses: 31 },
  { month: 'Nov', score: 4.4, responses: 36 },
  { month: 'Dec', score: 4.3, responses: 29 },
  { month: 'Jan', score: 4.5, responses: 38 },
  { month: 'Feb', score: 4.6, responses: 42 },
  { month: 'Mar', score: 4.6, responses: 42 },
];

const initialCategories = [
  { name: 'Hostel', value: 31, color: '#df7064' },
  { name: 'Mess / Food', value: 24, color: '#1e6a5b' },
  { name: 'Academic', value: 22, color: '#eab171' },
  { name: 'Well-being', value: 14, color: '#7fae9a' },
  { name: 'Other', value: 9, color: '#a9a89a' },
];

const flowSteps: { label: string; caption: string; icon: LucideIcon }[] = [
  { label: 'Student', caption: 'voice', icon: Users },
  { label: 'Feedback', caption: 'signal', icon: MessageCircle },
  { label: 'Pattern', caption: 'shared', icon: Network },
  { label: 'Priority', caption: 'focused', icon: Target },
  { label: 'Action', caption: 'owned', icon: ClipboardList },
  { label: 'Measurement', caption: 'tracked', icon: Gauge },
  { label: 'Impact', caption: 'felt', icon: HeartHandshake },
];

const statusLabels = ['New', 'Under Review', 'Action Taken', 'Measured'];

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(36,89,79,.14)',
  background: '#fbf9f2',
  color: '#25463f',
  fontSize: 11,
  boxShadow: '0 8px 25px rgba(55,68,47,.1)',
};

function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 780;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown.toFixed(decimals)}{suffix}</>;
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.42, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Brand() {
  return (
    <a href="#top" className="brand" data-testid="link-brand">
      <span className="brand-mark">a</span>
      <span>
        <span className="brand-name">apna saathi</span>
        <span className="brand-caption">the campus listening loop</span>
      </span>
    </a>
  );
}

function StudentApp() {
  const queryClient = useQueryClient();
  const feedbackQuery = useListFeedback({ query: { queryKey: getListFeedbackQueryKey(), refetchOnWindowFocus: false } });
  const actionsQuery = useListActions({ query: { queryKey: getListActionsQueryKey(), refetchOnWindowFocus: false } });
  const createFeedback = useCreateFeedback({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() });
        setSubmitted(true);
        setLocalStatusIndex(0);
        showToast('Signal received. Thank you for moving the campus forward.');
      },
      onError: () => showToast('Your signal could not be saved. Please try again.'),
    },
  });
  const updateAction = useUpdateAction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListActionsQueryKey() }),
      onError: () => showToast('That status could not be saved. Please try again.'),
    },
  });
  const feedback = feedbackQuery.data ?? [];
  const actions = actionsQuery.data ?? [];
  const feedbackCount = feedback.length;
  const averageRating = feedbackCount ? Number((feedback.reduce((sum, item) => sum + item.rating, 0) / feedbackCount).toFixed(1)) : 0;
  const firstAction = actions[0];
  const persistedStatusIndex = firstAction ? Math.max(0, statusLabels.indexOf(firstAction.status as ActionStatus)) : 0;
  const [localStatusIndex, setLocalStatusIndex] = useState<StatusIndex | null>(null);
  const statusIndex = localStatusIndex ?? (persistedStatusIndex as StatusIndex);
  const ratingData = useMemo(() => [...seededRatingData.slice(0, -1), { month: 'Now', score: averageRating || 4.6, responses: feedbackCount }], [averageRating, feedbackCount]);
  const categories = useMemo(() => {
    if (!feedback.length) return initialCategories;
    const palette = ['#df7064', '#1e6a5b', '#eab171', '#7fae9a', '#a9a89a'];
    const names = ['Hostel', 'Mess / Food', 'Academic', 'Well-being', 'Other'];
    return names.map((name, index) => ({
      name,
      value: Math.round((feedback.filter((item) => item.category === name).length / feedback.length) * 100),
      color: palette[index],
    }));
  }, [feedback]);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ category: 'Hostel', location: 'North Campus · Hostel 3', rating: 0, issue: 'Maintenance', message: '' });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.rating || !form.message.trim() || !form.issue.trim()) {
      showToast('Add a rating and a few words so your signal can travel.');
      return;
    }
    createFeedback.mutate({ data: form });
  };

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <div className="container topbar-inner">
          <Brand />
          <nav className="nav" aria-label="Primary navigation">
            <a href="#dashboard" data-testid="link-dashboard">Dashboard</a>
            <a href="#insights" data-testid="link-insights">Insights</a>
            <a href="#impact" data-testid="link-impact">Impact loop</a>
          </nav>
           <div className="topbar-actions">
             <a className="topbar-admin-link" href="/admin" data-testid="link-admin-mode">Admin workspace <ArrowUpRight size={14} /></a>
             <button className="topbar-action" onClick={() => scrollTo('share')} data-testid="button-share-header">
               Share feedback <ArrowDownRight size={14} strokeWidth={2.5} />
             </button>
           </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="container hero-grid">
            <Reveal>
              <div className="eyebrow">A live feedback loop for campus life</div>
              <h1 id="hero-heading" className="display">Your campus.<br /><em>In conversation.</em></h1>
              <p className="hero-copy">Apna Saathi gives student experience a clear path from lived moment to meaningful change. Say what is happening. See what is moving.</p>
              <div className="hero-cta">
                <button className="primary-btn" onClick={() => scrollTo('share')} data-testid="button-share-hero">Share what matters <ArrowRight size={14} /></button>
                <button className="quiet-btn" onClick={() => scrollTo('impact')} data-testid="button-see-impact">See the loop <Waves size={14} /></button>
              </div>
              <div className="hero-note"><ShieldCheck size={14} /> Your voice is treated with care and used in aggregate.</div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="signal-orbit" aria-label="Students to impact signal diagram">
                <div className="orbit-ring one" /><div className="orbit-ring two" />
                <span className="orbit-label label-students">Students</span><span className="orbit-label label-patterns">Patterns</span><span className="orbit-label label-action">Action</span><span className="orbit-label label-impact">Impact</span>
                <div className="orbit-core"><div><strong>listen<br />closer</strong><span>signals become change</span></div></div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section section-tint" id="dashboard" aria-labelledby="dashboard-heading">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <div><div className="eyebrow">The pulse of campus</div><h2 id="dashboard-heading" className="display">Small signals.<br />Clearer direction.</h2></div>
                <p className="section-intro">A living view of what students are experiencing this term — and where university teams can make the next useful move.</p>
              </div>
            </Reveal>
            <div className="metric-grid">
              <Reveal delay={0.04}><div className="metric" data-testid="metric-feedback"><span className="metric-label">Student signals</span><strong className="metric-value"><CountUp value={feedbackCount} /></strong><span className="metric-delta">↑ 11.4% this term</span></div></Reveal>
              <Reveal delay={0.08}><div className="metric" data-testid="metric-rating"><span className="metric-label">Average experience</span><strong className="metric-value"><CountUp value={averageRating} decimals={1} suffix=" / 5" /></strong><span className="metric-delta">↑ 0.3 since September</span></div></Reveal>
              <Reveal delay={0.12}><div className="metric" data-testid="metric-actions"><span className="metric-label">Actions in motion</span><strong className="metric-value"><CountUp value={8} /></strong><span className="metric-delta">3 measured this month</span></div></Reveal>
              <Reveal delay={0.16}><div className="metric" data-testid="metric-response"><span className="metric-label">Response rate</span><strong className="metric-value"><CountUp value={68} suffix="%" /></strong><span className="metric-delta">↑ 8.2% from last pulse</span></div></Reveal>
            </div>
            <div className="dashboard-grid">
              <Reveal className="panel" delay={0.06}>
                <div className="panel-head"><div><div className="panel-title">Experience over time</div><div className="panel-subtitle">Average student rating, rolling monthly pulse</div></div><TrendingUp size={17} color="hsl(169 41% 29%)" /></div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratingData} margin={{ top: 8, right: 3, bottom: 0, left: -18 }}>
                      <defs><linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e6a5b" stopOpacity={0.24} /><stop offset="100%" stopColor="#1e6a5b" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid vertical={false} stroke="rgba(39,91,79,.1)" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#708078', fontSize: 10 }} /><YAxis domain={[3.8, 5]} ticks={[4, 4.4, 4.8]} tickLine={false} axisLine={false} tick={{ fill: '#708078', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} / 5`, 'Rating']} /><Area type="monotone" dataKey="score" stroke="#1e6a5b" strokeWidth={2.5} fill="url(#ratingFill)" animationDuration={900} dot={{ r: 3, strokeWidth: 2, fill: '#fbf9f2', stroke: '#1e6a5b' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend"><span><i className="chart-dot" style={{ background: '#1e6a5b' }} /> average rating</span><span><i className="chart-dot" style={{ background: '#eab171' }} /> current pulse</span></div>
              </Reveal>
              <Reveal className="panel" delay={0.1}>
                <div className="panel-head"><div><div className="panel-title">What students are talking about</div><div className="panel-subtitle">Share of all signals this term</div></div><Activity size={17} color="hsl(5 71% 65%)" /></div>
                <div className="chart-wrap" style={{ height: 165 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none" animationDuration={700}>{categories.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Share']} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bar-list">{categories.slice(0, 4).map((item) => <div key={item.name}><div className="bar-label"><span>{item.name}</span><span>{item.value}%</span></div><div className="bar-track"><motion.div className="bar-fill" animate={{ width: `${item.value * 2.35}%` }} transition={{ duration: .55 }} style={{ background: item.color }} /></div></div>)}</div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section" id="insights" aria-labelledby="insight-heading">
          <div className="container">
            <Reveal><div className="section-head"><div><div className="eyebrow">Signal intelligence</div><h2 id="insight-heading" className="display">From many voices<br />to one clear <em>next step.</em></h2></div><p className="section-intro">The platform looks for recurrence, location, and lived context — so teams act on the shape of an issue, not just its loudest instance.</p></div></Reveal>
            <Reveal className="insight-layout" delay={0.08}>
              <div className="insight-intro"><div className="eyebrow">AI-assisted insight</div><h3>Make the invisible visible.</h3><p>Patterns are surfaced with the context teams need to respond thoughtfully.</p></div>
              <div className="insight-card" data-testid="card-ai-insight">
                <div className="panel-head"><div><div className="eyebrow">Emerging now · 06 Mar 2024</div></div><span className="new-pill">NEW INSIGHT</span></div>
                <AnimatePresence mode="wait">
                  <motion.div key={feedbackCount} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
                    <p className="insight-message">“<mark>Hostel maintenance is emerging as a high-priority recurring issue.</mark>”</p>
                  </motion.div>
                </AnimatePresence>
                <div className="insight-details">
                  <div className="detail"><span className="detail-label">Reports</span><span className="detail-value" data-testid="text-insight-reports">{feedbackCount + 7} reports</span></div>
                  <div className="detail"><span className="detail-label">Average Rating</span><span className="detail-value">2.8 / 5</span></div>
                  <div className="detail"><span className="detail-label">Trend</span><span className="detail-value">↑ 34% in 30 days</span></div>
                  <div className="detail"><span className="detail-label">Affected location</span><span className="detail-value"><MapPin size={12} style={{ verticalAlign: 'middle' }} /> North Campus</span></div>
                  <div className="detail"><span className="detail-label">Recommended department</span><span className="detail-value">Estates & Facilities</span></div>
                  <div className="detail"><span className="detail-label">Priority</span><span className="detail-value" style={{ color: 'hsl(5 71% 58%)' }}>High · 86 / 100</span></div>
                </div>
                <div className="priority-line"><span>Priority signal</span><span className="priority-bar"><motion.span className="priority-fill" initial={{ width: 0 }} whileInView={{ width: '86%' }} transition={{ duration: .8, delay: .2 }} /></span><span className="mono">86</span></div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section section-tint" id="share" aria-labelledby="share-heading">
          <div className="container feedback-layout">
            <Reveal className="feedback-copy">
              <div className="eyebrow">Your turn to shape it</div><h2 id="share-heading" className="display">Say the thing<br />that needs <em>saying.</em></h2>
              <p>No perfect wording needed. A specific moment, place, or feeling is enough to start a useful pattern. You can share openly, knowing individual responses are handled with care.</p>
              <div className="prompt-quote">“The little things tell us where to look next.”<small>— student experience team, North Campus</small></div>
            </Reveal>
            <Reveal delay={0.1}>
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div className="success-state" key="success" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35 }} data-testid="status-feedback-success">
                     <div><div className="success-symbol"><Check size={25} /></div><h3>That signal<br />is now in motion.</h3><p>Thank you for helping the campus see what matters. Together, small signals become a better day for someone else.</p><button className="quiet-btn" onClick={() => { setSubmitted(false); setForm((current) => ({ ...current, rating: 0, message: '' })); }} data-testid="button-share-another">Share another signal</button></div>
                  </motion.div>
                ) : (
                  <motion.form className="feedback-form" key="form" onSubmit={submitFeedback} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3 }} data-testid="form-feedback">
                    <div className="eyebrow" style={{ marginBottom: 20 }}>A two-minute pulse</div>
                     <div className="form-grid">
                       <div className="field"><label htmlFor="feedback-category">Category</label><select id="feedback-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} data-testid="select-category"><option>Mess / Food</option><option>Hostel</option><option>Academic</option><option>Wi-Fi & Facilities</option><option>Well-being</option><option>Other</option></select></div>
                      <div className="field"><label htmlFor="feedback-location">Where did this happen?</label><select id="feedback-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} data-testid="select-location"><option>North Campus · Hostel 3</option><option>South Campus · Library</option><option>Central Campus · Canteen</option><option>Online / off campus</option></select></div>
                       <div className="field"><label htmlFor="feedback-issue">Issue</label><input id="feedback-issue" value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} placeholder="Maintenance, food quality, Wi-Fi..." data-testid="input-issue" /></div>
                      <div className="field full"><label>How was the experience?</label><div className="rating-row" role="group" aria-label="Experience rating">{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} className={`rating-choice ${form.rating === rating ? 'selected' : ''}`} onClick={() => setForm({ ...form, rating })} aria-label={`${rating} out of 5`} data-testid={`button-rating-${rating}`}>{rating}</button>)}</div></div>
                      <div className="field full"><label htmlFor="feedback-message">Tell us what happened</label><textarea id="feedback-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="A moment, a place, a pattern you have noticed..." data-testid="textarea-feedback" /></div>
                    </div>
                     <div className="form-actions"><span className="privacy-note"><ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Shared with university teams as an anonymous signal.</span><button className="primary-btn" type="submit" disabled={createFeedback.isPending} data-testid="button-submit-feedback">{createFeedback.isPending ? 'Sending…' : 'Send my signal'} <Send size={14} /></button></div>
                  </motion.form>
                )}
              </AnimatePresence>
            </Reveal>
          </div>
        </section>

        <section className="section" id="impact" aria-labelledby="impact-heading">
          <div className="container">
            <Reveal><div className="section-head"><div><div className="eyebrow">Close the loop</div><h2 id="impact-heading" className="display">See the work<br />move forward.</h2></div><p className="section-intro">A trustworthy feedback system does not end at “thanks for sharing.” Follow the handoff, the decision, and the difference it makes.</p></div></Reveal>
            <Reveal delay={0.07}>
              <div className="flow-track" aria-label="Student to impact flow">
                {flowSteps.map((step, index) => { const Icon = step.icon; return <motion.div className={`flow-step ${index < statusIndex ? 'done' : ''} ${index === statusIndex ? 'active' : ''}`} key={step.label} animate={{ y: index === statusIndex ? -4 : 0 }} transition={{ duration: .3 }} data-testid={`flow-step-${step.label.toLowerCase()}`}><div className="flow-node"><Icon size={17} /></div><p>{step.label}</p><small>{step.caption}</small></motion.div>; })}
              </div>
              <div className="flow-controls" role="group" aria-label="Update action status">{statusLabels.map((label, index) => <button key={label} className={`status-btn ${statusIndex === index ? 'active' : ''}`} onClick={() => { setLocalStatusIndex(index as StatusIndex); if (firstAction) updateAction.mutate({ id: firstAction.id, data: { status: label as ActionStatus } }); }} data-testid={`button-status-${label.toLowerCase().replace(' ', '-')}`}>{index < statusIndex && <Check size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />}{label}</button>)}</div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="impact-story" data-testid="impact-story">
                <div className="story-step"><div className="eyebrow">You said</div><h3>Hostel bathrooms need better maintenance.</h3><span className="story-arrow"><ArrowRight size={20} /></span></div>
                <div className="story-step"><div className="eyebrow">We did</div><h3>Cleaning frequency increased.</h3><span className="story-arrow"><ArrowRight size={20} /></span></div>
                <motion.div className="story-step" key={statusIndex} initial={{ opacity: .5 }} animate={{ opacity: 1 }} transition={{ duration: .3 }}><div className="eyebrow">The result</div><h3>{statusIndex < 3 ? 'Student satisfaction is on its way.' : 'Student satisfaction improved.'}</h3><span className="story-arrow"><TrendingUp size={20} /></span></motion.div>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="panel" style={{ marginTop: 16 }}>
                <div className="panel-head"><div><div className="panel-title">Before / after · hostel maintenance action</div><div className="panel-subtitle">The experience shift after cleaning frequency changed</div></div><Sparkles size={17} color="hsl(5 71% 65%)" /></div>
                <div className="chart-wrap" style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ label: 'Before action', score: 2.8 }, { label: 'After action', score: statusIndex === 3 ? 4.2 : 3.7 }]} margin={{ top: 5, right: 14, bottom: 0, left: -18 }}>
                      <CartesianGrid vertical={false} stroke="rgba(39,91,79,.1)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#708078', fontSize: 10 }} /><YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: '#708078', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} / 5`, 'Rating']} /><Bar dataKey="score" radius={[7,7,0,0]} barSize={54} animationDuration={700}>{[0, 1].map((index) => <Cell key={index} fill={index === 0 ? '#d6ad82' : '#1e6a5b'} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="container footer-inner"><strong>apna saathi</strong><span>Built for honest signals, thoughtful action, and better campus days.</span></div></footer>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} data-testid="status-toast">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function AdminSectionRoute() {
  const [, params] = useRoute<{ section: string }>('/admin/:section');
  return <AdminApp section={params?.section ?? 'overview'} />;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/" component={StudentApp} />
          <Route path="/admin" component={() => <AdminApp section="overview" />} />
          <Route path="/admin/:section" component={AdminSectionRoute} />
          <Route component={StudentApp} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;