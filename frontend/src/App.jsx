
import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import './App.css'

// Use the configured backend URL, with a local development fallback.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

// Define the summary cards and their matching icons and descriptions.
const summaryCardConfig = [
  {
    title: 'Total Requests',
    detail: 'All maintenance requests',
    icon: ClipboardList,
    tone: 'blue',
  },
  {
    title: 'Pending',
    detail: 'Waiting for review',
    icon: Clock3,
    tone: 'orange',
  },
  {
    title: 'In Progress',
    detail: 'Currently being handled',
    icon: Wrench,
    tone: 'purple',
  },
  {
    title: 'Completed',
    detail: 'Successfully resolved',
    icon: CheckCircle2,
    tone: 'green',
  },
]

 // Format database timestamps into a readable date and time for the dashboard.
function formatDate(dateValue) {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}

// Reusable badge component keeps request status and priority styling consistent.
function StatusBadge({ value }) {
  const className = String(value || 'Unknown')
    .toLowerCase()
    .replaceAll(' ', '-')

  return <span className={`status-badge ${className}`}>{value || 'Unknown'}</span>
}

// Main dashboard loads maintenance requests and summary figures from Express.

 // Handle the maintenance request form, validation, and API submission.
function RequestFormModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    building: '',
    roomNumber: '',
    priority: 'Medium',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Update the field that the user changes in the form.
  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // Validate the form and save the request through the existing Express API.
  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value.trim(),
      ]),
    )

    if (
      !cleanedData.title ||
      !cleanedData.description ||
      !cleanedData.category ||
      !cleanedData.building ||
      !cleanedData.roomNumber
    ) {
      setErrorMessage('Please complete all required fields.')
      return
    }

    if (cleanedData.title.length > 100) {
      setErrorMessage('The request title must not exceed 100 characters.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to submit the maintenance request.',
        )
      }

      setSuccessMessage('Request submitted successfully!')
      setFormData({
        title: '',
        description: '',
        category: '',
        building: '',
        roomNumber: '',
        priority: 'Medium',
      })

      // Refresh the dashboard after the backend confirms creation.
      onCreated()
    } catch (error) {
      setErrorMessage(
        error.message || 'Unable to connect to the maintenance API.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="request-modal-overlay"
      onClick={onClose}
    >
      <section
        className="request-modal request-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="request-modal-header">
          <div>
            <p className="request-modal-eyebrow">DORMCARE PORTAL</p>
            <h2 id="request-form-title">Submit a Maintenance Request</h2>
            <p className="request-meta">
              Describe the issue in your dormitory.
            </p>
          </div>

          <button
            type="button"
            className="request-modal-close"
            onClick={onClose}
            aria-label="Close request form"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="request-form-body">
            <label className="request-form-field">
              Request title *
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                required
                placeholder="e.g. Leaking bathroom faucet"
              />
            </label>

            <label className="request-form-field">
              Description *
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Explain the issue and any relevant details."
              />
            </label>

            <div className="request-form-grid">
              <label className="request-form-field">
                Category *
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="request-form-field">
                Priority
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="request-form-field">
                Building *
                <input
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Building A"
                />
              </label>

              <label className="request-form-field">
                Room number *
                <input
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 204"
                />
              </label>
            </div>

            {errorMessage && (
              <p className="request-form-message error" role="alert">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="request-form-message success" role="status">
                {successMessage}
              </p>
            )}
          </div>

          <div className="request-modal-footer request-form-footer">
            <button
              type="button"
              className="request-form-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </button>

            <button
              type="submit"
              className="request-modal-done"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')

  const [requests, setRequests] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  // Fetch real maintenance records and statistics when the dashboard loads.
  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboardData() {
      setLoading(true)
      setApiError('')

      try {
        const [requestsResponse, summaryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/requests?limit=100`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/requests/summary`, {
            signal: controller.signal,
          }),
        ])

        if (!requestsResponse.ok || !summaryResponse.ok) {
          throw new Error(
            'The backend could not provide dashboard data. Check that the API is running.',
          )
        }

        const requestsData = await requestsResponse.json()
        const summaryData = await summaryResponse.json()

        if (!Array.isArray(requestsData.requests)) {
          throw new Error('The maintenance requests response has an unexpected format.')
        }

        setRequests(requestsData.requests)
        setSummary(summaryData)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiError(
            error.message ||
              'Unable to connect to the backend. Check your server and network settings.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    
    loadDashboardData()

    return () => controller.abort()
  }, [refreshKey])

  // Close the request details modal when the user presses Escape.
  useEffect(() => {
    if (!selectedRequest) return

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        setSelectedRequest(null)
      }
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [selectedRequest])

  // Calculate the displayed summary cards from the backend response.
  const summaryCards = summary
    ? summaryCardConfig.map((card, index) => {
        const values = [
          summary.totalRequests,
          summary.pendingRequests,
          summary.inProgressRequests,
          summary.completedRequests,
        ]

        return {
          ...card,
          value: values[index] ?? 0,
        }
      })
    : summaryCardConfig.map((card) => ({ ...card, value: '—' }))

  // Search real request fields and apply the selected status filter.
  const filteredRequests = requests.filter((request) => {
    const requestId = request._id || request.id || ''

    const searchableText = [
      requestId,
      request.title,
      request.description,
      request.building,
      request.roomNumber,
      request.category,
      request.priority,
      request.status,
      request.assignedTo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'All Statuses' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Keep navigation interactive while the other pages are developed later.
  function handleNavigation(label) {
    setActiveNav(label)
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={23} />
          </div>
          <div className="brand-copy">
            <span className="brand-name">DormCare</span>
            <span className="brand-subtitle">Maintenance Portal</span>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">WORKSPACE</span>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {[
              { label: 'Dashboard', icon: LayoutDashboard },
              { label: 'Maintenance Requests', icon: ClipboardList },
              { label: 'Submit a Request', icon: Plus },
              { label: 'Residents', icon: Users },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-item ${activeNav === label ? 'nav-item-active' : ''}`}
                onClick={() => handleNavigation(label)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {label === 'Maintenance Requests' && (
                  <span className="nav-count">
                    {summary?.pendingRequests ?? '—'}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-section sidebar-secondary">
          <span className="sidebar-label">PREFERENCES</span>
          <nav className="sidebar-nav" aria-label="Preferences">
            <button
              className={`nav-item ${activeNav === 'Settings' ? 'nav-item-active' : ''}`}
              onClick={() => handleNavigation('Settings')}
            >
              <Settings size={19} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <ShieldCheck size={19} />
            </div>
            <strong>Need assistance?</strong>
            <p>Contact your dormitory administrator for help.</p>
          </div>

          <button
            className="profile-row"
            onClick={() => handleNavigation('Profile')}
          >
            <div className="avatar avatar-blue">AD</div>
            <div className="profile-copy">
              <strong>Admin Demo</strong>
              <span>Administrator</span>
            </div>
            <LogOut size={17} className="profile-action" />
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activeNav}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" />
              {apiError ? 'Connection issue' : 'System operational'}
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>
            <button
              className="topbar-profile"
              onClick={() => handleNavigation('Profile')}
            >
              <div className="avatar avatar-blue">AD</div>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <Activity size={15} />
                DORMITORY OVERVIEW
              </div>
              <h1>
                Good day, Admin! <span>👋</span>
              </h1>
              <p>Here&apos;s what&apos;s happening with your dormitory today.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => handleNavigation('Submit a Request')}
            >
              <Plus size={18} />
              New Request
            </button>
          </section>

          {apiError && (
            <div className="empty-state" role="alert">
              <strong>Unable to load dashboard data</strong>
              <p>{apiError}</p>
              <p>
                Confirm that MongoDB and the Express server are running, then
                refresh this page.
              </p>
            </div>
          )}

          <section className="summary-grid" aria-label="Maintenance summary">
            {summaryCards.map((card) => {
              const Icon = card.icon

              return (
                <article className="summary-card" key={card.title}>
                  <div className="summary-card-top">
                    <div className={`summary-icon icon-${card.tone}`}>
                      <Icon size={21} />
                    </div>
                  </div>
                  <p className="summary-title">{card.title}</p>
                  <div className="summary-value">{card.value}</div>
                  <p className="summary-detail">{card.detail}</p>
                </article>
              )
            })}
          </section>

          <section className="requests-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent Maintenance Requests</h2>
                <p>Track and manage the latest reported issues.</p>
              </div>
              <button
                className="text-button"
                onClick={() => handleNavigation('Maintenance Requests')}
              >
                View all <ArrowRight size={16} />
              </button>
            </div>

            <div className="table-toolbar">
              <label className="search-field">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search maintenance requests"
                />
              </label>

              <label className="filter-field">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter requests by status"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Assigned</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Rejected</option>
                </select>
              </label>
            </div>

            <div className="table-scroll">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>REQUEST</th>
                    <th>LOCATION</th>
                    <th>ASSIGNED PERSONNEL</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>DATE SUBMITTED</th>
                  </tr>
                </thead>               
<tbody>
  {filteredRequests.map((request) => {
    const requestId = request._id || request.id

    return (
      // Allow users to open a request by clicking or keyboard navigation.
      <tr
        key={requestId}
        className="clickable-request-row"
        onClick={() => setSelectedRequest(request)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setSelectedRequest(request)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${request.title || 'maintenance request'}`}
      >
        <td>
          <div className="request-title">
            {request.title || 'Untitled request'}
          </div>
          <div className="request-meta">
            #{String(requestId).slice(-6).toUpperCase()}
            {request.category && (
              <>
                <span> · </span>
                {request.category}
              </>
            )}
          </div>
        </td>
        <td>
          <div className="request-title">
            {request.building || 'Building unavailable'}
          </div>
          <div className="request-meta">
            Room {request.roomNumber || '—'}
          </div>
        </td>
        {/* Show assigned personnel, or a fallback when nobody is assigned. */}
        <td>
          <div className="resident-cell">
            <div className="avatar avatar-light">
              {request.assignedTo
                ? request.assignedTo
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()
                : '—'}
            </div>
            <span>{request.assignedTo || 'Unassigned'}</span>
          </div>
        </td>
        <td>
          <StatusBadge value={request.priority} />
        </td>
        <td>
          <StatusBadge value={request.status} />
        </td>
        <td className="date-cell">
          {formatDate(request.createdAt)}
        </td>
      </tr>
    )
  })}
