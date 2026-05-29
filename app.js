const seedCases = [
  {
    id: "PA-10482",
    patient: "Jane Martinez",
    initials: "JM",
    age: 46,
    memberId: "NSH-4819-2204",
    payer: "Northstar Health Plan",
    provider: "Lakeside Orthopedics",
    service: "Lumbar spine MRI without contrast",
    diagnosis: "Persistent low back pain with left-sided radiculopathy",
    urgency: "Standard",
    status: "ready",
    statusText: "AI ready",
    sla: "3h 20m remaining",
    confidence: 92,
    recommendation: "Approve",
    summary: "Six weeks of conservative therapy are documented, neurologic symptoms persist, and recent exam notes show positive straight-leg raise.",
    missing: [],
    evidence: [
      ["Policy match", "Imaging policy IMG-221 supports MRI after six weeks of documented conservative therapy with persistent radiculopathy."],
      ["Clinical extraction", "AI found physical therapy dates, NSAID trial, worsening pain score, and neurologic exam findings."],
      ["Risk control", "No red flags requiring peer review were detected; case is eligible for reviewer confirmation."]
    ],
    timeline: [
      ["Submitted", "Today 8:14 AM by Lakeside Orthopedics"],
      ["AI extraction", "28 clinical facts extracted from referral note and PT record"],
      ["Policy reasoning", "Matched to IMG-221 with 92% confidence"]
    ],
    memberMessage: "Your MRI request is under review. The plan has enough information for a fast decision."
  },
  {
    id: "PA-10483",
    patient: "Robert Chen",
    initials: "RC",
    age: 58,
    memberId: "SUM-7742-8821",
    payer: "SummitCare Commercial",
    provider: "Riverbend Dermatology",
    service: "Dupilumab continuation",
    diagnosis: "Moderate-to-severe atopic dermatitis",
    urgency: "Standard",
    status: "missing",
    statusText: "Missing info",
    sla: "1 day remaining",
    confidence: 67,
    recommendation: "Request information",
    summary: "Continuation criteria may be met, but the latest EASI score and response-to-therapy documentation were not included.",
    missing: ["Current EASI score", "Response after 16 weeks of therapy"],
    evidence: [
      ["Policy match", "Drug policy RX-118 requires documented improvement for continuation after initial authorization."],
      ["Clinical gap", "AI found prior approval and medication history, but no current severity score."],
      ["Provider prompt", "Recommended message asks for specific documentation instead of a generic denial."]
    ],
    timeline: [
      ["Submitted", "Yesterday 4:42 PM by Riverbend Dermatology"],
      ["AI extraction", "Medication and diagnosis confirmed"],
      ["Missing info detected", "Two continuation criteria could not be validated"]
    ],
    memberMessage: "Your medication renewal needs one more note from your dermatologist before the plan can decide."
  },
  {
    id: "PA-10484",
    patient: "Alicia Brooks",
    initials: "AB",
    age: 63,
    memberId: "BRM-1028-5317",
    payer: "Blue Ridge Medicaid",
    provider: "Capital Heart Group",
    service: "Cardiac CT angiography",
    diagnosis: "Chest pain with abnormal stress test",
    urgency: "Urgent",
    status: "human",
    statusText: "Human review",
    sla: "46m remaining",
    confidence: 74,
    recommendation: "Route to nurse reviewer",
    summary: "The request has strong clinical support, but payer rules require manual review for urgent imaging in this benefit category.",
    missing: [],
    evidence: [
      ["Policy match", "Imaging policy CARD-310 supports CTA after abnormal stress test and persistent symptoms."],
      ["Exception", "Urgent Medicaid imaging requests require licensed nurse final review."],
      ["SLA alert", "Case should be handled before 5:00 PM to avoid a turnaround breach."]
    ],
    timeline: [
      ["Submitted", "Today 12:08 PM by Capital Heart Group"],
      ["AI extraction", "Stress test result, symptom duration, and medication list extracted"],
      ["Human route", "Nurse review required due to urgency and plan policy"]
    ],
    memberMessage: "Your heart imaging request is being prioritized for clinical review today."
  },
  {
    id: "PA-10485",
    patient: "Nora Patel",
    initials: "NP",
    age: 34,
    memberId: "NSH-6671-9044",
    payer: "Northstar Health Plan",
    provider: "Evergreen Physical Therapy",
    service: "Additional physical therapy visits",
    diagnosis: "Post-operative ACL repair",
    urgency: "Standard",
    status: "ready",
    statusText: "AI ready",
    sla: "2 days remaining",
    confidence: 89,
    recommendation: "Approve 8 visits",
    summary: "Functional progress is documented and additional visits align with post-operative rehab policy limits.",
    missing: [],
    evidence: [
      ["Policy match", "Rehab policy PT-044 allows additional visits when functional gains are documented after surgery."],
      ["Clinical extraction", "AI identified range-of-motion improvement, gait notes, and surgeon protocol."],
      ["Consistency", "Similar low-risk requests are often approved without peer escalation."]
    ],
    timeline: [
      ["Submitted", "Today 9:31 AM by Evergreen Physical Therapy"],
      ["AI extraction", "Progress notes and surgical protocol summarized"],
      ["Recommendation", "Approve 8 visits with standard audit logging"]
    ],
    memberMessage: "Your additional therapy visit request has enough documentation for a quick review."
  }
];

