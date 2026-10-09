
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('campus_events')
        .select('*')
        .order('event_date', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setEvents(data || [])
      }

      setLoading(false)
    }

    loadEvents()
  }, [])

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>CAMPUS LIFE</p>
          <h2 style={styles.title}>Upcoming Events</h2>
          <p style={styles.subtitle}>
            Discover what's happening on campus.
          </p>
        </div>
        <span style={styles.count}>
          {events.length} Events
        </span>
      </div>

      {loading && <p>Loading events...</p>}

      {error && (
        <p style={styles.error}>
          Could not load events: {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p>No events yet. Please check back soon!</p>
      )}

      <div style={styles.grid}>
        {events.map((event) => (
          <article key={event.id} style={styles.card}>
            <div style={styles.icon}>📅</div>

            <p style={styles.date}>
              {event.event_date
                ? new Date(
                    `${event.event_date.slice(0, 10)}T12:00:00`
                  ).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date to be announced'}
            </p>

            <h3 style={styles.eventTitle}>
              {event.title}
            </h3>

            <p style={styles.description}>
              {event.description || 'More details coming soon.'}
            </p>

            <div style={styles.location}>
              <span>📍</span>
              <span>{event.location || 'Location to be announced'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const styles = {
  section: {
    padding: '28px',
    background: '#f8fafc',
    borderRadius: '18px',
    color: '#172033',
  },
  heading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  eyebrow: {
    color: '#4f46e5',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    margin: '0 0 8px',
  },
  title: {
    fontSize: '28px',
    margin: '0 0 8px',
  },
  subtitle: {
    color: '#64748b',
    margin: 0,
  },
  count: {
    background: '#e0e7ff',
    color: '#4338ca',
    padding: '9px 14px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '13px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '18px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)',
  },
  icon: {
    fontSize: '28px',
    marginBottom: '12px',
  },
  date: {
    color: '#4f46e5',
    fontSize: '13px',
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: '19px',
    lineHeight: 1.4,
    margin: '10px 0',
  },
  description: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: 1.7,
    minHeight: '48px',
  },
  location: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '14px',
    marginTop: '18px',
    fontSize: '13px',
    color: '#475569',
  },
  error: {
    color: '#b91c1c',
    background: '#fef2f2',
    padding: '12px',
    borderRadius: '8px',
  },
}