# 1-Month DevOps → Platform Engineering Learning Plan

**Focus:** Phase 1 (GitOps, Secrets, Ingress/TLS) + start of Observability
**Budget:** ~20 focused hours/week (~2h weekday evenings + bigger weekend blocks)
**Goal:** One strong, interview-ready capstone — a **Production GitOps Platform** —
plus deep hands-on with the highest-priority tools from your roadmap.

> **How this maps to the planner:** the app now holds the full month — all four
> weeks are loaded into your account (`rafay@planner.local`). The **Dashboard**
> automatically shows whichever week matches today's date (anchored to Mon
> **Aug 31, 2026**), and the **Calendar** page shows the entire month at once.
> No manual swapping needed — just check tasks off each day. Edit any week's tasks
> in **Settings** using the Week 1–4 selector.

Category legend: `learn` = study/reading · `fyp` = labs & project build · `job` =
applications/interview prep · `rest` = recovery.

---

## Week 1 — GitOps with ArgoCD ⭐ (loaded)

| Day | Time | Task | Category |
| --- | ---- | ---- | -------- |
| Mon | 20:00–20:15 | Week kickoff: set goals for ArgoCD week | learn |
| Mon | 20:15–22:00 | ArgoCD: GitOps concepts + install on kind | learn |
| Tue | 20:00–22:00 | ArgoCD: Applications, auto-sync, self-heal | learn |
| Wed | 20:00–22:00 | Lab: deploy a Flask app from Git via ArgoCD | fyp |
| Thu | 20:00–22:00 | Lab: deploy React app + practice rollbacks | fyp |
| Fri | 20:00–21:00 | Argo Workflows: intro (ML/data pipelines) | learn |
| Fri | 21:00–22:00 | Apply to 2 DevOps/Platform roles | job |
| Sat | 10:00–13:00 | Project: GitHub → ArgoCD multi-app auto-sync | fyp |
| Sat | 15:00–17:00 | Write notes + push project to portfolio repo | learn |
| Sun | 10:00–12:00 | Read: app-of-apps + ArgoCD best practices | learn |
| Sun | 16:00–17:00 | Weekly review + plan Week 2 (Vault) | learn |
| Sun | 20:00–22:00 | Rest & recharge | rest |

**Deliverable:** GitHub repo where a push auto-deploys a Flask + React app to
Kubernetes via ArgoCD, with a demonstrated rollback.

---

## Week 2 — Secrets: Vault + External Secrets Operator ⭐

| Day | Time | Task | Category |
| --- | ---- | ---- | -------- |
| Mon | 20:00–20:15 | Week kickoff: goals for the secrets week | learn |
| Mon | 20:15–22:00 | Vault: install + KV v2 secret engine | learn |
| Tue | 20:00–22:00 | Vault: policies, tokens, auth methods | learn |
| Wed | 20:00–22:00 | Vault: Kubernetes auth method | fyp |
| Thu | 20:00–22:00 | Vault: dynamic secrets (short-lived DB creds) | fyp |
| Fri | 20:00–21:00 | External Secrets Operator: install + concepts | learn |
| Fri | 21:00–22:00 | Apply to 2 roles + tidy CV | job |
| Sat | 10:00–13:00 | Project: Vault → ESO → K8s Secret → Pod (end to end) | fyp |
| Sat | 15:00–17:00 | Notes + push, replace hardcoded secrets in Wk1 app | fyp |
| Sun | 10:00–12:00 | Read: Vault production hardening + ESO patterns | learn |
| Sun | 16:00–17:00 | Weekly review + plan Week 3 (Ingress) | learn |
| Sun | 20:00–22:00 | Rest & recharge | rest |

**Deliverable:** No plaintext secrets anywhere — Vault issues them, ESO syncs them
into your Week 1 app automatically.

---

## Week 3 — Ingress, TLS & Kustomize ⭐

