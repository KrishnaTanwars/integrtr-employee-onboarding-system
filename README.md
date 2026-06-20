# INTEGRTR × GLA Hackathon 2026

**Team 09** · Repository: `gla_hackathon_2026_team_09`

## Team Members

| # | Roll No | Name | Email |
| --- | --- | --- | --- |
| 1 | 2315000806 | Durgesh Kumar Gupta | durgesh.gupta_cs23@gla.ac.in |
| 2 | 2315001013 | Jatin Agrawal | jatin.agrawal_cs23@gla.ac.in |
| 3 | 2315001219 | Kunal Sharma | kunal.sharma_cs23@gla.ac.in |
| 4 | 2315001763 | Rahul Pundhir | rahul.pundhir_cs23@gla.ac.in |
| 5 | 2315000714 | Dev Singh | dev.singh_cs23@gla.ac.in |
| 6 | 2315002475 | Vishal | vishal.gla5_cs23@gla.ac.in |
| 7 | 2315800034 | Harshit Rathi | harshit.rathi2_cs.h23@gla.ac.in |
| 8 | 2315002345 | Upendra Babu Chaturvedi | upendra.chaturvedi_cs23@gla.ac.in |
| 9 | 2315510103 | Krishna | krishna.gla_cs.aiml23@gla.ac.in |

---

## 🎯 Hackathon Track

### Track 1: Employee Onboarding Flow with SuccessFactors, Custom DB, and Slack

**Problem.** Onboarding a new hire is never a single action. The record must land in the HR system of record (SuccessFactors), app-specific state must be stored somewhere SF does not track, and the right people must be notified: the new colleague's team and the HR group. Today this is stitched together manually or through brittle scripts. When one step fails, the others have often already happened, leaving inconsistent state spread across three systems with no clean way to recover.

**The challenge.** Build an app with a **custom UI** that runs a complete new-hire onboarding flow end to end:

1. An operator enters the new employee's details through a UI you design.
2. On submit, the app **creates the employee in SAP SuccessFactors** (Employee Central).
3. The app **persists onboarding state in a database of your choice** (see required fields below).
4. The app **sends two Slack notifications**:
   - A **welcome message** to the **team channel**, introducing the new colleague.
   - An **HR-team notification** to the **HR channel**, confirming the new hire is onboarded and including a **working deep link to that employee's record in SuccessFactors**.

**What we actually care about (where the points are).** The UI is graded, but the differentiator is **correctness of the cross-system flow when something fails partway**. Three independent systems are written in sequence. Any one can fail. A submission that only works on the happy path is the baseline, not the win. We want to see what your app does when SF succeeds but Slack fails, when the DB write fails after SF already committed, or when the same employee is submitted twice.

**Why the custom database exists (so the requirement is not arbitrary).** SuccessFactors is the system of record for the employee, but it does not track *the onboarding process itself*. Your database owns that: onboarding status, who initiated it, when, and whether each downstream step (SF write, team Slack, HR Slack) succeeded. This is also your recovery ledger. It is what lets you detect a half-finished onboarding and avoid creating duplicates or orphans on retry.

**Required DB fields (minimum):**

- A unique onboarding/request ID
- Reference to the created SF employee (the SF ID, once known)
- Status of each step: sf_write, team_slack, hr_slack (e.g. pending / success / failed)
- Initiated-by and timestamp

**Required failure handling (this is scored, see judging).** At minimum your app must:

- **Not create duplicate or orphaned records** if the flow is retried or the same submission is sent twice (idempotency on the onboarding request).
- **Record per-step status** in the DB so the system always knows what succeeded.
- **Surface a clear error state** to the operator when a step fails, naming which step.
- **Allow recovery**: a failed step can be retried without redoing the steps that already succeeded (for example, SF already created, only the HR Slack failed, so retry sends just the HR message).

**In scope:** the onboarding UI; one employee-create write to SF; a DB write with the required fields; two distinct Slack messages to the two channels; the SF deep link in the HR message; the failure-handling behaviors above.