const roleCopy = {
  provider: ["Provider workspace", "Submit and track authorizations", "Authorization requests"],
  reviewer: ["Clinical reviewer workspace", "Review AI recommendations with oversight", "Clinical work queue"],
  member: ["Member experience", "Request Status", "Member authorization updates"],
  ops: ["Payer operations", "Operations report", "Operational command center"]
};

let cases = JSON.parse(localStorage.getItem("humana-pa-ai-cases") || "null") || JSON.parse(JSON.stringify(seedCases));
let selectedId = cases[0].id;
let activeRole = "provider";
let activeFilter = "all";
let activeView = "dashboard";

const caseList = document.querySelector("#case-list");
const detailPanel = document.querySelector("#detail-panel");
const roleEyebrow = document.querySelector("#role-eyebrow");
const pageTitle = document.querySelector("#page-title");
const queueTitle = document.querySelector("#queue-title");
const dashboardMetrics = document.querySelector("#dashboard-metrics");
const dashboardWorkspace = document.querySelector("#dashboard-workspace");
const intakePage = document.querySelector("#intake-page");
const requestForm = document.querySelector("#request-form");

function saveCases() {
  localStorage.setItem("humana-pa-ai-cases", JSON.stringify(cases));
}

function getSelectedCase() {
  return cases.find((item) => item.id === selectedId) || cases[0];
}

function statusClass(status) {
  return {
    ready: "status-ready",
    missing: "status-missing",
    human: "status-human",
    sla: "status-sla",
    approved: "status-approved"
  }[status];
}

function statusTextForRole(item) {
  if (activeRole !== "provider") return item.statusText;
  return {
    ready: "In review",
    missing: "Action needed",
    human: "Clinical review",
    sla: "Clinical review",
    approved: "Approved"
  }[item.status] || item.statusText;
}

function filteredCases() {
  if (activeFilter === "all") return cases;
  return cases.filter((item) => item.status === activeFilter || (activeFilter === "human" && item.status === "sla"));
}

function renderMetrics() {
  const ready = cases.filter((item) => item.status === "ready").length;
  const missing = cases.filter((item) => item.status === "missing").length;
  const sla = cases.filter((item) => item.sla.includes("46m") || item.status === "sla").length;
  document.querySelector("#dashboard-metrics article:first-child span").textContent = activeRole === "provider" ? "Requests in review" : "AI ready decisions";
  document.querySelector("#dashboard-metrics article:first-child small").textContent = activeRole === "provider" ? "no provider action needed" : "low-risk recommendations";
  document.querySelector("#metric-ready").textContent = ready;
  document.querySelector("#metric-missing").textContent = missing;
  document.querySelector("#metric-sla").textContent = sla;
}

