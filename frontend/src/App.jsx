
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
  Trash2,
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
function RequestFormModal({ onClose, onCreated, authToken }) {
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
          Authorization: `Bearer ${authToken}`,
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

function DashboardApp({ authToken, user, onLogout }) {
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
  const [isEditingRequest, setIsEditingRequest] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    building: '',
    roomNumber: '',
    priority: 'Medium',
  })
  const [savingRequestEdit, setSavingRequestEdit] = useState(false)
  const [requestEditError, setRequestEditError] = useState('')
  const [deletingRequest, setDeletingRequest] = useState(false)
  const [deleteRequestError, setDeleteRequestError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Store the maintenance team returned by the Express API.
  const [maintenanceTeam, setMaintenanceTeam] = useState([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState('')

  // Store resident accounts returned by the residents directory API.
  const [residents, setResidents] = useState([])
  const [residentsLoading, setResidentsLoading] = useState(false)
  const [residentsError, setResidentsError] = useState('')
  const [residentSearchTerm, setResidentSearchTerm] = useState('')
  const [residentToDelete, setResidentToDelete] = useState(null)
  const [deletingResident, setDeletingResident] = useState(false)
  const [residentDeleteError, setResidentDeleteError] = useState('')
  const [residentDeleteSuccess, setResidentDeleteSuccess] = useState('')
  const [savingRequestUpdate, setSavingRequestUpdate] = useState(false)
  const [requestUpdateError, setRequestUpdateError] = useState('')
  const [requestUpdateSuccess, setRequestUpdateSuccess] = useState('')

// Load employee names, roles, and qualified maintenance categories.
useEffect(() => {
  const controller = new AbortController()

  async function loadMaintenanceTeam() {
    setTeamLoading(true)
    setTeamError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/maintenance-team`,
        { headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to load the maintenance team.',
        )
      }

      if (!Array.isArray(result.employees)) {
        throw new Error('The maintenance team response has an unexpected format.')
      }

      setMaintenanceTeam(result.employees)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setTeamError(error.message || 'Unable to connect to the maintenance API.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setTeamLoading(false)
      }
    }
  }

  loadMaintenanceTeam()

  return () => controller.abort()
}, [authToken])
  // Load residents only when the Residents page is opened.
  useEffect(() => {
    if (activeNav !== 'Residents') return

    const controller = new AbortController()

    async function loadResidents() {
      setResidentsLoading(true)
      setResidentsError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/residents`, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load residents.')
        }
        if (!Array.isArray(result.residents)) {
          throw new Error('The residents response has an unexpected format.')
        }
        setResidents(result.residents)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResidentsError(error.message || 'Unable to connect to the residents API.')
        }
      } finally {
        if (!controller.signal.aborted) setResidentsLoading(false)
      }
    }

    loadResidents()
    return () => controller.abort()
  }, [activeNav, authToken])

  // Fetch real maintenance records and statistics when the dashboard loads.
  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboardData() {
      setLoading(true)
      setApiError('')

      try {
        const [requestsResponse, summaryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/requests?limit=100`, {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/api/requests/summary`, {
            headers: { Authorization: `Bearer ${authToken}` },
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
  }, [refreshKey, authToken])

  // Close the request details modal when the user presses Escape.
  useEffect(() => {
    if (!selectedRequest) return

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          setSelectedRequest(null)
          setIsEditingRequest(false)
        }
      }
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [selectedRequest, showDeleteConfirm])

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

  // Delete the selected resident after confirmation in the custom modal.
  async function handleDeleteResident() {
    const residentId = residentToDelete?.id || residentToDelete?._id

    if (!residentId) {
      setResidentDeleteError('The resident ID is unavailable.')
      return
    }

    setDeletingResident(true)
    setResidentDeleteError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/residents/${residentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete this resident.')
      }

      setResidents((current) =>
        current.filter((resident) => (resident.id || resident._id) !== residentId),
      )
      setResidentToDelete(null)
      setResidentDeleteSuccess(result.message || 'Resident deleted successfully.')
    } catch (error) {
      setResidentDeleteError(error.message || 'Unable to connect to the residents API.')
    } finally {
      setDeletingResident(false)
    }
  }

  const filteredResidents = residents.filter((resident) => {
    const searchableText = [resident.name, resident.email]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchableText.includes(residentSearchTerm.toLowerCase().trim())
  })

  // Keep navigation interactive while the other pages are developed later.
  function handleNavigation(label) {
    setActiveNav(label)
    setSidebarOpen(false)
  }
  
  // Open the edit form with the selected request's current values.
  function beginEditingRequest() {
    setEditFormData({
      title: selectedRequest?.title || '',
      description: selectedRequest?.description || '',
      category: selectedRequest?.category || '',
      building: selectedRequest?.building || '',
      roomNumber: selectedRequest?.roomNumber || '',
      priority: selectedRequest?.priority || 'Medium',
    })
    setRequestEditError('')
    setIsEditingRequest(true)
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target
    setEditFormData((current) => ({ ...current, [name]: value }))
  }

  // Save editable fields through PATCH /api/requests/:id.
  async function handleEditRequestSubmit(event) {
    event.preventDefault()
    setRequestEditError('')

    const cleanedData = Object.fromEntries(
      Object.entries(editFormData).map(([key, value]) => [key, value.trim()]),
    )

    if (
      !cleanedData.title ||
      !cleanedData.description ||
      !cleanedData.category ||
      !cleanedData.building ||
      !cleanedData.roomNumber
    ) {
      setRequestEditError('Please complete all required fields.')
      return
    }

    if (cleanedData.title.length > 100) {
      setRequestEditError('The request title must not exceed 100 characters.')
      return
    }

    const requestId = selectedRequest?._id || selectedRequest?.id
    if (!requestId) {
      setRequestEditError('The maintenance request ID is unavailable.')
      return
    }

    setSavingRequestEdit(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(cleanedData),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to edit the maintenance request.')
      }

      setSelectedRequest(result.request || { ...selectedRequest, ...cleanedData })
      setIsEditingRequest(false)
      setRequestUpdateError('')
      setRequestUpdateSuccess(result.message || 'Request details saved successfully!')
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setRequestEditError(error.message || 'Unable to connect to the maintenance API.')
    } finally {
      setSavingRequestEdit(false)
    }
  }

  // Delete the selected request only after explicit confirmation.
  async function handleDeleteRequest() {
    const requestId = selectedRequest?._id || selectedRequest?.id

    if (!requestId) {
      setDeleteRequestError('The maintenance request ID is unavailable.')
      return
    }

    setDeletingRequest(true)
    setDeleteRequestError('')
    setDeleteRequestError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete the maintenance request.')
      }

      setSelectedRequest(null)
      setShowDeleteConfirm(false)
      setIsEditingRequest(false)
      setRequestEditError('')
      setDeleteRequestError('')
      setRequestUpdateError('')
      setRequestUpdateSuccess('')
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setDeleteRequestError(
        error.message || 'Unable to connect to the maintenance API.',
      )
    } finally {
      setDeletingRequest(false)
    }
  }

  // Send status or assignment changes to Express and refresh the dashboard after success.
  async function handleRequestUpdate(endpoint, payload) {
    setSavingRequestUpdate(true)
    setRequestUpdateError('')
    setRequestUpdateSuccess('')

    try {
      const requestId = selectedRequest?._id || selectedRequest?.id

      if (!requestId) {
        throw new Error('The maintenance request ID is unavailable.')
      }

      const response = await fetch(
        `${API_BASE_URL}/api/requests/${requestId}/${endpoint}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update the request.')
      }

      // Update the open modal immediately using the saved API response.
      setSelectedRequest(result.request)
      setRequestUpdateSuccess(result.message || 'Request updated successfully!')

      // Reload requests and summary figures from MongoDB through Express.
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setRequestUpdateError(
        error.message || 'Unable to connect to the maintenance API.',
      )
    } finally {
      setSavingRequestUpdate(false)
    }
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
              { label: 'Maintenance Team', icon: Wrench },
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
            onClick={onLogout}
            title="Log out of DormCare"
          >
            <div className="avatar avatar-blue">
              {(user?.name || 'User').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{user?.name || 'Signed-in user'}</strong>
              <span>{user?.role || 'User'}</span>
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
 {activeNav === 'Residents' ? (
  <section className="requests-panel residents-panel">
    <div className="panel-heading">
      <div>
        <h2>Residents</h2>
        <p>View registered resident accounts and their contact emails.</p>
      </div>
      <span className="sample-note">{residents.length} resident{residents.length === 1 ? '' : 's'}</span>
    </div>

    <div className="table-toolbar">
      <label className="search-field residents-search-field">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search residents by name or email..."
          value={residentSearchTerm}
          onChange={(event) => setResidentSearchTerm(event.target.value)}
          aria-label="Search residents by name or email"
        />
      </label>
    </div>

    {residentsLoading && (
      <div className="empty-state" role="status">
        <strong>Loading residents...</strong>
        <p>Retrieving registered accounts from the database.</p>
      </div>
    )}

    {residentsError && (
      <div className="empty-state" role="alert">
        <strong>Unable to load residents</strong>
        <p>{residentsError}</p>
      </div>
    )}

    {!residentsLoading && !residentsError && (
      <>
        <div className="table-scroll">
          <table className="requests-table residents-table">
            <thead>
              <tr>
                <th>RESIDENT</th>
                <th>EMAIL ADDRESS</th>
                <th>ACCOUNT ROLE</th>
                <th>DATE REGISTERED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident) => (
                <tr key={resident.id || resident._id}>
                  <td>
                    <div className="resident-cell">
                      <div className="avatar avatar-blue">
                        {(resident.name || 'R').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="request-title">{resident.name || 'Name unavailable'}</span>
                    </div>
                  </td>
                  <td>{resident.email || 'Email unavailable'}</td>
                  <td><StatusBadge value={resident.role || 'Resident'} /></td>
                  <td className="date-cell">{formatDate(resident.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="request-form-cancel"
                      onClick={() => {
                        setResidentDeleteError('')
                        setResidentToDelete(resident)
                      }}
                      style={{ color: '#C83E3E', borderColor: '#F2C7C5', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      aria-label={`Delete ${resident.name || resident.email}`}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResidents.length === 0 && (
          <div className="empty-state">
            <Users size={25} />
            <strong>{residents.length === 0 ? 'No residents registered yet' : 'No matching residents'}</strong>
            <p>
              {residents.length === 0
                ? 'Resident accounts created through registration will appear here.'
                : 'Try a different name or email address.'}
            </p>
          </div>
        )}

        <div className="table-footer">
          <span>Showing <strong>{filteredResidents.length}</strong> of <strong>{residents.length}</strong> residents</span>
          <span className="sample-note">Live API data</span>
        </div>
      </>
    )}
  </section>
 ) : activeNav === 'Maintenance Team' ? (
  <section className="requests-panel maintenance-team-panel">
    <div className="panel-heading">
      <div>
        <h2>Maintenance Team</h2>
        <p>View employees and the maintenance categories they handle.</p>
      </div>
      <span className="sample-note">
        {maintenanceTeam.length} team members
      </span>
    </div>

    {teamLoading && (
      <div className="empty-state" role="status">
        <strong>Loading maintenance team...</strong>
        <p>Connecting to the maintenance API.</p>
      </div>
    )}

    {teamError && (
      <div className="empty-state" role="alert">
        <strong>Unable to load maintenance team</strong>
        <p>{teamError}</p>
      </div>
    )}

    {!teamLoading && !teamError && maintenanceTeam.length === 0 && (
      <div className="empty-state">
        <strong>No team members found</strong>
        <p>Add employees to your maintenance team directory.</p>
      </div>
    )}

    {!teamLoading && !teamError && maintenanceTeam.length > 0 && (
      <div className="maintenance-team-grid">
        {maintenanceTeam.map((employee) => (
          <article
            className="maintenance-team-card"
            key={employee.id}
          >
            <div className="maintenance-team-card-heading">
              <div className="avatar avatar-blue">
                {employee.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h3>{employee.name}</h3>
                <p>{employee.role}</p>
              </div>
            </div>

            <div className="maintenance-team-specialties">
              <strong>Qualified categories</strong>
              <div className="maintenance-team-tags">
                {employee.categories.map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
) : (
  <>
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <Activity size={15} />
                DORMITORY OVERVIEW
              </div>
              <h1>
                Good day, {(user?.name || 'there').split(' ')[0]}! <span>👋</span>
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
          </>
)}
        </div>
      </main>
      
{/* Display the selected maintenance request in a popup modal. */}
{selectedRequest && (
  <div
    className="request-modal-overlay"
    onClick={() => { setSelectedRequest(null); setIsEditingRequest(false); setShowDeleteConfirm(false) }}
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
          onClick={() => { setSelectedRequest(null); setIsEditingRequest(false); setShowDeleteConfirm(false) }}
          aria-label="Close request details"
        >
          ×
        </button>
      </div>

      <div className="request-modal-body">
        {isEditingRequest ? (
          <form onSubmit={handleEditRequestSubmit}>
            <div className="request-form-body">
              <label className="request-form-field">
                Request title *
                <input
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  maxLength={100}
                  required
                />
              </label>

              <label className="request-form-field">
                Description *
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows={4}
                  required
                />
              </label>

              <div className="request-form-grid">
                <label className="request-form-field">
                  Category *
                  <select name="category" value={editFormData.category} onChange={handleEditFormChange} required>
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
                  <select name="priority" value={editFormData.priority} onChange={handleEditFormChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label className="request-form-field">
                  Building *
                  <input name="building" value={editFormData.building} onChange={handleEditFormChange} required />
                </label>

                <label className="request-form-field">
                  Room number *
                  <input name="roomNumber" value={editFormData.roomNumber} onChange={handleEditFormChange} required />
                </label>
              </div>

              {requestEditError && (
                <p className="request-form-message error" role="alert">{requestEditError}</p>
              )}
            </div>

            <div className="request-modal-footer request-form-footer">
              <button
                type="button"
                className="request-form-cancel"
                onClick={() => { setIsEditingRequest(false); setRequestEditError('') }}
                disabled={savingRequestEdit}
              >
                Cancel
              </button>
              <button type="submit" className="request-modal-done" disabled={savingRequestEdit}>
                {savingRequestEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
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
        
{/* Allow administrators to change the request status and assign qualified personnel. */}
<div className="request-update-controls">
  <div className="request-update-field">
    <label htmlFor="request-status">UPDATE STATUS</label>
    <select
      id="request-status"
      value={selectedRequest.status || 'Pending'}
      onChange={(event) =>
        handleRequestUpdate('status', { status: event.target.value })
      }
      disabled={savingRequestUpdate}
    >
      <option value="Pending">Pending</option>
      <option value="Assigned">Assigned</option>
      <option value="In Progress">In Progress</option>
      <option value="Completed">Completed</option>
      <option value="Rejected">Rejected</option>
    </select>
  </div>

  <div className="request-update-field">
    <label htmlFor="request-assignee">ASSIGN MAINTENANCE PERSONNEL</label>
    <select
      id="request-assignee"
      value={
        maintenanceTeam.find(
          (employee) =>
            employee.name === selectedRequest.assignedTo &&
            Array.isArray(employee.categories) &&
            employee.categories.includes(selectedRequest.category),
        )?.id || ''
      }
      onChange={(event) =>
        handleRequestUpdate('assign', { assignedTo: event.target.value })
      }
      disabled={
        savingRequestUpdate ||
        teamLoading ||
        !maintenanceTeam.some(
          (employee) =>
            Array.isArray(employee.categories) &&
            employee.categories.includes(selectedRequest.category),
        )
      }
    >
      <option value="">Select qualified employee</option>
      {maintenanceTeam
        .filter(
          (employee) =>
            Array.isArray(employee.categories) &&
            employee.categories.includes(selectedRequest.category),
        )
        .map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
    </select>

    {!teamLoading &&
      !maintenanceTeam.some(
        (employee) =>
          Array.isArray(employee.categories) &&
          employee.categories.includes(selectedRequest.category),
      ) && (
        <p className="request-form-message error" role="alert">
          No employees are available for this category.
        </p>
      )}
  </div>

  {savingRequestUpdate && (
    <p className="request-form-message" role="status">
      Saving changes...
    </p>
  )}

  {requestUpdateError && (
    <p className="request-form-message error" role="alert">
      {requestUpdateError}
    </p>
  )}

  {requestUpdateSuccess && (
    <p className="request-form-message success" role="status">
      {requestUpdateSuccess}
    </p>
  )}
</div>
          </>
        )}
      </div>

      {!isEditingRequest && (
        <>
          {deleteRequestError && (
            <p className="request-form-message error" role="alert">
              {deleteRequestError}
            </p>
          )}
          <div className="request-modal-footer">
            <button
              type="button"
              className="request-form-cancel"
              onClick={() => {
                setDeleteRequestError('')
                setShowDeleteConfirm(true)
              }}
              disabled={deletingRequest || savingRequestUpdate}
              aria-label="Delete maintenance request"
              style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Trash2 size={16} />
              Delete Request
            </button>
            <button
              type="button"
              className="request-form-cancel"
              onClick={beginEditingRequest}
              disabled={deletingRequest}
            >
              Edit Request
            </button>
            <button
              type="button"
              className="request-modal-done"
              disabled={deletingRequest}
              onClick={() => {
                setSelectedRequest(null);
                setIsEditingRequest(false);
                setRequestEditError('');
                setDeleteRequestError('');
                setRefreshKey((prev) => prev + 1);
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </section>
  </div>
)}

{/* Custom confirmation modal for deleting a resident account. */}
      {residentToDelete && (
        <div
          className="request-modal-overlay"
          style={{ zIndex: 2100 }}
          onClick={() => { if (!deletingResident) { setResidentToDelete(null); setResidentDeleteError('') } }}
        >
          <section
            className="request-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="resident-delete-title"
            aria-describedby="resident-delete-description"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(100% - 32px, 440px)', maxWidth: '440px', maxHeight: 'none' }}
          >
            <div className="request-modal-body" style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDE8E7', color: '#C83E3E' }}>
                <Trash2 size={27} />
              </div>
              <h2 id="resident-delete-title" style={{ margin: '0 0 10px' }}>Delete Resident Account?</h2>
              <p id="resident-delete-description" style={{ margin: 0, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{residentToDelete.name || residentToDelete.email || 'this resident'}</strong>? This action cannot be undone.
              </p>
              {residentDeleteError && (
                <p className="request-form-message error" role="alert" style={{ marginTop: '14px' }}>
                  {residentDeleteError}
                </p>
              )}
            </div>
            <div className="request-modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button type="button" className="request-form-cancel" onClick={() => { setResidentToDelete(null); setResidentDeleteError('') }} disabled={deletingResident}>Cancel</button>
              <button type="button" className="request-modal-done" onClick={handleDeleteResident} disabled={deletingResident} style={{ background: '#C83E3E', borderColor: '#C83E3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Trash2 size={16} /> {deletingResident ? 'Deleting...' : 'Delete Resident'}
              </button>
            </div>
          </section>
        </div>
      )}

      {residentDeleteSuccess && (
        <div className="request-modal-overlay" style={{ zIndex: 2200 }} onClick={() => setResidentDeleteSuccess('')}>
          <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="resident-delete-success-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(100% - 32px, 420px)', maxWidth: '420px', maxHeight: 'none' }}>
            <div className="request-modal-body" style={{ padding: '28px', textAlign: 'center' }}>
              <CheckCircle2 size={42} color="#218653" />
              <h2 id="resident-delete-success-title">Resident Deleted</h2>
              <p>{residentDeleteSuccess}</p>
            </div>
            <div className="request-modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="request-modal-done" onClick={() => setResidentDeleteSuccess('')}>Done</button>
            </div>
          </section>
        </div>
      )}

{/* Custom centered confirmation modal for deleting a maintenance request. */}
      {showDeleteConfirm && selectedRequest && (
        <div
          className="request-modal-overlay"
          style={{ zIndex: 2000 }}
          onClick={() => {
            if (!deletingRequest) setShowDeleteConfirm(false)
          }}
        >
          <section
            className="request-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-description"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(100% - 32px, 440px)', maxWidth: '440px', maxHeight: 'none' }}
          >
            <div className="request-modal-body" style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
              <div
                aria-hidden="true"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  margin: '0 auto 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FDE8E7',
                  color: '#C83E3E',
                }}
              >
                <Trash2 size={27} />
              </div>
              <h2 id="delete-confirm-title" style={{ margin: '0 0 10px' }}>
                Delete Maintenance Request?
              </h2>
              <p id="delete-confirm-description" style={{ margin: 0, lineHeight: 1.6 }}>
                Are you sure you want to delete &quot;{selectedRequest.title || 'this maintenance request'}&quot;?
                This action cannot be undone.
              </p>
              {deleteRequestError && (
                <p className="request-form-message error" role="alert" style={{ marginTop: '14px' }}>
                  {deleteRequestError}
                </p>
              )}
            </div>
            <div className="request-modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="request-form-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteRequestError('')
                }}
                disabled={deletingRequest}
              >
                Cancel
              </button>
              <button
                type="button"
                className="request-modal-done"
                onClick={handleDeleteRequest}
                disabled={deletingRequest}
                style={{ background: '#C83E3E', borderColor: '#C83E3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Trash2 size={16} />
                {deletingRequest ? 'Deleting...' : 'Delete Request'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Show the submission form when the user opens Submit a Request. */}
      {activeNav === 'Submit a Request' && (
        <RequestFormModal
          authToken={authToken}
          onClose={() => setActiveNav('Dashboard')}
          onCreated={() => setRefreshKey((current) => current + 1)}
        />
      )}
  </div>
  )
}

const AUTH_TOKEN_KEY = 'dormcareToken'
const AUTH_USER_KEY = 'dormcareUser'

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign in. Check your credentials and try again.')
      }
      if (!result.token || !result.user) {
        throw new Error('The login response is missing the session token or user details.')
      }
      if (result.user.role !== 'Admin') {
        throw new Error('This dashboard is currently for administrators. Please use an Admin account.')
      }

      onLogin(result.token, result.user)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to connect to DormCare. Check that the backend is running.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-icon"><Building2 size={27} /></div>
        <p className="login-eyebrow">DORMITORY MAINTENANCE SYSTEM</p>
        <h1 id="login-title">Welcome to DormCare</h1>
        <p className="login-description">Sign in with your administrator account to manage dormitory maintenance.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-field">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
        <p className="login-security-note"><ShieldCheck size={15} /> Secure administrator access</p>
      </section>
      <p className="login-footer">DormCare · Dormitory Maintenance System</p>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
      const user = JSON.parse(sessionStorage.getItem(AUTH_USER_KEY) || 'null')
      if (token && user?.role === 'Admin') return { token, user }
    } catch {
      // Start signed out if stored session data is malformed or unavailable.
    }
    return null
  })

  function handleLogin(token, user) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    setSession({ token, user })
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
    setSession(null)
  }

  if (!session) return <LoginPage onLogin={handleLogin} />

  return (
    <DashboardApp
      authToken={session.token}
      user={session.user}
      onLogout={handleLogout}
    />
  )
}

export default App
