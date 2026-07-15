import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api } from '../api/client'
import type { KycProfile } from '../api/client'

const initialForm = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  phone: '',
  email: '',
  country: '',
  province: '',
  district: '',
  street: '',
  postal_code: '',
  document_type: 'PASSPORT',
  document_number: '',
}

type KycFormFields = typeof initialForm

interface KycFiles {
  document_front: File | null
  document_back: File | null
  selfie: File | null
}

export default function KycForm() {
  const [form, setForm] = useState<KycFormFields>(initialForm)
  const [files, setFiles] = useState<KycFiles>({
    document_front: null,
    document_back: null,
    selfie: null,
  })
  const [existing, setExisting] = useState<KycProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const profile = await api.getMyKyc()
        if (active) {
          setExisting(profile)
        }
      } catch {
        if (active) {
          setExisting(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, files: selected } = event.target
    setFiles((current) => ({ ...current, [name]: selected?.[0] ?? null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          payload.append(key, value)
        }
      })
      if (files.document_front) {
        payload.append('document_front', files.document_front)
      }
      if (files.selfie) {
        payload.append('selfie', files.selfie)
      }
      if (files.document_back) {
        payload.append('document_back', files.document_back)
      }

      let profile: KycProfile
      if (isEditing) {
        profile = await api.updateKyc(payload)
        setSuccess('KYC updated successfully. Your profile is pending review.')
        setIsEditing(false)
      } else {
        profile = await api.submitKyc(payload)
        setSuccess('KYC submitted successfully. Your profile is pending review.')
      }
      setExisting(profile)
      setForm(initialForm)
      setFiles({ document_front: null, document_back: null, selfie: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit KYC.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="card">Loading KYC status…</div>
  }

  if (existing && !isEditing) {
    const canUpdate = ['PENDING', 'DRAFT', 'REJECTED'].includes(existing.status)

    return (
      <section className="card">
        <div className="badge badge-success">KYC Submitted</div>
        <h2>Verification profile</h2>
        {success && <p className="success full-width" style={{ marginBottom: '1.5rem' }}>{success}</p>}
        <dl className="profile-grid">
          <div>
            <dt>Full name</dt>
            <dd>{existing.full_name}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{existing.date_of_birth}</dd>
          </div>
          <div>
            <dt>Nationality</dt>
            <dd>{existing.nationality}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{existing.phone}</dd>
          </div>
          <div>
            <dt>Document</dt>
            <dd>
              {existing.document_type.replace('_', ' ')} — {existing.document_number}
            </dd>
          </div>
          <div className="full-width">
            <dt>Address</dt>
            <dd>
              {existing.street}, {existing.district}, {existing.province}, {existing.country}{' '}
              {existing.postal_code}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd className={`status status-${existing.status.toLowerCase()}`}>
              {existing.status}
            </dd>
          </div>
          {existing.tx_hash && (
            <div className="full-width">
              <dt>Blockchain tx</dt>
              <dd>{existing.tx_hash}</dd>
            </div>
          )}
        </dl>

        {canUpdate && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setForm({
                  full_name: existing.full_name,
                  date_of_birth: existing.date_of_birth,
                  gender: existing.gender,
                  nationality: existing.nationality,
                  phone: existing.phone,
                  email: existing.email || '',
                  country: existing.country,
                  province: existing.province,
                  district: existing.district,
                  street: existing.street,
                  postal_code: existing.postal_code,
                  document_type: existing.document_type,
                  document_number: existing.document_number,
                })
                setIsEditing(true)
                setError('')
                setSuccess('')
              }}
            >
              Update Information
            </button>
          </div>
        )}
      </section>
    )
  }

  const needsBackImage = form.document_type !== 'PASSPORT'

  return (
    <section className="card">
      <div className="badge">Step 2</div>
      <h2>KYC verification form</h2>
      <p>Complete your identity details and upload documents after wallet login.</p>

      <form className="kyc-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input name="full_name" value={form.full_name} onChange={handleChange} required />
        </label>

        <label>
          Date of birth
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Gender
          <input name="gender" value={form.gender} onChange={handleChange} required />
        </label>

        <label>
          Nationality
          <input name="nationality" value={form.nationality} onChange={handleChange} required />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} />
        </label>

        <label>
          Country
          <input name="country" value={form.country} onChange={handleChange} required />
        </label>

        <label>
          Province
          <input name="province" value={form.province} onChange={handleChange} required />
        </label>

        <label>
          District
          <input name="district" value={form.district} onChange={handleChange} required />
        </label>

        <label>
          Street
          <input name="street" value={form.street} onChange={handleChange} required />
        </label>

        <label>
          Postal code
          <input name="postal_code" value={form.postal_code} onChange={handleChange} required />
        </label>

        <label>
          Document type
          <select name="document_type" value={form.document_type} onChange={handleChange} required>
            <option value="PASSPORT">Passport</option>
            <option value="CITIZENSHIP">Citizenship</option>
            <option value="NATIONAL_ID">National ID</option>
            <option value="DRIVING_LICENSE">Driving License</option>
          </select>
        </label>

        <label>
          Document number
          <input
            name="document_number"
            value={form.document_number}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Document front
          <input
            type="file"
            name="document_front"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            required={!isEditing}
          />
        </label>

        {needsBackImage && (
          <label>
            Document back
            <input
              type="file"
              name="document_back"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required={!isEditing}
            />
          </label>
        )}

        <label>
          Selfie
          <input
            type="file"
            name="selfie"
            accept="image/*"
            onChange={handleFileChange}
            required={!isEditing}
          />
        </label>

        {error && <p className="error full-width">{error}</p>}
        {success && <p className="success full-width">{success}</p>}

        <div className="form-actions full-width" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : isEditing ? 'Save Updates' : 'Submit KYC'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false)
                setError('')
                setSuccess('')
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