function renderQueue() {
  const visibleCases = filteredCases();
  caseList.innerHTML = visibleCases.map((item) => `
    <button class="case-card ${item.id === selectedId ? "active" : ""}" data-case-id="${item.id}">
      <div class="case-title-row">
        <strong>${item.patient}</strong>
        <span class="status-pill ${statusClass(item.status)}">${statusTextForRole(item)}</span>
      </div>
      <p>${item.service}</p>
      <div class="case-meta">
        <span>${item.id}</span>
        <span>${item.payer}</span>
        <span>${item.sla}</span>
      </div>
    </button>
  `).join("");

  document.querySelectorAll(".case-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.caseId;
      render();
    });
  });
}

function renderProviderDetail(item) {
  return `
    ${renderCaseHeader(item)}
    <div class="detail-columns">
      <div class="info-card">
        <h3>Request snapshot</h3>
        ${kv("Provider", item.provider)}
        ${kv("Payer", item.payer)}
        ${kv("Diagnosis", item.diagnosis)}
        ${kv("Urgency", item.urgency)}
      </div>
      <div class="info-card">
        <h3>Provider next step</h3>
        ${kv("Current status", statusTextForRole(item))}
        ${kv("SLA", item.sla)}
        ${kv("Action needed", item.status === "missing" ? item.missing.join(", ") : "No provider action needed")}
        ${kv("Notifications", "Status updates are sent when reviewer action is complete")}
      </div>
    </div>
    ${renderProviderTimeline(item)}
  `;
}

function renderReviewerDetail(item) {
  return `
    ${renderCaseHeader(item)}
    <div class="detail-columns">
      ${renderAiPanel(item)}
      <div class="info-card">
        <h3>Human oversight</h3>
        ${kv("Recommendation", item.recommendation)}
        ${kv("Risk", item.status === "human" ? "Manual clinical judgment required" : "Low to moderate")}
        ${kv("Audit", "Rationale and reviewer action will be logged")}
        <div class="action-row">
          <button class="primary-button" data-action="approve">Approve</button>
          <button class="ghost-button" data-action="request">Request info</button>
          <button class="ghost-button" data-action="route">Route to MD</button>
        </div>
      </div>
    </div>
    ${renderTimeline(item)}
  `;
}

function renderMemberDetail(item) {
  return `
    ${renderCaseHeader(item)}
    <div class="detail-columns">
      <div class="member-card">
        <h3>Status update</h3>
        <p>${item.memberMessage}</p>
        <div class="bar"><span style="width:${item.status === "approved" ? 100 : item.status === "ready" ? 76 : 54}%"></span></div>
      </div>
      <div class="member-card">
        <h3>What happens next</h3>
        <p>${item.status === "missing" ? "Your provider will receive a focused request for the exact missing documentation." : "The clinical team reviews the AI summary, policy match, and supporting notes before a final decision."}</p>
      </div>
    </div>
    ${renderTimeline(item)}
  `;
}

function renderOpsDetail(item) {
  const autoReady = Math.round((cases.filter((c) => c.status === "ready" || c.status === "approved").length / cases.length) * 100);
  return `
    <div class="ops-grid">
      <div class="info-card">
        <h3>Automation throughput</h3>
        ${kv("AI-assisted cases", `${autoReady}%`)}
        ${kv("Manual review reduction", "42% estimated")}
        ${kv("Provider call reduction", "31% estimated")}
        <div class="bar"><span style="width:${autoReady}%"></span></div>
      </div>
      <div class="info-card">
        <h3>SLA risk watch</h3>
        ${kv("Highest risk case", item.id)}
        ${kv("Current SLA", item.sla)}
        ${kv("Recommended action", item.status === "human" ? "Assign nurse reviewer" : "Continue monitoring")}
      </div>
      <div class="info-card">
        <h3>Policy consistency</h3>
        ${kv("Explainable recommendations", "100%")}
        ${kv("Audit events logged", cases.length * 3)}
        ${kv("Feedback loops", "Reviewer corrections captured")}
      </div>
      <div class="info-card">
        <h3>Before vs after</h3>
        ${kv("Current process", "3-5 days, high calls, frequent SLA misses")}
        ${kv("Future process", "<4 hours, focused exceptions, consistent decisions")}
      </div>
    </div>
  `;
}

