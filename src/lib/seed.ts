import type { Category, DayOfWeek } from './types';

interface SeedTask {
  week: number; // 1..4 plan week
  day: DayOfWeek;
  time: string;
  label: string;
  category: Category;
}

/**
 * The full 1-month DevOps → Platform learning plan (4 weeks), ~20 focused
 * hours/week. A new account starts with all four weeks loaded; the dashboard
 * shows whichever week matches the current date, and the Calendar page shows
 * the whole month.
 *
 * Category mapping: learn = study/reading · fyp = labs & project build ·
 * job = applications/interview prep · rest = recovery.
 */
const PLAN: SeedTask[] = [
  // ---------- Week 1 — GitOps with ArgoCD ----------
  { week: 1, day: 'Mon', time: '20:00–20:15', label: 'Week kickoff: set goals for ArgoCD week', category: 'learn' },
  { week: 1, day: 'Mon', time: '20:15–22:00', label: 'ArgoCD: GitOps concepts + install on kind', category: 'learn' },
  { week: 1, day: 'Tue', time: '20:00–22:00', label: 'ArgoCD: Applications, auto-sync, self-heal', category: 'learn' },
  { week: 1, day: 'Wed', time: '20:00–22:00', label: 'Lab: deploy a Flask app from Git via ArgoCD', category: 'fyp' },
  { week: 1, day: 'Thu', time: '20:00–22:00', label: 'Lab: deploy React app + practice rollbacks', category: 'fyp' },
  { week: 1, day: 'Fri', time: '20:00–21:00', label: 'Argo Workflows: intro (ML/data pipelines)', category: 'learn' },
  { week: 1, day: 'Fri', time: '21:00–22:00', label: 'Apply to 2 DevOps/Platform roles', category: 'job' },
  { week: 1, day: 'Sat', time: '10:00–13:00', label: 'Project: GitHub → ArgoCD multi-app auto-sync', category: 'fyp' },
  { week: 1, day: 'Sat', time: '15:00–17:00', label: 'Write notes + push project to portfolio repo', category: 'learn' },
  { week: 1, day: 'Sun', time: '10:00–12:00', label: 'Read: app-of-apps + ArgoCD best practices', category: 'learn' },
  { week: 1, day: 'Sun', time: '16:00–17:00', label: 'Weekly review + plan Week 2 (Vault)', category: 'learn' },
  { week: 1, day: 'Sun', time: '20:00–22:00', label: 'Rest & recharge', category: 'rest' },

  // ---------- Week 2 — Secrets: Vault + External Secrets ----------
  { week: 2, day: 'Mon', time: '20:00–20:15', label: 'Week kickoff: goals for the secrets week', category: 'learn' },
  { week: 2, day: 'Mon', time: '20:15–22:00', label: 'Vault: install + KV v2 secret engine', category: 'learn' },
  { week: 2, day: 'Tue', time: '20:00–22:00', label: 'Vault: policies, tokens, auth methods', category: 'learn' },
  { week: 2, day: 'Wed', time: '20:00–22:00', label: 'Vault: Kubernetes auth method', category: 'fyp' },
  { week: 2, day: 'Thu', time: '20:00–22:00', label: 'Vault: dynamic secrets (short-lived DB creds)', category: 'fyp' },
  { week: 2, day: 'Fri', time: '20:00–21:00', label: 'External Secrets Operator: install + concepts', category: 'learn' },
  { week: 2, day: 'Fri', time: '21:00–22:00', label: 'Apply to 2 roles + tidy CV', category: 'job' },
  { week: 2, day: 'Sat', time: '10:00–13:00', label: 'Project: Vault → ESO → K8s Secret → Pod', category: 'fyp' },
  { week: 2, day: 'Sat', time: '15:00–17:00', label: 'Replace hardcoded secrets in the Week 1 app', category: 'fyp' },
  { week: 2, day: 'Sun', time: '10:00–12:00', label: 'Read: Vault production hardening + ESO patterns', category: 'learn' },
  { week: 2, day: 'Sun', time: '16:00–17:00', label: 'Weekly review + plan Week 3 (Ingress)', category: 'learn' },
  { week: 2, day: 'Sun', time: '20:00–22:00', label: 'Rest & recharge', category: 'rest' },

  // ---------- Week 3 — Ingress, TLS & Kustomize ----------
  { week: 3, day: 'Mon', time: '20:00–20:15', label: 'Week kickoff: goals for ingress/TLS week', category: 'learn' },
  { week: 3, day: 'Mon', time: '20:15–22:00', label: 'NGINX Ingress: install + host/path routing', category: 'learn' },
  { week: 3, day: 'Tue', time: '20:00–22:00', label: 'Ingress: TLS termination + load balancing', category: 'learn' },
  { week: 3, day: 'Wed', time: '20:00–22:00', label: 'Cert-Manager: install + ClusterIssuer (LE staging)', category: 'fyp' },
  { week: 3, day: 'Thu', time: '20:00–22:00', label: 'Cert-Manager: real cert + auto-renew on Ingress', category: 'fyp' },
  { week: 3, day: 'Fri', time: '20:00–21:00', label: 'Kustomize: bases/overlays; Helm + Kustomize', category: 'learn' },
  { week: 3, day: 'Fri', time: '21:00–22:00', label: 'Apply to 2 roles + mock interview question', category: 'job' },
  { week: 3, day: 'Sat', time: '10:00–13:00', label: 'Project: HTTPS app behind Ingress with auto TLS', category: 'fyp' },
  { week: 3, day: 'Sat', time: '15:00–17:00', label: 'Kustomize dev/prod overlays + GitOps via ArgoCD', category: 'fyp' },
  { week: 3, day: 'Sun', time: '10:00–12:00', label: 'Read: ingress-nginx tuning + cert-manager tips', category: 'learn' },
  { week: 3, day: 'Sun', time: '16:00–17:00', label: 'Weekly review + plan Week 4 (Observability)', category: 'learn' },
  { week: 3, day: 'Sun', time: '20:00–22:00', label: 'Rest & recharge', category: 'rest' },

  // ---------- Week 4 — Observability + Capstone ----------
  { week: 4, day: 'Mon', time: '20:00–20:15', label: 'Week kickoff: capstone scope', category: 'learn' },
  { week: 4, day: 'Mon', time: '20:15–22:00', label: 'Loki + Promtail: log pipeline into Grafana', category: 'learn' },
  { week: 4, day: 'Tue', time: '20:00–22:00', label: 'OpenTelemetry: concepts + Collector setup', category: 'learn' },
  { week: 4, day: 'Wed', time: '20:00–22:00', label: 'OTel: instrument app (traces + metrics) → Tempo', category: 'fyp' },
  { week: 4, day: 'Thu', time: '20:00–22:00', label: 'Tempo/Jaeger: view traces + Grafana dashboards', category: 'fyp' },
  { week: 4, day: 'Fri', time: '20:00–21:00', label: 'Capstone planning + wire Prometheus/Grafana/Loki', category: 'learn' },
  { week: 4, day: 'Fri', time: '21:00–22:00', label: 'Apply to 2 roles + update portfolio site', category: 'job' },
  { week: 4, day: 'Sat', time: '10:00–14:00', label: 'CAPSTONE: assemble the Production GitOps Platform', category: 'fyp' },
  { week: 4, day: 'Sat', time: '15:00–17:00', label: 'Capstone: add Vault/ESO + full observability', category: 'fyp' },
  { week: 4, day: 'Sun', time: '10:00–13:00', label: 'Capstone polish: README, diagram, demo GIF', category: 'fyp' },
  { week: 4, day: 'Sun', time: '16:00–17:00', label: 'Write portfolio post + apply to 3 roles', category: 'job' },
  { week: 4, day: 'Sun', time: '20:00–22:00', label: 'Rest & recharge', category: 'rest' },
];

/** Inserts the full 4-week plan for a freshly created user, in one batch. */
export async function seedTemplatesForUser(
  db: D1Database,
  userId: string
): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO weekly_templates (id, user_id, day_of_week, time_block, label, category, sort_order, plan_week)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const sortKey: Record<string, number> = {};
  const batch = PLAN.map((t) => {
    const key = `${t.week}:${t.day}`;
    const order = sortKey[key] ?? 0;
    sortKey[key] = order + 1;
    return stmt.bind(
      crypto.randomUUID(),
      userId,
      t.day,
      t.time,
      t.label,
      t.category,
      order,
      t.week
    );
  });

  await db.batch(batch);
}
