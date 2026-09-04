import { type FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Coffee,
  Filter,
  HeartPulse,
  Home,
  LayoutDashboard,
  ListFilter,
  MapPin,
  MessageSquareText,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Wifi,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getListActionsQueryKey,
  getListFeedbackQueryKey,
  useCreateAction,
  useListActions,
  useListFeedback,
  useUpdateAction,
} from "@workspace/api-client-react";
import type {
  Action,
  ActionPriority,
  ActionStatus,
  Feedback,
} from "@workspace/api-client-react";

const statusOptions: ActionStatus[] = ["New", "Under Review", "Action Taken", "Measured"];
const priorityOptions: ActionPriority[] = ["Low", "Medium", "High"];

const categoryMeta = {
  mess: { label: "Mess / Food", value: "Mess / Food", icon: Coffee, tint: "#d7a15f", department: "Dining Services" },
  hostel: { label: "Hostel", value: "Hostel", icon: Home, tint: "#df7064", department: "Hostel Operations" },
  academic: { label: "Academic", value: "Academic", icon: BookOpen, tint: "#6f9e8f", department: "Academic Affairs" },
  wifi: { label: "Wi-Fi & Facilities", value: "Wi-Fi & Facilities", icon: Wifi, tint: "#7e8fc4", department: "Campus Technology" },
  wellbeing: { label: "Well-being", value: "Well-being", icon: HeartPulse, tint: "#c87f9b", department: "Student Well-being" },
  other: { label: "Other", value: "Other", icon: CircleHelp, tint: "#9c9c91", department: "Student Experience" },
} as const;

type CategoryKey = keyof typeof categoryMeta;

const categoryNav: Array<{ key: CategoryKey; href: string }> = [
  { key: "mess", href: "/admin/mess" },
  { key: "hostel", href: "/admin/hostel" },
  { key: "academic", href: "/admin/academic" },
  { key: "wifi", href: "/admin/wifi" },
  { key: "wellbeing", href: "/admin/wellbeing" },
  { key: "other", href: "/admin/other" },
];

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid rgba(35,88,77,.16)",
  background: "#fbf9f2",
  color: "#25463f",
  fontSize: 11,
  boxShadow: "0 8px 25px rgba(55,68,47,.1)",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value));
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityClass(priority: string) {
  return `admin-priority ${priority.toLowerCase()}`;
}

function statusClass(status: string) {
  return `admin-status ${status.toLowerCase().replaceAll(" ", "-")}`;
}

