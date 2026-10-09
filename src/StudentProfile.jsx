
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    course: '',
    department: '',
    year: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Please sign in to view your profile.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        setMessage(error.message)
      } else {
        setProfile({
          full_name: data?.full_name || '',
          email: user.email || data?.email || '',
          course: data?.course || '',
          department: data?.department || '',
          year: data?.year || '',
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user }, error: userError } =
      await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Please sign in again.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: profile.full_name,
          email: user.email,
          course: profile.course,
          department: profile.department,
          year: profile.year,
        },
        { onConflict: 'id' }
      )

    setMessage(error ? error.message : 'Profile saved successfully!')
    setSaving(false)
  }

  if (loading) return <p>Loading student profile...</p>

  return (
    <section style={styles.container}>
      <h2>Student Profile</h2>
      <p style={styles.subtitle}>
        View and update your student information.
      </p>

      <form onSubmit={saveProfile} style={styles.form}>
        <label>Full Name</label>
        <input
          name="full_name"
          value={profile.full_name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={profile.email}
          readOnly
          style={styles.readOnly}
        />

        <label>Course</label>
        <input
          name="course"
          value={profile.course}
          onChange={handleChange}
          placeholder="e.g. BCA, B.Tech, BSc"
        />

        <label>Department</label>
        <input
          name="department"
          value={profile.department}
          onChange={handleChange}
          placeholder="Enter your department"
        />

        <label>Year of Study</label>
        <select
          name="year"
          value={profile.year}
          onChange={handleChange}
        >
          <option value="">Select year</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </section>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '24px auto',
    padding: '24px',
    background: '#ffffff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
  },
  subtitle: {
    color: '#64748b',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  readOnly: {
    background: '#f1f5f9',
  },
}
