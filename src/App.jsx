import StudentProfile from './StudentProfile'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [assignments, setAssignments] = useState([])
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        setMessage(error.message)
      }

      setSession(data?.session ?? null)
      setAuthLoading(false)
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setAssignments([])
      setEvents([])
      return
    }

    let active = true

    async function loadData() {
      setLoading(true)
      setMessage('')

      const [assignmentResult, eventResult] = await Promise.all([
        supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('campus_events')
          .select('*')
          .order('event_date', { ascending: true })
      ])

      if (!active) return

      if (assignmentResult.error) {
        setMessage('Assignments: ' + assignmentResult.error.message)
      } else {
        setAssignments(assignmentResult.data || [])
      }

      if (eventResult.error) {
        setMessage((previous) =>
          previous
            ? previous + ' | Events: ' + eventResult.error.message
            : 'Events: ' + eventResult.error.message
        )
      } else {
        setEvents(eventResult.data || [])
      }

      setLoading(false)
    }

    loadData()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  async function addAssignment(e) {
    e.preventDefault()

    if (!title.trim() || !session?.user) return

    setMessage('')
    setLoading(true)

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      setMessage('Could not add assignment: ' + error.message)
      return
    }

    setAssignments((previous) => [data, ...previous])
    setTitle('')
    setDescription('')
    setDueDate('')
    setPage('assignments')
    setMessage('Assignment saved successfully!')
  }

  async function toggleAssignment(assignment) {
    setMessage('')

    const { data, error } = await supabase
      .from('assignments')
      .update({ completed: !assignment.completed })
      .eq('id', assignment.id)
      .select()
      .single()

    if (error) {
      setMessage('Could not update assignment: ' + error.message)
      return
    }

    setAssignments((previous) =>
      previous.map((item) => item.id === data.id ? data : item)
    )
  }

  async function deleteAssignment(id) {
    setMessage('')

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage('Could not delete assignment: ' + error.message)
      return
    }

    setAssignments((previous) =>
      previous.filter((item) => item.id !== id)
    )
    setMessage('Assignment deleted.')
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage('Logout failed: ' + error.message)
    }
  }

  if (authLoading) {
    return (
      <div style={styles.center}>
        <h2>Loading CampusHub...</h2>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  const user = session.user
  const userName =
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Student'

  const completedCount = assignments.filter(
    (item) => item.completed
  ).length

  const pendingCount = assignments.length - completedCount

  const theme = darkMode ? styles.dark : styles.light

  return (
    <div style={{ ...styles.app, ...theme }}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brand}>🎓 CampusHub</h1>
          <p style={styles.headerSub}>Your smart campus companion</p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button style={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.profile}>
            <div style={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <strong>{userName}</strong>
            <span style={styles.email}>{user.email}</span>
          </div>

          {[
            ['dashboard', '🏠 Dashboard'],
            ['assignments', '📝 Assignments'],
            ['events', '📅 Campus Events'],
            ['profile', '👤 My Profile']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setPage(key)
                setMessage('')
              }}
              style={{
                ...styles.navButton,
                ...(page === key ? styles.activeNav : {})
              }}
            >
              {label}
            </button>
          ))}
        </aside>

        <main style={styles.main}>
          {message && (
            <div style={styles.notice} role="status">
              {message}
              <button
                style={styles.dismiss}
                onClick={() => setMessage('')}
              >
                ×
              </button>
            </div>
          )}

          {page === 'dashboard' && (
            <>
              <h2 style={styles.pageTitle}>Hello, {userName}! 👋</h2>
              <p style={styles.muted}>
                Welcome back to your campus dashboard.
              </p>

              <div style={styles.stats}>
                <Stat title="Total Assignments" value={assignments.length} />
                <Stat title="Pending" value={pendingCount} />
                <Stat title="Completed" value={completedCount} />
                <Stat title="Campus Events" value={events.length} />
              </div>

              <section style={styles.panel}>
                <h3>Quick Add Assignment</h3>
                <AssignmentForm
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                  onSubmit={addAssignment}
                  loading={loading}
                />
              </section>

              <section style={styles.panel}>
                <h3>Recent Assignments</h3>
                <AssignmentList
                  assignments={assignments.slice(0, 5)}
                  onToggle={toggleAssignment}
                  onDelete={deleteAssignment}
                />
                {assignments.length > 5 && (
                  <button
                    style={styles.textButton}
                    onClick={() => setPage('assignments')}
                  >
                    View all assignments →
                  </button>
                )}
              </section>
            </>
          )}

          {page === 'assignments' && (
            <>
              <h2 style={styles.pageTitle}>My Assignments 📝</h2>
              <p style={styles.muted}>
                Your assignments are saved in Supabase.
              </p>

              <section style={styles.panel}>
                <h3>Add Assignment</h3>
                <AssignmentForm
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                  onSubmit={addAssignment}
                  loading={loading}
                />
              </section>

              <section style={styles.panel}>
                <h3>All Assignments</h3>
                {loading && <p>Loading...</p>}
                <AssignmentList
                  assignments={assignments}
                  onToggle={toggleAssignment}
                  onDelete={deleteAssignment}
                />
              </section>
            </>
          )}

          {page === 'events' && (
            <>
              <h2 style={styles.pageTitle}>Campus Events 📅</h2>
              <p style={styles.muted}>
                Events available to signed-in students.
              </p>

              <section style={styles.panel}>
                {events.length === 0 ? (
                  <p>
                    No campus events found. Add some sample events in
                    Supabase Table Editor to display them here.
                  </p>
                ) : (
                  events.map((event) => (
                    <article key={event.id} style={styles.eventCard}>
                      <h3>{event.title}</h3>
                      <p>{event.description || 'No description provided.'}</p>
                      {event.event_date && (
                        <p style={styles.muted}>
                          📅 {new Date(event.event_date).toLocaleString()}
                        </p>
                      )}
                      {event.location && <p>📍 {event.location}</p>}
                    </article>
                  ))
                )}
              </section>
            </>
          )}
          
