
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyLead = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Website",
  status: "new",
  followUp: "",
};

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
};

function formatDate(date) {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [noteInputs, setNoteInputs] = useState({});
  const [expandedLead, setExpandedLead] = useState(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/leads`);
      if (!response.ok) throw new Error("Could not load leads.");

      const data = await response.json();
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch (err) {
      setError(
        "Unable to connect to the backend. Check that your server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const stats = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      contacted: leads.filter((lead) => lead.status === "contacted").length,
      converted: leads.filter((lead) => lead.status === "converted").length,
    }),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = filter === "all" || lead.status === filter;
      const matchesSearch = [
        lead.name,
        lead.email,
        lead.company,
        lead.phone,
      ].some((value) => (value || "").toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [leads, search, filter]);

  function openCreateModal() {
    setEditingLead(null);
    setForm(emptyLead);
    setModalOpen(true);
  }

  function openEditModal(lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "Website",
      status: lead.status || "new",
      followUp: lead.followUp ? lead.followUp.slice(0, 10) : "",
    });
    setModalOpen(true);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function saveLead(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingLead
        ? `${API_URL}/leads/${editingLead._id}`
        : `${API_URL}/leads`;

      const response = await fetch(url, {
        method: editingLead ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          followUp: form.followUp || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save this lead.");
      }

      setModalOpen(false);
      setForm(emptyLead);
      setEditingLead(null);
      await loadLeads();
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(lead) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${lead.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/leads/${lead._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Could not delete the lead.");

      await loadLeads();
    } catch (err) {
      setError(err.message || "Unable to delete this lead.");
    }
  }

  async function addNote(leadId) {
    const note = (noteInputs[leadId] || "").trim();
    if (!note) return;

    try {
      const response = await fetch(`${API_URL}/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to add note.");
      }

      setNoteInputs((previous) => ({ ...previous, [leadId]: "" }));
      await loadLeads();
    } catch (err) {
      setError(err.message || "Unable to add note.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">L</span>
          <span>LeadFlow<span className="brand-dot">.</span></span>
        </a>

        <p className="nav-heading">WORKSPACE</p>
        <a className="nav-link active" href="#dashboard">
          <span>▦</span> Dashboard
        </a>
        <a className="nav-link" href="#leads">
          <span>♙</span> All Leads
          <span className="nav-count">{stats.total}</span>
        </a>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Stay organized</strong>
            <p>Keep every customer conversation in one place.</p>
          </div>

          <div className="profile">
            <div className="avatar">LK</div>
            <div>
              <strong>LeadFlow Admin</strong>
              <span>Workspace owner</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="topbar-right">
            <span className="system-status">
              <span className="status-dot" /> CRM Workspace
            </span>
            <div className="avatar small-avatar">LK</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h1>Lead dashboard</h1>
              <p className="subtitle">
                Manage your prospects, track conversations, and grow your
                customer relationships.
              </p>
            </div>
            <button className="primary-button" onClick={openCreateModal}>
              <span>＋</span> Add new lead
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}

          <section className="stats-grid" aria-label="Lead statistics">
            <StatCard
              label="Total leads"
              value={stats.total}
              icon="♙"
              tone="purple"
              footer="All your prospects"
            />
            <StatCard
              label="New leads"
              value={stats.new}
              icon="✳"
              tone="blue"
              footer="Awaiting contact"
            />
            <StatCard
              label="Contacted"
              value={stats.contacted}
              icon="↗"
              tone="orange"
              footer="Conversations started"
            />
            <StatCard
              label="Converted"
              value={stats.converted}
              icon="✓"
              tone="green"
              footer="Successful conversions"
            />
          </section>

          <section className="leads-panel" id="leads">
            <div className="panel-heading">
              <div>
                <h2>All leads</h2>
                <p>View and manage your customer pipeline.</p>
              </div>
              <span className="lead-total">
                {filteredLeads.length} records
              </span>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Search leads"
                  placeholder="Search name, email, company..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button
                    className="clear-search"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="filter-select"
                aria-label="Filter by status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
              </select>

              <button className="refresh-button" onClick={loadLeads}>
                ↻ <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner" />
                <h3>Loading your leads...</h3>
                <p>Connecting to your CRM database.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">♙</div>
                <h3>{search || filter !== "all" ? "No leads found" : "Your pipeline starts here"}</h3>
                <p>
                  {search || filter !== "all"
                    ? "Try another search term or change the status filter."
                    : "Add your first lead to start managing customer relationships."}
                </p>
                {!search && filter === "all" && (
                  <button className="primary-button" onClick={openCreateModal}>
                    ＋ Create your first lead
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>CONTACT</th>
                      <th>COMPANY</th>
                      <th>SOURCE</th>
                      <th>STATUS</th>
                      <th>FOLLOW-UP</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <LeadRow
                        key={lead._id}
                        lead={lead}
                        expanded={expandedLead === lead._id}
                        noteValue={noteInputs[lead._id] || ""}
                        onNoteChange={(value) =>
                          setNoteInputs((previous) => ({
                            ...previous,
                            [lead._id]: value,
                          }))
                        }
                        onToggleNotes={() =>
                          setExpandedLead((current) =>
                            current === lead._id ? null : lead._id
                          )
                        }
                        onAddNote={() => addNote(lead._id)}
                        onEdit={() => openEditModal(lead)}
                        onDelete={() => deleteLead(lead)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="panel-footer">
              <span>LeadFlow CRM</span>
              <span>Customer management made simple</span>
            </div>
          </section>

          <footer className="page-footer">
            <span>© {new Date().getFullYear()} LeadFlow CRM</span>
            <span>Built with React, Express &amp; MongoDB</span>
          </footer>
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">CUSTOMER PIPELINE</p>
                <h2 id="modal-title">
                  {editingLead ? "Edit lead" : "Add a new lead"}
                </h2>
                <p>Enter the contact details below.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveLead}>
              <div className="form-grid">
                <label>
                  Full name <span>*</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    placeholder="e.g. Priya Sharma"
                    required
                  />
                </label>

                <label>
                  Email address <span>*</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateForm}
                    placeholder="priya@example.com"
                    required
                  />
                </label>

                <label>
                  Phone number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateForm}
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label>
                  Company
                  <input
                    name="company"
                    value={form.company}
                    onChange={updateForm}
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Lead source
                  <select name="source" value={form.source} onChange={updateForm}>
                    <option>Website</option>
                    <option>Referral</option>
                    <option>Social Media</option>
                    <option>Email Campaign</option>
                    <option>Advertisement</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Status
                  <select name="status" value={form.status} onChange={updateForm}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                  </select>
                </label>

                <label className="full-width">
                  Follow-up date
                  <input
                    type="date"
                    name="followUp"
                    value={form.followUp}
                    onChange={updateForm}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingLead
                      ? "Save changes"
                      : "Create lead"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone, footer }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <p className="stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      <p className="stat-footer">{footer}</p>
    </article>
  );
}