function renderCaseHeader(item) {
  return `
    <div class="detail-hero">
      <div>
        <span class="eyebrow">${item.id}</span>
        <h2>${item.patient}</h2>
        <p>${item.age} years old | ${item.memberId}</p>
        <span class="status-pill ${statusClass(item.status)}">${statusTextForRole(item)}</span>
      </div>
      <div class="patient-avatar" aria-hidden="true">${item.initials}</div>
    </div>
  `;
}

function renderAiPanel(item) {
  const missingBlock = item.missing.length ? `
    <div class="reason-item">
      <div class="reason-badge warn">!</div>
      <div>
        <strong>Missing documentation</strong>
        <p>${item.missing.join(", ")}</p>
      </div>
    </div>
  ` : "";

  return `
    <div class="reason-list">
      <div class="ai-heading">
        <h3>AI recommendation</h3>
        <span class="confidence-chip">${item.confidence}% confidence</span>
      </div>
      <div class="reason-item">
        <div class="reason-badge">${item.recommendation.slice(0, 1)}</div>
        <div>
          <strong>${item.recommendation}</strong>
          <p>${item.summary}</p>
        </div>
      </div>
      ${item.evidence.map(([title, body]) => `
        <div class="reason-item">
          <div class="reason-badge ${title === "Exception" ? "stop" : ""}">${title.slice(0, 1)}</div>
          <div>
            <strong>${title}</strong>
            <p>${body}</p>
          </div>
        </div>
      `).join("")}
      ${missingBlock}
    </div>
  `;
}