{page === 'profile' && (
  <>
    <StudentProfile />
  </>
)}
        </main>
      </div>

      <footer style={styles.footer}>
        CampusHub • Smart Campus Management
      </footer>
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{title}</p>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  )
}

function AssignmentForm({
  title,
  setTitle,
  description,
  setDescription,
  dueDate,
  setDueDate,
  onSubmit,
  loading
}) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <label style={styles.field}>
        Assignment title *
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Database project"
          required
        />
      </label>

      <label style={styles.field}>
        Description
        <textarea
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Assignment details"
          rows={3}
        />
      </label>

      <label style={styles.field}>
        Due date
        <input
          style={styles.input}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>

      <button style={styles.primaryButton} disabled={loading}>
        {loading ? 'Saving...' : '+ Add Assignment'}
      </button>
    </form>
  )
}

function AssignmentList({ assignments, onToggle, onDelete }) {
  if (assignments.length === 0) {
    return <p>No assignments yet. Add your first assignment above!</p>
  }

  return (
    <div style={styles.list}>
      {assignments.map((item) => (
        <article key={item.id} style={styles.assignmentCard}>
          <label style={styles.assignmentTitle}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(item)}
            />
            <span
              style={{
                textDecoration: item.completed ? 'line-through' : 'none',
                opacity: item.completed ? 0.6 : 1
              }}
            >
              {item.title}
            </span>
          </label>

          {item.description && <p>{item.description}</p>}

          <div style={styles.assignmentFooter}>
            <span style={styles.muted}>
              {item.due_date
                ? `Due: ${item.due_date}`
                : 'No due date'}
            </span>
            <button
              style={styles.deleteButton}
              onClick={() => onDelete(item.id)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    transition: 'background 0.2s, color 0.2s'
  },
  light: {
    background: '#f4f7fc',
    color: '#1e293b'
  },
  dark: {
    background: '#111827',
    color: '#f3f4f6'
  },
  center: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    padding: '18px 5%',
    background: '#2457c5',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16
  },
  brand: {
    margin: 0,
    fontSize: 25
  },
  headerSub: {
    margin: '5px 0 0',
    opacity: 0.85,
    fontSize: 13
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  secondaryButton: {
    padding: '10px 13px',
    border: '1px solid #ffffff80',
    borderRadius: 8,
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer'
  },
  logoutButton: {
    padding: '10px 14px',
    border: 0,
    borderRadius: 8,
    background: '#dc4646',
    color: '#fff',
    cursor: 'pointer'
  },
  layout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
    maxWidth: 1400,
    margin: '0 auto',
    padding: 24
  },
  sidebar: {
    width: 235,
    minWidth: 200,
    padding: 18,
    background: '#ffffff',
    color: '#1e293b',
    borderRadius: 14,
    boxShadow: '0 3px 14px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  profile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '10px 4px 20px',
    textAlign: 'center',
    overflowWrap: 'anywhere'
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: '50%',
    background: '#dce8ff',
    color: '#2457c5',
    display: 'grid',
    placeItems: 'center',
    fontSize: 24,
    fontWeight: 700
  },
  avatarLarge: {
    width: 75,
    height: 75,
    borderRadius: '50%',
    background: '#dce8ff',
    color: '#2457c5',
    display: 'grid',
    placeItems: 'center',
    fontSize: 30,
    fontWeight: 700
  },
  email: {
    color: '#64748b',
    fontSize: 12,
    overflowWrap: 'anywhere'
  },
  navButton: {
    textAlign: 'left',
    padding: '12px 10px',
    border: 0,
    borderRadius: 8,
    background: 'transparent',
    color: '#334155',
    cursor: 'pointer',
    fontSize: 14
  },
  activeNav: {
    background: '#e6eeff',
    color: '#2457c5',
    fontWeight: 700
  },
  main: {
    flex: 1,
    minWidth: 0
  },
  pageTitle: {
    margin: '5px 0 8px',
    fontSize: 28
  },
  muted: {
    color: '#64748b',
    fontSize: 14
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
    gap: 14,
    margin: '24px 0'
  },
  statCard: {
    padding: 20,
    background: '#fff',
    color: '#1e293b',
    borderRadius: 12,
    boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
  },
  statLabel: {
    margin: '0 0 10px',
    color: '#64748b',
    fontSize: 13
  },
  statValue: {
    fontSize: 28,
    color: '#2457c5'
  },
  panel: {
    marginBottom: 22,
    padding: 22,
    background: '#fff',
    color: '#1e293b',
    borderRadius: 14,
    boxShadow: '0 3px 14px rgba(0,0,0,0.04)'
  },
  form: {
    display: 'grid',
    gap: 15
  },
  field: {
    display: 'grid',
    gap: 7,
    fontSize: 14,
    fontWeight: 600,
    color: '#334155'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'inherit'
  },
  primaryButton: {
    justifySelf: 'start',
    padding: '12px 18px',
    border: 0,
    borderRadius: 8,
    background: '#2457c5',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  list: {
    display: 'grid',
    gap: 12
  },
  assignmentCard: {
    padding: 15,
    border: '1px solid #e2e8f0',
    borderRadius: 10
  },
  assignmentTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 700
  },
  assignmentFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap'
  },
  deleteButton: {
    border: 0,
    borderRadius: 6,
    padding: '7px 10px',
    background: '#fee2e2',
    color: '#b91c1c',
    cursor: 'pointer'
  },
  textButton: {
    marginTop: 14,
    border: 0,
    background: 'transparent',
    color: '#2457c5',
    cursor: 'pointer'
  },
  eventCard: {
    padding: 15,
    marginBottom: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 10
  },
  notice: {
    position: 'relative',
    padding: '12px 40px 12px 14px',
    marginBottom: 18,
    borderRadius: 8,
    background: '#fff7ed',
    color: '#9a3412',
    overflowWrap: 'anywhere'
  },
  dismiss: {
    position: 'absolute',
    right: 10,
    top: 5,
    border: 0,
    background: 'transparent',
    fontSize: 23,
    cursor: 'pointer',
    color: 'inherit'
  },
  footer: {
    padding: 20,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13
  }
}