function AdminSidebar({ section }: { section: string }) {
  const baseItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, key: "overview" },
    ...categoryNav.map(({ key, href }) => ({ label: categoryMeta[key].label, href, icon: categoryMeta[key].icon, key })),
    { label: "Feedback", href: "/admin/feedback", icon: MessageSquareText, key: "feedback" },
    { label: "Actions", href: "/admin/actions", icon: ClipboardCheck, key: "actions" },
    { label: "Impact Tracker", href: "/admin/impact", icon: Target, key: "impact" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="brand-mark">a</span>
        <span>
          <strong>apna saathi</strong>
          <small>ADMIN INTELLIGENCE</small>
        </span>
      </div>
      <div className="admin-nav-label">Workspace</div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {baseItems.map((item) => {
          const Icon = item.icon;
          const active = section === item.key;
          return (
            <Link key={item.key} href={item.href} className={`admin-nav-item ${active ? "active" : ""}`} data-testid={`admin-nav-${item.key}`}>
              <Icon size={16} />
              <span>{item.label}</span>
              {active && <motion.i layoutId="admin-nav-dot" />}
            </Link>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <div className="admin-live"><span /> Live campus pulse</div>
        <span>Spring term · 2024</span>
      </div>
    </aside>
  );
}

function AdminHeader({ section, feedbackCount }: { section: string; feedbackCount: number }) {
  const sectionLabel = section === "overview" ? "Overview" : section === "feedback" ? "Feedback management" : section === "actions" ? "Action tracker" : section === "impact" ? "Impact tracker" : categoryMeta[section as CategoryKey]?.label ?? "Workspace";
  return (
    <header className="admin-header">
      <div>
        <div className="admin-breadcrumb"><span>APNA SAATHI</span><ArrowRight size={12} /><span>ADMIN</span></div>
        <h1>{sectionLabel}</h1>
      </div>
      <div className="admin-header-actions">
        <span className="admin-data-status"><Radio size={13} /> {feedbackCount} signals synced</span>
        <Link href="/" className="student-switch" data-testid="link-student-mode">Student view <ArrowUpRight size={14} /></Link>
      </div>
    </header>
  );
}

function AdminStat({ label, value, detail, icon: Icon, accent = "green" }: { label: string; value: string | number; detail: string; icon: typeof Activity; accent?: string }) {
  return (
    <motion.div className={`admin-stat ${accent}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
      <div className="admin-stat-top"><span>{label}</span><Icon size={16} /></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-section-heading">
      <div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
      {action}
    </div>
  );
}

function OverviewPage({ feedback, actions }: { feedback: Feedback[]; actions: Action[] }) {
  const average = feedback.length ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;
  const issueCounts = Object.entries(feedback.reduce<Record<string, number>>((acc, item) => {
    acc[item.issue] = (acc[item.issue] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const categoryData = Object.entries(categoryMeta).map(([key, meta]) => ({
    name: meta.label,
    value: feedback.filter((item) => item.category === meta.value).length,
    color: meta.tint,
    key,
  }));
  const volumeData = [...feedback].slice(0, 7).reverse().map((item, index) => ({
    label: formatDate(item.createdAt),
    responses: index + 1 + feedback.filter((candidate) => candidate.createdAt.slice(0, 10) === item.createdAt.slice(0, 10)).length,
  }));
  const primaryAction = actions[0];

  return (
    <div className="admin-page">
      <SectionHeading eyebrow="Campus intelligence" title="A clearer view of what needs to move." copy="One operational view for the signals students share, the patterns teams see, and the actions the university owns." action={<span className="admin-refresh"><Clock3 size={14} /> Updated just now</span>} />
      <div className="admin-stat-grid">
        <AdminStat label="Total student responses" value={feedback.length} detail="Across the current term" icon={MessageSquareText} />
        <AdminStat label="Overall satisfaction" value={`${average.toFixed(1)} / 5`} detail="Weighted from all signals" icon={HeartPulse} accent="coral" />
        <AdminStat label="Issues reported" value={new Set(feedback.map((item) => item.issue)).size} detail="Recurring themes surfaced" icon={Target} accent="gold" />
        <AdminStat label="Actions completed" value={actions.filter((item) => item.status === "Action Taken" || item.status === "Measured").length} detail={`${actions.length} total actions tracked`} icon={ClipboardCheck} accent="blue" />
      </div>
      <div className="admin-grid admin-grid-two">
        <section className="admin-card admin-chart-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">01 · Experience</span><h3>Satisfaction by category</h3></div><BarChart3 size={17} /></div>
          <div className="admin-chart admin-chart-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={false} stroke="rgba(35,88,77,.1)" />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={104} tickLine={false} axisLine={false} tick={{ fill: "#526b64", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value || 0} responses`, "Signals"]} />
                <Bar dataKey="value" radius={[0, 7, 7, 0]} barSize={18} animationDuration={800}>{categoryData.map((item) => <Cell key={item.key} fill={item.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="admin-card admin-chart-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">02 · Momentum</span><h3>Feedback volume over time</h3></div><Activity size={17} /></div>
          <div className="admin-chart admin-chart-tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ left: -18, right: 8, top: 12, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="rgba(35,88,77,.1)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="responses" stroke="#286c60" strokeWidth={2.5} dot={{ r: 3, fill: "#fbf9f2", stroke: "#286c60", strokeWidth: 2 }} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <div className="admin-grid admin-grid-three">
        <section className="admin-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">03 · Recurrence</span><h3>Top recurring issues</h3></div><ListFilter size={17} /></div>
          <div className="issue-rank-list">{issueCounts.map(([issue, count], index) => <div className="issue-rank" key={issue}><span>0{index + 1}</span><strong>{issue}</strong><em>{count} signals</em></div>)}</div>
        </section>
        <section className="admin-card admin-card-wide">
          <div className="admin-card-head"><div><span className="admin-card-kicker">04 · Listening post</span><h3>Recent student feedback</h3></div><Link href="/admin/feedback" className="admin-text-link">View all <ArrowRight size={13} /></Link></div>
          <div className="recent-feedback-list">{feedback.slice(0, 3).map((item) => <Link href="/admin/feedback" className="recent-feedback" key={item.id}><span className="recent-feedback-icon"><MessageSquareText size={15} /></span><span><strong>{item.message}</strong><small>{item.category} · {item.location}</small></span><span className={statusClass(item.status)}>{item.status}</span></Link>)}</div>
        </section>
      </div>
      <div className="admin-grid admin-grid-two">
        <section className="admin-card ai-admin-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">05 · AI-assisted pattern</span><h3>One clear next step</h3></div><span className="admin-new-pill"><Sparkles size={12} /> NEW INSIGHT</span></div>
          <p className="admin-insight-quote">“Hostel maintenance is emerging as a high-priority recurring issue.”</p>
          <div className="admin-insight-meta"><span>Reports <b>{feedback.filter((item) => item.category === "Hostel").length}</b></span><span>Avg rating <b>2.8 / 5</b></span><span>Priority <b className="high-text">HIGH</b></span></div>
          <div className="admin-recommendation"><Target size={16} /><span><small>Recommended department</small><strong>Hostel Operations</strong></span><ArrowRight size={15} /></div>
        </section>
        <section className="admin-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">06 · Ownership</span><h3>Actions in progress</h3></div><Link href="/admin/actions" className="admin-text-link">Manage <ArrowRight size={13} /></Link></div>
          <div className="action-mini-list">{actions.filter((item) => item.status !== "Measured").slice(0, 3).map((item) => <div className="action-mini" key={item.id}><span className={`action-progress ${item.status.toLowerCase().replaceAll(" ", "-")}`} /><span><strong>{item.issue}</strong><small>{item.department}</small></span><span className={priorityClass(item.priority)}>{item.priority}</span></div>)}</div>
        </section>
      </div>
      <section className="admin-you-said">
        <div className="admin-you-said-copy"><span className="admin-card-kicker">07 · The emotional proof</span><h3>You said.<br /><em>We did.</em></h3><p>Visible follow-through turns a feedback tool into a relationship with students.</p></div>
        <div className="admin-story-row"><div><small>YOU SAID</small><strong>{primaryAction?.issue === "Hostel maintenance" ? "Hostel bathrooms need better maintenance." : "Students shared what campus life needs next."}</strong></div><ArrowRight size={18} /><div><small>WE DID</small><strong>{primaryAction ? "Cleaning frequency increased." : "A team is ready to own the next step."}</strong></div><ArrowRight size={18} /><div><small>RESULT</small><strong>{primaryAction?.status === "Measured" ? "Student satisfaction improved." : "Impact is being measured."}</strong></div></div>
      </section>
    </div>
  );
}

function CategoryPage({ category, feedback, actions }: { category: CategoryKey; feedback: Feedback[]; actions: Action[] }) {
  const meta = categoryMeta[category];
  const Icon = meta.icon;
  const scoped = feedback.filter((item) => item.category === meta.value);
  const scopedIds = new Set(scoped.map((item) => item.id));
  const scopedActions = actions.filter((item) => scopedIds.has(item.feedbackId));
  const average = scoped.length ? scoped.reduce((sum, item) => sum + item.rating, 0) / scoped.length : 0;
  const lowRatings = scoped.filter((item) => item.rating <= 2).length;
  const issue = Object.entries(scoped.reduce<Record<string, number>>((acc, item) => { acc[item.issue] = (acc[item.issue] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No recurring issue yet";
  const trend = scoped.slice(0, 6).reverse().map((item, index) => ({ label: formatDate(item.createdAt), rating: item.rating, volume: index + 1 }));
  const issueData = Object.entries(scoped.reduce<Record<string, number>>((acc, item) => { acc[item.issue] = (acc[item.issue] ?? 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));

  return (
    <div className="admin-page">
      <div className="category-hero" style={{ "--category-tint": meta.tint } as React.CSSProperties}><div className="category-hero-icon"><Icon size={21} /></div><div><div className="eyebrow">Category intelligence</div><h2>{meta.label}</h2><p>What student signals are saying about {meta.label.toLowerCase()} this term.</p></div><span className="category-hero-tag"><Radio size={12} /> Live from feedback</span></div>
      <div className="admin-stat-grid">
        <AdminStat label="Total responses" value={scoped.length} detail="Student signals in this category" icon={MessageSquareText} />
        <AdminStat label="Average satisfaction" value={`${average.toFixed(1)} / 5`} detail="Across all ratings" icon={HeartPulse} accent="coral" />
        <AdminStat label="Low rating responses" value={lowRatings} detail="Ratings of 1 or 2" icon={Target} accent="gold" />
        <AdminStat label="Top issue" value={issue} detail={`${scopedActions.length} open actions`} icon={ClipboardCheck} accent="blue" />
      </div>
      <div className="admin-grid admin-grid-two">
        <section className="admin-card admin-chart-card"><div className="admin-card-head"><div><span className="admin-card-kicker">01 · Trend</span><h3>Satisfaction trend</h3></div><HeartPulse size={17} /></div><div className="admin-chart admin-chart-tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -20, right: 8, top: 12, bottom: 4 }}><CartesianGrid vertical={false} stroke="rgba(35,88,77,.1)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} / 5`, "Rating"]} /><Line type="monotone" dataKey="rating" stroke={meta.tint} strokeWidth={2.6} dot={{ r: 3, fill: "#fbf9f2", stroke: meta.tint, strokeWidth: 2 }} animationDuration={700} /></LineChart></ResponsiveContainer></div></section>
        <section className="admin-card admin-chart-card"><div className="admin-card-head"><div><span className="admin-card-kicker">02 · Shape of the issue</span><h3>Issue distribution</h3></div><BarChart3 size={17} /></div><div className="admin-chart admin-chart-tall"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={issueData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={4} stroke="none" animationDuration={800}>{issueData.map((item, index) => <Cell key={item.name} fill={[meta.tint, "#286c60", "#d9b174", "#9c9c91"][index % 4]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div><div className="admin-legend">{issueData.map((item, index) => <span key={item.name}><i style={{ background: [meta.tint, "#286c60", "#d9b174", "#9c9c91"][index % 4] }} />{item.name} · {item.value}</span>)}</div></section>
      </div>
      <div className="admin-grid admin-grid-two">
        <section className="admin-card admin-chart-card"><div className="admin-card-head"><div><span className="admin-card-kicker">03 · Participation</span><h3>Feedback volume</h3></div><Activity size={17} /></div><div className="admin-chart admin-chart-short"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ left: -20, right: 8, top: 12, bottom: 4 }}><CartesianGrid vertical={false} stroke="rgba(35,88,77,.1)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="volume" fill={meta.tint} radius={[6, 6, 0, 0]} animationDuration={700} /></BarChart></ResponsiveContainer></div></section>
        <section className="admin-card ai-admin-card"><div className="admin-card-head"><div><span className="admin-card-kicker">04 · AI insight</span><h3>Pattern detected</h3></div><span className="admin-new-pill"><Sparkles size={12} /> PRIORITY</span></div><p className="admin-insight-quote">{category === "hostel" ? "“Hostel maintenance is a recurring issue.”" : `“${meta.label} is the next place to focus listening and action.”`}</p><div className="admin-recommendation"><Target size={16} /><span><small>Recommended department</small><strong>{meta.department}</strong></span><span className="admin-priority high">HIGH</span></div></section>
      </div>
      <section className="admin-card"><div className="admin-card-head"><div><span className="admin-card-kicker">05 · Listening post</span><h3>Recent feedback</h3></div><Link href="/admin/feedback" className="admin-text-link">Open full inbox <ArrowRight size={13} /></Link></div><FeedbackTable feedback={scoped} compact /></section>
      <section className="admin-card"><div className="admin-card-head"><div><span className="admin-card-kicker">06 · Ownership</span><h3>Open actions</h3></div><Link href="/admin/actions" className="admin-text-link">Manage actions <ArrowRight size={13} /></Link></div><div className="action-grid">{scopedActions.length ? scopedActions.map((item) => <ActionRow key={item.id} action={item} />) : <div className="admin-empty">No action has been created for this category yet.</div>}</div></section>
    </div>
  );
}

function FeedbackTable({ feedback, compact = false, onSelect }: { feedback: Feedback[]; compact?: boolean; onSelect?: (feedback: Feedback) => void }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table"><thead><tr><th>Student feedback</th><th>Category</th><th>Rating</th><th>Issue</th><th>Date</th><th>Status</th></tr></thead><tbody>{(compact ? feedback.slice(0, 4) : feedback).map((item) => <tr key={item.id} onClick={() => onSelect?.(item)} className={onSelect ? "clickable" : ""}><td><strong>{item.message}</strong><small>{item.location}</small></td><td>{item.category}</td><td><span className="rating-chip">{item.rating}.0</span></td><td>{item.issue}</td><td>{formatDate(item.createdAt)}</td><td><span className={statusClass(item.status)}>{item.status}</span></td></tr>)}</tbody></table>
      {!feedback.length && <div className="admin-empty">No feedback matches these filters.</div>}
    </div>
  );
}

function FeedbackPage({ feedback }: { feedback: Feedback[] }) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const filtered = feedback.filter((item) => (categoryFilter === "All" || item.category === categoryFilter) && (ratingFilter === "All" || item.rating === Number(ratingFilter)) && (statusFilter === "All" || item.status === statusFilter));
  const categories = [...new Set(feedback.map((item) => item.category))];
  return (
    <div className="admin-page">
      <SectionHeading eyebrow="Signal inbox" title="Every student voice, in context." copy="Filter the signals, open a full detail view, and turn a recurring issue into owned action." action={<div className="admin-filter-bar"><Filter size={14} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}><option>All</option>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} stars</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></div>} />
      <section className="admin-card"><div className="admin-card-head"><div><span className="admin-card-kicker">Feedback management</span><h3>{filtered.length} matching signals</h3></div><span className="admin-search-hint"><Search size={14} /> Click any row to inspect</span></div><FeedbackTable feedback={filtered} onSelect={setSelected} /></section>
      <AnimatePresence>{selected && <motion.div className="admin-detail-drawer" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}><div className="admin-drawer-head"><div><span className="admin-card-kicker">Feedback detail #{selected.id}</span><h3>Student signal</h3></div><button className="icon-btn" onClick={() => setSelected(null)} aria-label="Close detail"><X size={17} /></button></div><div className="admin-detail-quote">“{selected.message}”</div><div className="admin-detail-grid"><span><small>Category</small><b>{selected.category}</b></span><span><small>Issue</small><b>{selected.issue}</b></span><span><small>Rating</small><b>{selected.rating} / 5</b></span><span><small>Location</small><b><MapPin size={13} /> {selected.location}</b></span><span><small>Received</small><b>{formatDate(selected.createdAt)}</b></span><span><small>Status</small><b className={statusClass(selected.status)}>{selected.status}</b></span></div><Link href="/admin/actions" className="primary-btn admin-drawer-action" onClick={() => setSelected(null)}>Create an action <ArrowRight size={14} /></Link></motion.div>}</AnimatePresence>
    </div>
  );
}

function ActionRow({ action, onStatusChange }: { action: Action; onStatusChange?: (status: ActionStatus) => void }) {
  return <div className="action-row"><span className={`action-progress ${action.status.toLowerCase().replaceAll(" ", "-")}`} /><div className="action-row-copy"><strong>{action.issue}</strong><small>{action.department} · created {formatDate(action.createdAt)}</small></div><span className={priorityClass(action.priority)}>{action.priority}</span>{onStatusChange ? <select value={action.status} onChange={(event) => onStatusChange(event.target.value as ActionStatus)} className="status-select">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select> : <span className={statusClass(action.status)}>{action.status}</span>}</div>;
}

function ActionsPage({ feedback, actions }: { feedback: Feedback[]; actions: Action[] }) {
  const queryClient = useQueryClient();
  const createAction = useCreateAction({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListActionsQueryKey() }) } });
  const updateAction = useUpdateAction({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListActionsQueryKey() }) } });
  const [form, setForm] = useState({ feedbackId: feedback[0]?.id?.toString() ?? "", issue: feedback[0]?.issue ?? "", department: "Hostel Operations", priority: "High" as ActionPriority });
  const selectedFeedback = feedback.find((item) => item.id === Number(form.feedbackId));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.feedbackId || !form.issue.trim() || !form.department.trim()) return;
    createAction.mutate({ data: { feedbackId: Number(form.feedbackId), issue: form.issue, department: form.department, priority: form.priority } });
  };
  return (
    <div className="admin-page">
      <SectionHeading eyebrow="Operational ownership" title="Move a signal into action." copy="Create accountable work from the issues students are already telling you about. Every status change is persisted." />
      <div className="admin-grid admin-grid-two action-layout">
        <section className="admin-card action-create-card"><div className="admin-card-head"><div><span className="admin-card-kicker">New action</span><h3>Create from a student issue</h3></div><Plus size={17} /></div><form onSubmit={submit} className="admin-form"><label>Issue<select value={form.feedbackId} onChange={(event) => { const next = feedback.find((item) => item.id === Number(event.target.value)); setForm({ ...form, feedbackId: event.target.value, issue: next?.issue ?? "" }); }}>{feedback.map((item) => <option key={item.id} value={item.id}>{item.issue} · {item.category}</option>)}</select></label><label>Department<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as ActionPriority })}>{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></label><div className="admin-form-context"><MessageSquareText size={15} /><span>{selectedFeedback?.message ?? "Choose a student issue to see its context."}</span></div><button className="primary-btn" type="submit" disabled={createAction.isPending}>{createAction.isPending ? "Creating…" : "Create action"} <Send size={14} /></button></form></section>
        <section className="admin-card"><div className="admin-card-head"><div><span className="admin-card-kicker">Status pipeline</span><h3>Actions in progress</h3></div><span className="admin-live"><span /> Synced</span></div><div className="action-grid">{actions.length ? actions.map((item) => <ActionRow key={item.id} action={item} onStatusChange={(status) => updateAction.mutate({ id: item.id, data: { status } })} />) : <div className="admin-empty">Create the first action from a student issue.</div>}</div></section>
      </div>
      <div className="admin-status-rail">{statusOptions.map((status, index) => <div key={status} className="admin-status-step"><span>{index + 1}</span><strong>{status}</strong>{index < statusOptions.length - 1 && <ArrowRight size={14} />}</div>)}</div>
    </div>
  );
}

function ImpactPage({ actions, feedback }: { actions: Action[]; feedback: Feedback[] }) {
  const queryClient = useQueryClient();
  const updateAction = useUpdateAction({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListActionsQueryKey() }) } });
  const action = actions.find((item) => item.issue === "Hostel maintenance") ?? actions[0];
  const linkedFeedback = feedback.find((item) => item.id === action?.feedbackId);
  const activeIndex = action ? statusOptions.indexOf(action.status) : 0;
  const flow = [{ label: "Student feedback", caption: linkedFeedback?.message ?? "A student signal enters the loop." }, { label: "Pattern detected", caption: linkedFeedback?.issue ?? "A recurring issue becomes visible." }, { label: "Priority", caption: action?.priority ?? "High" }, { label: "Department", caption: action?.department ?? "An owner is assigned." }, { label: "Action", caption: action?.status ?? "New" }, { label: "Measurement", caption: activeIndex >= 3 ? "Impact measured" : "Watching the change" }, { label: "Impact", caption: activeIndex >= 3 ? "Satisfaction improved" : "The loop is still moving" }];
  return (
    <div className="admin-page">
      <SectionHeading eyebrow="Close the loop" title="Make progress visible." copy="Track the entire journey from the moment a student speaks to the moment campus life changes." action={<span className="admin-impact-badge"><ShieldCheck size={14} /> Trust is built in the open</span>} />
      <section className="admin-card impact-flow-card"><div className="admin-card-head"><div><span className="admin-card-kicker">Impact loop</span><h3>Student signal → measurable change</h3></div>{action && <span className={statusClass(action.status)}>{action.status}</span>}</div><div className="impact-admin-flow">{flow.map((step, index) => <motion.div className={`impact-admin-step ${index <= activeIndex + 1 ? "passed" : ""} ${index === activeIndex + 4 ? "current" : ""}`} key={step.label} animate={{ y: index === activeIndex + 4 ? -5 : 0 }}><div className="impact-admin-node">{index < activeIndex + 4 ? <Check size={15} /> : <span>{index + 1}</span>}</div><strong>{step.label}</strong><small>{step.caption}</small>{index < flow.length - 1 && <i />}</motion.div>)}</div><div className="admin-flow-controls">{statusOptions.map((status) => <button key={status} className={`status-btn ${action?.status === status ? "active" : ""}`} onClick={() => action && updateAction.mutate({ id: action.id, data: { status } })}>{action?.status === status && <Check size={12} />}{status}</button>)}</div></section>
      <section className="admin-you-said impact-story-admin"><div className="admin-you-said-copy"><span className="admin-card-kicker">The proof point</span><h3>You said.<br /><em>We did.</em></h3><p>One real story is more powerful than a hundred promises.</p></div><div className="admin-story-row"><div><small>YOU SAID</small><strong>Hostel bathrooms need better maintenance.</strong></div><ArrowRight size={18} /><div><small>WE DID</small><strong>Cleaning frequency increased.</strong></div><ArrowRight size={18} /><div><small>RESULT</small><strong>{activeIndex >= 3 ? "Student satisfaction improved." : "2.9 / 5 → 3.6 / 5"}</strong></div></div></section>
      <section className="admin-card admin-chart-card"><div className="admin-card-head"><div><span className="admin-card-kicker">Measurement</span><h3>Before / after impact</h3></div><BarChart3 size={17} /></div><div className="admin-chart impact-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ label: "Before", score: 2.9 }, { label: "After", score: activeIndex >= 3 ? 3.6 : 3.3 }]} margin={{ left: -16, right: 12, top: 12, bottom: 4 }}><CartesianGrid vertical={false} stroke="rgba(35,88,77,.1)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: "#708078", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} / 5`, "Satisfaction"]} /><Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={76} animationDuration={700}><Cell fill="#d9b174" /><Cell fill="#286c60" /></Bar></BarChart></ResponsiveContainer></div></section>
    </div>
  );
}

export default function AdminApp({ section = "overview" }: { section?: string }) {
  const [location] = useLocation();
  const feedbackQuery = useListFeedback({ query: { queryKey: getListFeedbackQueryKey(), refetchOnWindowFocus: false } });
  const actionsQuery = useListActions({ query: { queryKey: getListActionsQueryKey(), refetchOnWindowFocus: false } });
  const feedback = feedbackQuery.data ?? [];
  const actions = actionsQuery.data ?? [];
  const category = categoryMeta[section as CategoryKey] ? section as CategoryKey : "hostel";
  const page = section === "feedback" ? <FeedbackPage feedback={feedback} /> : section === "actions" ? <ActionsPage feedback={feedback} actions={actions} /> : section === "impact" ? <ImpactPage actions={actions} feedback={feedback} /> : categoryMeta[section as CategoryKey] ? <CategoryPage category={category} feedback={feedback} actions={actions} /> : <OverviewPage feedback={feedback} actions={actions} />;

  return (
    <div className="admin-shell">
      <AdminSidebar section={section} />
      <div className="admin-workspace">
        <AdminHeader section={section} feedbackCount={feedback.length} />
        <main className="admin-content">
          <AnimatePresence mode="wait"><motion.div key={`${location}-${section}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22 }}>{page}</motion.div></AnimatePresence>
        </main>
      </div>
    </div>
  );
}