function renderTimeline(item) {
  return `
    <div class="timeline" style="margin-top:14px">
      <h3>Audit trail</h3>
      ${item.timeline.map(([title, body]) => `
        <div class="timeline-step">
          <strong>${title}</strong>
          <p>${body}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderProviderTimeline(item) {
  const actionText = item.status === "missing"
    ? `Provider action requested: ${item.missing.join(", ")}`
    : "Request is with the health plan review team";
  return `
    <div class="timeline" style="margin-top:14px">
      <h3>Status history</h3>
      <div class="timeline-step">
        <strong>Submitted</strong>
        <p>Request received from ${item.provider}</p>
      </div>
      <div class="timeline-step">
        <strong>${statusTextForRole(item)}</strong>
        <p>${actionText}</p>
      </div>
    </div>
  `;
}

function kv(label, value) {
  return `<div class="kv"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderDetail() {
  const item = getSelectedCase();
  if (activeRole === "reviewer") detailPanel.innerHTML = renderReviewerDetail(item);
  if (activeRole === "provider") detailPanel.innerHTML = renderProviderDetail(item);
  if (activeRole === "member") detailPanel.innerHTML = renderMemberDetail(item);
  if (activeRole === "ops") detailPanel.innerHTML = renderOpsDetail(item);

  detailPanel.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => applyReviewerAction(button.dataset.action));
  });
}

function applyReviewerAction(action) {
  const item = getSelectedCase();
  if (action === "approve") {
    item.status = "approved";
    item.statusText = "Approved";
    item.recommendation = "Approved by reviewer";
    item.memberMessage = "Your request has been approved. Your provider can schedule the service.";
    item.timeline.push(["Reviewer decision", "Approved after reviewing AI rationale and source documentation"]);
  }
  if (action === "request") {
    item.status = "missing";
    item.statusText = "Missing info";
    item.recommendation = "Request information";
    if (!item.missing.length) item.missing = ["Additional clinical note requested by reviewer"];
    item.timeline.push(["Reviewer action", "Focused information request sent to provider"]);
  }
  if (action === "route") {
    item.status = "human";
    item.statusText = "Human review";
    item.recommendation = "Route to medical director";
    item.timeline.push(["Reviewer route", "Escalated to medical director for final judgment"]);
  }
  saveCases();
  render();
}

function render() {
  const copy = roleCopy[activeRole];
  roleEyebrow.textContent = activeView === "intake" ? "Provider intake" : copy[0];
  pageTitle.textContent = activeView === "intake" ? "Create a prior authorization request" : copy[1];
  queueTitle.textContent = copy[2];
  document.querySelector("#quick-submit").style.display = activeRole === "provider" && activeView === "dashboard" ? "inline-flex" : "none";
  document.querySelector("#reset-demo").style.display = activeView === "dashboard" ? "inline-flex" : "none";
  dashboardMetrics.classList.toggle("hidden", activeView === "intake");
  dashboardWorkspace.classList.toggle("hidden", activeView === "intake");
  intakePage.classList.toggle("hidden", activeView !== "intake");

  if (activeView === "intake") return;

  renderMetrics();
  renderQueue();
  renderDetail();
}

document.querySelectorAll(".role-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeRole = button.dataset.role;
    activeView = "dashboard";
    document.querySelectorAll(".role-button").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
    const firstVisible = filteredCases()[0];
    if (firstVisible) selectedId = firstVisible.id;
    render();
  });
});

document.querySelector("#quick-submit").addEventListener("click", () => {
  activeView = "intake";
  requestForm.reset();
  render();
});

document.querySelector("#cancel-intake").addEventListener("click", () => {
  activeView = "dashboard";
  render();
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  cases = JSON.parse(JSON.stringify(seedCases));
  selectedId = cases[0].id;
  activeView = "dashboard";
  saveCases();
  render();
});

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const patient = form.get("patient").toString().trim();
  const diagnosis = form.get("diagnosis").toString().trim();
  const icd10 = form.get("icd10").toString().trim();
  const cpt = form.get("cpt").toString().trim();
  const attachments = form.getAll("attachments");
  const id = `PA-${10482 + cases.length + 1}`;
  const initials = patient.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const dob = form.get("dob").toString();
  const age = dob ? Math.max(0, new Date().getFullYear() - Number(dob.slice(0, 4))) : 41;
  const service = form.get("service").toString().trim();
  const provider = form.get("orderingProvider").toString().trim();
  const summary = form.get("summary").toString().trim();
  const priorTreatment = form.get("priorTreatment").toString().trim();
  const newCase = {
    id,
    patient,
    initials,
    age,
    memberId: form.get("memberId").toString().trim(),
    payer: form.get("payer").toString(),
    provider,
    service,
    diagnosis: icd10 ? `${diagnosis} (${icd10})` : diagnosis,
    urgency: form.get("urgency").toString(),
    status: "ready",
    statusText: "AI ready",
    sla: form.get("urgency") === "Urgent" ? "2h remaining" : "2 days remaining",
    confidence: 88,
    recommendation: "Approve pending reviewer confirmation",
    summary: `${summary}${priorTreatment ? ` Prior treatment: ${priorTreatment}` : ""}`,
    missing: [],
    evidence: [
      ["Policy match", `The simulated policy engine matched ${service}${cpt ? ` (${cpt})` : ""} to the selected plan's authorization criteria.`],
      ["Clinical extraction", `AI extracted diagnosis, urgency, requested setting, provider NPI, and ${attachments.length || "no"} supporting document type${attachments.length === 1 ? "" : "s"}.`],
      ["Human oversight", "A reviewer can confirm, request more information, or route the case for medical director review."]
    ],
    timeline: [
      ["Submitted", `Just now by ${provider}`],
      ["AI intake", "Clinical facts extracted from the blank-form submission"],
      ["Recommendation", "Ready for reviewer confirmation"]
    ],
    memberMessage: "Your request was received and is being reviewed with AI-assisted decision support."
  };
  cases.unshift(newCase);
  selectedId = id;
  activeView = "dashboard";
  saveCases();
  event.target.reset();
  render();
});

render();