function LeadRow({
  lead,
  expanded,
  noteValue,
  onNoteChange,
  onToggleNotes,
  onAddNote,
  onEdit,
  onDelete,
}) {
  const initials = (lead.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <>
      <tr>
        <td>
          <div className="contact-cell">
            <div className="contact-avatar">{initials}</div>
            <div className="contact-info">
              <strong>{lead.name}</strong>
              <span>{lead.email}</span>
              {lead.phone && <span>{lead.phone}</span>}
            </div>
          </div>
        </td>
        <td>{lead.company || <span className="muted">—</span>}</td>
        <td>
          <span className="source-label">{lead.source || "Other"}</span>
        </td>
        <td>
          <span className={`status-badge ${lead.status}`}>
            <span className="badge-dot" />
            {statusLabels[lead.status] || lead.status}
          </span>
        </td>
        <td>{formatDate(lead.followUp)}</td>
        <td>
          <div className="action-buttons">
            <button
              className="icon-button"
              title="View notes"
              aria-label={`View notes for ${lead.name}`}
              onClick={onToggleNotes}
            >
              ☰
            </button>
            <button
              className="icon-button"
              title="Edit lead"
              aria-label={`Edit ${lead.name}`}
              onClick={onEdit}
            >
              ✎
            </button>
            <button
              className="icon-button delete-action"
              title="Delete lead"
              aria-label={`Delete ${lead.name}`}
              onClick={onDelete}
            >
              ×
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="notes-row">
          <td colSpan="6">
            <div className="notes-panel">
              <div className="notes-title">
                <strong>Conversation notes</strong>
                <span>{lead.notes?.length || 0} notes</span>
              </div>

              {lead.notes?.length ? (
                <ul className="notes-list">
                  {lead.notes.map((note, index) => (
                    <li key={note._id || index}>
                      <span>{note.text || note.content || String(note)}</span>
                      {note.createdAt && (
                        <small>{formatDate(note.createdAt)}</small>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No notes added yet.</p>
              )}

              <div className="add-note-row">
                <input
                  value={noteValue}
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder="Write a conversation note..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddNote();
                    }
                  }}
                />
                <button
                  className="secondary-button"
                  onClick={onAddNote}
                  disabled={!noteValue.trim()}
                >
                  Add note
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default App;