| Day | Time | Task | Category |
| --- | ---- | ---- | -------- |
| Mon | 20:00–20:15 | Week kickoff: goals for ingress/TLS week | learn |
| Mon | 20:15–22:00 | NGINX Ingress: install + host/path routing | learn |
| Tue | 20:00–22:00 | Ingress: TLS termination + load balancing | learn |
| Wed | 20:00–22:00 | Cert-Manager: install + ClusterIssuer (LE staging) | fyp |
| Thu | 20:00–22:00 | Cert-Manager: real cert + auto-renew on Ingress | fyp |
| Fri | 20:00–21:00 | Kustomize: bases/overlays; Helm + Kustomize combo | learn |
| Fri | 21:00–22:00 | Apply to 2 roles + mock interview question | job |
| Sat | 10:00–13:00 | Project: HTTPS app behind Ingress w/ auto TLS | fyp |
| Sat | 15:00–17:00 | Kustomize dev/prod overlays + GitOps it via ArgoCD | fyp |
| Sun | 10:00–12:00 | Read: ingress-nginx tuning + cert-manager troubleshooting | learn |
| Sun | 16:00–17:00 | Weekly review + plan Week 4 (Observability) | learn |
| Sun | 20:00–22:00 | Rest & recharge | rest |

**Deliverable:** Your app served over HTTPS with a Let's Encrypt cert that
auto-renews, deployed through ArgoCD using Kustomize overlays.

---

## Week 4 — Observability + Capstone ⭐

| Day | Time | Task | Category |
| --- | ---- | ---- | -------- |
| Mon | 20:00–20:15 | Week kickoff: capstone scope | learn |
| Mon | 20:15–22:00 | Loki + Promtail: log pipeline into Grafana | learn |
| Tue | 20:00–22:00 | OpenTelemetry: concepts + Collector setup | learn |
| Wed | 20:00–22:00 | OTel: instrument app (traces + metrics) → Tempo | fyp |
| Thu | 20:00–22:00 | Tempo/Jaeger: view traces + build Grafana dashboards | fyp |
| Fri | 20:00–21:00 | Capstone planning + wire Prometheus/Grafana/Loki | learn |
| Fri | 21:00–22:00 | Apply to 2 roles + update portfolio site | job |
| Sat | 10:00–14:00 | **CAPSTONE**: assemble the Production GitOps Platform | fyp |
| Sat | 15:00–17:00 | Capstone: add Vault/ESO + full observability | fyp |
| Sun | 10:00–13:00 | Capstone polish: README, architecture diagram, demo GIF | fyp |
| Sun | 16:00–17:00 | Write LinkedIn/portfolio post + apply to 3 roles | job |
| Sun | 20:00–22:00 | Rest & recharge | rest |

**Capstone deliverable — "Production GitOps Platform":**
`GitHub → ArgoCD → Kubernetes → Helm/Kustomize → NGINX Ingress → Cert-Manager
(HTTPS) → Vault + External Secrets → Prometheus / Grafana / Loki / OpenTelemetry`.
One repo, one `README`, one architecture diagram, one demo GIF. This single project
covers your roadmap's "Production GitOps Platform" **and** "Secure Kubernetes
Platform" ideas at once.

---

## After this month (next in your roadmap order)

Istio/Linkerd → Cilium (eBPF) → Falco/Kyverno/Cosign (DevSecOps) → Backstage /
Crossplane (Platform) → then your MLOps target: MLflow → DVC → Kubeflow → KServe →
Ray → Airflow. Reuse this same 4-week template structure for each phase.

## Weekly ritual (keep every week)

1. **Daily:** open the **Dashboard** (it auto-shows the current week) and check off
   blocks; watch the progress bar. Use the **Calendar** to see the whole month.
2. **Sun:** do the weekly review; commit notes + the week's project to a public repo.
3. Tweak any week's tasks anytime in **Settings** (Week 1–4 selector).