</tbody>
              </table>

              {loading && (
                <div className="empty-state" role="status">
                  <strong>Loading maintenance requests...</strong>
                  <p>Connecting to the dormitory maintenance API.</p>
                </div>
              )}

              {!loading && !apiError && filteredRequests.length === 0 && (
                <div className="empty-state">
                  <Search size={25} />
                  <strong>
                    {requests.length === 0
                      ? 'No maintenance requests yet'
                      : 'No matching requests'}
                  </strong>
                  <p>
                    {requests.length === 0
                      ? 'Requests saved through the API will appear here.'
                      : 'Try another search term or status filter.'}
                  </p>
                </div>
              )}
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredRequests.length}</strong> of{' '}
                <strong>{requests.length}</strong> loaded requests
              </span>
              <span className="sample-note">
                {loading ? 'Loading data' : apiError ? 'API unavailable' : 'Live API data'}
              </span>
            </div>
          </section>

          

          <footer className="dashboard-footer">
            <span>© 2026 DormCare Maintenance Portal</span>
            <span>Built for a better dormitory experience.</span>
          </footer>
        </div>
      </main>
      
{/* Display the selected maintenance request in a popup modal. */}
{selectedRequest && (
  <div
    className="request-modal-overlay"
    onClick={() => setSelectedRequest(null)}
  >
    <section
      className="request-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="request-modal-header">
        <div>
          <p className="request-modal-eyebrow">
            MAINTENANCE REQUEST
          </p>
          <h2 id="request-modal-title">
            {selectedRequest.title || 'Untitled request'}
          </h2>
          <p className="request-meta">
            Request ID: #
            {String(
              selectedRequest._id || selectedRequest.id || 'Unavailable',
            ).slice(-6).toUpperCase()}
          </p>
        </div>

        <button
          type="button"
          className="request-modal-close"
          onClick={() => setSelectedRequest(null)}
          aria-label="Close request details"
        >
          ×
        </button>
      </div>

      <div className="request-modal-body">
        <div className="request-modal-badges">
          <div>
            <span className="request-detail-label">STATUS</span>
            <StatusBadge value={selectedRequest.status} />
          </div>
          <div>
            <span className="request-detail-label">PRIORITY</span>
            <StatusBadge value={selectedRequest.priority} />
          </div>
        </div>

        <div className="request-detail-grid">
          <div className="request-detail-item">
            <span className="request-detail-label">BUILDING</span>
            <span>{selectedRequest.building || 'Unavailable'}</span>
          </div>

          <div className="request-detail-item">
            <span className="request-detail-label">ROOM</span>
            <span>{selectedRequest.roomNumber || '—'}</span>
          </div>

          <div className="request-detail-item">
            <span className="request-detail-label">CATEGORY</span>
            <span>{selectedRequest.category || 'Uncategorized'}</span>
          </div>

          <div className="request-detail-item">
            <span className="request-detail-label">ASSIGNED PERSONNEL</span>
            <span>{selectedRequest.assignedTo || 'Unassigned'}</span>
          </div>
        </div>

        <div className="request-detail-description">
          <span className="request-detail-label">DESCRIPTION</span>
          <p>
            {selectedRequest.description || 'No description provided.'}
          </p>
        </div>

        <div className="request-detail-submission">
          <span className="request-detail-label">
            SUBMISSION DATE AND TIME
          </span>
          <span>{formatDate(selectedRequest.createdAt)}</span>
        </div>
      </div>

      <div className="request-modal-footer">
        <button
          type="button"
          className="request-modal-done"
          onClick={() => {
            setSelectedRequest(null);
            setRefreshKey((prev) => prev + 1);
          }}
        >
          Close
        </button>
      </div>
    </section>
  </div>
)}
{/* Show the submission form when the user opens Submit a Request. */}
      {activeNav === 'Submit a Request' && (
        <RequestFormModal
          onClose={() => setActiveNav('Dashboard')}
          onCreated={() => setRefreshKey((current) => current + 1)}
        />
      )}
  </div>
  )
}

export default App
