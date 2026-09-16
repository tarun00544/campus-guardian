import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import { createLostFound } from '../services/lostFoundService';
import { getErrorMessage } from '../services/api';
import { LOCATIONS } from './ReportProblem';

const CATEGORIES = ['Electronics', 'ID Card', 'Wallet', 'Keys', 'Books', 'Bag', 'Clothing', 'Jewellery', 'Other'];

const today = () => new Date().toISOString().slice(0, 10);

const CreateLostFound = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    type: params.get('type') === 'found' ? 'found' : 'lost',
    itemName: '',
    category: '',
    description: '',
    location: '',
    date: today()
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
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

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.itemName.trim() || !form.category || !form.location.trim() || !form.date) {
      setError('Fill in the item, category, location and date.');
      return;
    }

    setSubmitting(true);
    try {
      let payload = form;
      if (image) {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        data.append('image', image);
        payload = data;
      }
      const created = await createLostFound(payload);
      const id = created?._id || created?.id;
      navigate(id ? `/lost-found/${id}` : '/lost-found', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 720 }}>
      <h1 className="cg-page-title">Post an item</h1>
      <p className="cg-page-sub">The more detail you add, the better Smart Match can pair it.</p>

      <div className="cg-card">
        <form className="cg-card-body" onSubmit={submit} noValidate>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <div className="mb-3">
            <label className="form-label">What are you posting?</label>
            <div className="row g-2">
              {['lost', 'found'].map((t) => (
                <div className="col-6" key={t}>
                  <button
                    type="button"
                    className={`btn w-100 ${form.type === t ? 'btn-guard' : 'btn-guard-outline'}`}
                    onClick={() => setForm({ ...form, type: t })}
                    aria-pressed={form.type === t}
                  >
                    {t === 'lost' ? 'I lost something' : 'I found something'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="itemName">Item</label>
            <input id="itemName" name="itemName" className="form-control" value={form.itemName}
              onChange={change} placeholder="Black leather wallet" required />
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
              <label className="form-label" htmlFor="date">Date</label>
              <input id="date" name="date" type="date" className="form-control" value={form.date} onChange={change} max={today()} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="lfLocation">Location</label>
            <input id="lfLocation" name="location" className="form-control" list="cg-lf-locations"
              value={form.location} onChange={change} placeholder="Library, first floor" required />
            <datalist id="cg-lf-locations">
              {LOCATIONS.map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} className="form-control" value={form.description}
              onChange={change} placeholder="Colour, brand, marks, what was inside." />
            <div className="form-text">Leave out anything that only the real owner would know. Keep that for verification.</div>
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="lfImage">Photo (optional)</label>
            {preview ? (
              <div className="position-relative">
                <img src={preview} alt="Selected" className="cg-detail-image" style={{ maxHeight: 220 }} />
                <button type="button" className="btn btn-sm btn-guard-outline position-absolute top-0 end-0 m-2"
                  onClick={() => { setImage(null); setPreview(''); }}>
                  <X size={15} /> Remove
                </button>
              </div>
            ) : (
              <label className="cg-card d-block text-center p-4" style={{ cursor: 'pointer' }}>
                <ImagePlus size={22} style={{ color: 'var(--cg-deep)' }} />
                <div className="small text-muted-cg mt-2">Tap to add a photo, up to 5 MB</div>
                <input id="lfImage" type="file" accept="image/*" className="d-none" onChange={pickImage} />
              </label>
            )}
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-guard" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post item'}
            </button>
            <button type="button" className="btn btn-guard-outline" onClick={() => navigate('/lost-found')} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLostFound;
