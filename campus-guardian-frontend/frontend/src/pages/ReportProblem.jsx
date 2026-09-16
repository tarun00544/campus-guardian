import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import { createComplaint } from '../services/complaintService';
import { getErrorMessage } from '../services/api';

export const CATEGORIES = ['Wi-Fi', 'Electricity', 'Water', 'Washroom', 'Classroom', 'Furniture', 'Cleanliness', 'Other'];
export const LOCATIONS = ['Block A', 'Block B', 'Hostel', 'Library', 'Cafeteria', 'Main Gate', 'Academic Block', 'Ground', 'Parking', 'Other'];

const ReportProblem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Pick an image under 5 MB.');
      return;
    }
    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreview('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim() || !form.category || !form.location) {
      setError('Fill in the title, description, category and location.');
      return;
    }

    setSubmitting(true);
    try {
      // multipart only when there is a file to send
      let payload = form;
      if (image) {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        data.append('image', image);
        payload = data;
      }
      await createComplaint(payload);
      setSuccess('Complaint submitted. Taking you to your complaints...');
      setTimeout(() => navigate('/my-complaints'), 900);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 720 }}>
      <h1 className="cg-page-title">Report a campus problem</h1>
      <p className="cg-page-sub">Be specific about where it is. A photo helps the team find it faster.</p>

      <div className="cg-card">
        <form className="cg-card-body" onSubmit={submit} noValidate>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <div className="mb-3">
            <label className="form-label" htmlFor="title">Title</label>
            <input id="title" name="title" className="form-control" value={form.title} onChange={change}
              maxLength={120} placeholder="Ceiling fan not working in Room 204" required />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="description">What is wrong?</label>
            <textarea id="description" name="description" className="form-control" rows={4}
              value={form.description} onChange={change} placeholder="Describe the problem and how long it has been like this." required />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label className="form-label" htmlFor="category">Category</label>
              <select id="category" name="category" className="form-select" value={form.category} onChange={change} required>
                <option value="">Choose a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-sm-6">
              <label className="form-label" htmlFor="location">Location</label>
              <select id="location" name="location" className="form-select" value={form.location} onChange={change} required>
                <option value="">Choose a location</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="image">Photo (optional)</label>
            {preview ? (
              <div className="position-relative">
                <img src={preview} alt="Selected" className="cg-detail-image" style={{ maxHeight: 220 }} />
                <button type="button" className="btn btn-sm btn-guard-outline position-absolute top-0 end-0 m-2" onClick={clearImage}>
                  <X size={15} /> Remove
                </button>
              </div>
            ) : (
              <label className="cg-card d-block text-center p-4" style={{ cursor: 'pointer' }}>
                <ImagePlus size={22} style={{ color: 'var(--cg-deep)' }} />
                <div className="small text-muted-cg mt-2">Tap to add a photo, up to 5 MB</div>
                <input id="image" type="file" accept="image/*" className="d-none" onChange={pickImage} />
              </label>
            )}
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-guard" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit complaint'}
            </button>
            <button type="button" className="btn btn-guard-outline" onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProblem;
