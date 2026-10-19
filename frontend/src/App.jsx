
import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
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

// Temporary dashboard figures for UI development.
// We will replace these sample values with API data in a later milestone.
const summaryCards = [
  {
    title: 'Total Requests',
    value: '128',
    detail: 'All maintenance requests',
    icon: ClipboardList,
    tone: 'blue',
    trend: '+12%',
    trendDirection: 'up',
  },
  {
    title: 'Pending',
    value: '24',
    detail: 'Waiting for review',
    icon: Clock3,
    tone: 'orange',
    trend: 'Needs review',
    trendDirection: 'down',
  },
  {
    title: 'In Progress',
    value: '18',
    detail: 'Currently being handled',
    icon: Wrench,
    tone: 'purple',
    trend: 'Active work',
    trendDirection: 'up',
  },
  {
    title: 'Completed',
    value: '86',
    detail: 'Successfully resolved',
    icon: CheckCircle2,
    tone: 'green',
    trend: '+8%',
    trendDirection: 'up',
  },
]

// Sample requests are for layout testing only, not real resident records.
const sampleRequests = [
  {
    id: 'DM-1028',
    title: 'Leaking bathroom faucet',
    location: 'Room 204 · Building A',
    category: 'Plumbing',
    priority: 'High',
    status: 'In Progress',
    date: 'Oct 19, 2026',
    resident: 'Alex Morgan',
  },
  {
    id: 'DM-1027',
    title: 'Broken ceiling light',
    location: 'Room 115 · Building B',
    category: 'Electrical',
    priority: 'Medium',
    status: 'Pending',
    date: 'Oct 19, 2026',
    resident: 'Jamie Lee',
  },
  {
    id: 'DM-1026',
    title: 'Air conditioner not cooling',
    location: 'Room 310 · Building A',
    category: 'HVAC',
    priority: 'High',
    status: 'In Progress',
    date: 'Oct 18, 2026',
    resident: 'Taylor Reed',
  },
  {
    id: 'DM-1025',
    title: 'Damaged study desk',
    location: 'Room 022 · Building C',
    category: 'Furniture',
    priority: 'Low',
    status: 'Completed',
    date: 'Oct 17, 2026',
    resident: 'Jordan Blake',
  },
  {
    id: 'DM-1024',
    title: 'Slow drainage',
    location: 'Room 208 · Building B',
    category: 'Plumbing',
    priority: 'Medium',
    status: 'Pending',
    date: 'Oct 16, 2026',
    resident: 'Casey Taylor',
  },
]

// Reusable badge component keeps request status and priority styling consistent.
function StatusBadge({ value }) {
  const className = value.toLowerCase().replaceAll(' ', '-')

  return <span className={`status-badge ${className}`}>{value}</span>
}

// Main dashboard layout with temporary navigation and sample maintenance data.
function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')

  // Filter the sample table by request details and selected status.
  const filteredRequests = sampleRequests.filter((request) => {
    const searchableText = [
      request.id,
      request.title,
      request.location,
      request.category,
      request.resident,
    ]
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
                  <span className="nav-count">24</span>
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

          <button className="profile-row" onClick={() => handleNavigation('Profile')}>
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
              System operational
            </div>
            <button className="icon-button notification-button" aria-label="Notifications">
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
              <h1>Good day, Admin! <span>👋</span></h1>
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

          <section className="summary-grid" aria-label="Maintenance summary">
            {summaryCards.map((card) => {
              const Icon = card.icon
              const TrendIcon =
                card.trendDirection === 'down' ? ArrowDownRight : ArrowUpRight

              return (
                <article className="summary-card" key={card.title}>
                  <div className="summary-card-top">
                    <div className={`summary-icon icon-${card.tone}`}>
                      <Icon size={21} />
                    </div>
                    <span className={`summary-trend trend-${card.trendDirection}`}>
                      {card.trendDirection === 'up' && <TrendIcon size={14} />}
                      {card.trend}
                    </span>
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
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>
            </div>

            <div className="table-scroll">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>REQUEST</th>
                    <th>RESIDENT</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>DATE SUBMITTED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="request-title">{request.title}</div>
                        <div className="request-meta">
                          {request.id} <span>·</span> {request.location}
                        </div>
                      </td>
                      <td>
                        <div className="resident-cell">
                          <div className="avatar avatar-light">
                            {request.resident
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </div>
                          <span>{request.resident}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge value={request.priority} />
                      </td>
                      <td>
                        <StatusBadge value={request.status} />
                      </td>
                      <td className="date-cell">{request.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="empty-state">
                  <Search size={25} />
                  <strong>No matching requests</strong>
                  <p>Try another search term or status filter.</p>
                </div>
              )}
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredRequests.length}</strong> of{' '}
                <strong>{sampleRequests.length}</strong> sample requests
              </span>
              <span className="sample-note">Demo data</span>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 DormCare Maintenance Portal</span>
            <span>Built for a better dormitory experience.</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
