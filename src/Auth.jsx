
import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        })

        if (error) throw error

        if (data.session) {
          setMessage('Account created! You can start using CampusHub.')
        } else {
          setMessage(
            'Account created! Check your email to confirm, then log in.'
          )
          setIsSignUp(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.heading}>CampusHub</h1>
        <p style={styles.subtitle}>
          {isSignUp
            ? 'Create your student account'
            : 'Welcome back! Please log in.'}
        </p>

        {isSignUp && (
          <label style={styles.label}>
            Full name
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label style={styles.label}>
          Email address
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </label>

        {message && <p style={styles.message}>{message}</p>}

        <button style={styles.button} disabled={loading}>
          {loading
            ? 'Please wait...'
            : isSignUp
              ? 'Create Account'
              : 'Login'}
        </button>

        <p style={styles.switchText}>
          {isSignUp
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            style={styles.link}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'linear-gradient(135deg, #eaf0ff, #f8faff)',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    boxSizing: 'border-box',
    padding: 32,
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 12px 35px rgba(30, 60, 120, 0.12)'
  },
  logo: {
    textAlign: 'center',
    fontSize: 42
  },
  heading: {
    textAlign: 'center',
    color: '#2457c5',
    marginBottom: 8
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 25
  },
  label: {
    display: 'block',
    marginBottom: 16,
    color: '#334155',
    fontSize: 14,
    fontWeight: 600
  },
  input: {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    padding: 12,
    marginTop: 7,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 15
  },
  button: {
    width: '100%',
    padding: 13,
    border: 0,
    borderRadius: 8,
    background: '#2457c5',
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  message: {
    color: '#b45309',
    fontSize: 14,
    overflowWrap: 'anywhere'
  },
  switchText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#475569',
    fontSize: 14
  },
  link: {
    border: 0,
    background: 'none',
    color: '#2457c5',
    fontWeight: 600,
    cursor: 'pointer'
  }
}