**Out of scope:** authentication/SSO; approval workflows; editing or terminating employees; mobile; production deployment; SF fields beyond the agreed minimum set; multi-tenant concerns.

**Constraints.**

- Team size: [?]. Duration: 6 hours. Submission cutoff: [time + timezone].
- SuccessFactors: OData access on the shared preview tenant. Each team namespaced (prefix/sandbox) to avoid data collisions.
- Slack: **two fixed channels provided**, one team channel and one HR channel. **Every message must be prefixed with your team name** (for example, [Team Falcon] Welcome ...) so judges can distinguish submissions in the shared channels. App token/webhook provided.
- Database: **any database you like** (Postgres, Supabase, Firebase, SQLite, Mongo, and so on). It must persist across the demo. No in-memory-only stores that vanish on restart.
- UI: any framework. AI app builders and AI-assisted IDEs are permitted and encouraged.

**Deliverables.**

- **Live demo** (3-minute recorded video as fallback) showing, in one run: a form submission that produces (a) a real SF record, (b) a DB row with per-step status, (c) two Slack messages in the two channels, the HR one deep-linking to the SF record. Then **deliberately trigger one failure** and show your app handling it (clear error plus recovery, no duplicate or orphan).
- **Public repo** with README and setup steps.
- **One short paragraph** describing your failure-handling design: how you guarantee no duplicates or orphans, and how recovery works.

**Judging criteria (weights):**

- **End-to-end happy path**, SF write plus DB row plus both Slack messages plus working SF deep link: **35%**
- **Robustness and failure handling**, idempotency, no duplicate or orphaned records, per-step status, clear error states, working recovery: **25%**
- **Custom UI quality and operator usability:** **20%**
- **Correctness of data mapping** into SF and the DB: **10%**
- **Demo and explanation** (including the deliberate-failure demo): **10%**

**Resources to provide (organizers):**

- SF OData docs plus a create-employee cheat-sheet for the EC entity chain (the single most valuable doc. Teams unfamiliar with SF will otherwise burn an hour decoding the data model).
- Sample SF credentials and one or two seeded test employees.
- Slack app setup guide with token/webhook and the two channel names.
- The **exact SF deep-link URL pattern** (teams will not guess it, hand it over).
- The minimum DB field list (above).
- The list of permitted AI tools.

**Timeline (6h):**

- **H0**: Kickoff, distribute access, teams verify SF auth and Slack posting.
- **H1 checkpoint**: Every team can authenticate to SF *and* post one test message to each Slack channel. (This is the most common silent failure point. Force it early. A team that discovers a broken token at H4 is dead.)
- **H3 checkpoint**: SF employee-create working.
- **H4:30 checkpoint**: DB writes plus both Slack messages wired. Start on failure handling.
- **H5:30**: Submission cutoff (repo plus video).
- **H6**: Live demos.

---

## 🔑 System Access — SAP SuccessFactors

> Shared sandbox test users for this track. These are **API-only** users (tell the organizers if you need to log in to the platform UI). **No RBP** is set — `VIEW` access can be granted on request. Coordinate within your track so two teams don't clash on the same user.

- **Company ID:** `SFCPART001143`
- **API base URL:** `https://apisalesdemo2.successfactors.eu`
- **Platform URL:** `https://salesdemo.successfactors.eu`

| User ID | Password |
| --- | --- |
| GLA_USER_1 | `Fjvezb333@` |
| GLA_USER_2 | `Slazbq716@` |
| GLA_USER_3 | `Ogvzmu646%` |
| GLA_USER_4 | `Kfigie159%` |
| GLA_USER_5 | `Krccqe829!` |
| GLA_USER_6 | `Cqjtyv502#` |
| GLA_USER_7 | `Azrfoq575@` |
| GLA_USER_8 | `Llteix995@` |
| GLA_USER_9 | `Wrcylw473%` |
| GLA_USER_10 | `Qggllf426!` |

---

_One of four hackathon tracks for the INTEGRTR × GLA Hackathon 2026. Your team has been assigned the track above — build against this problem statement._
