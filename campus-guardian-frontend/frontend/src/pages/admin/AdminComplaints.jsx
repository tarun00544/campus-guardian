 import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';

import {
  getAllComplaints,
  getUsers,
} from '../../services/adminService';

import {
  assignComplaint,
  updateComplaintStatus,
} from '../../services/complaintService';

import { getErrorMessage } from '../../services/api';

import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';

import { formatDate } from '../../utils/auth';
import { CATEGORIES } from '../ReportProblem';

const STATUSES = [
  'Reported',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');

  // Status modal
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('');

  // Assign modal
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');

  // ============================================================
  // LOAD COMPLAINTS
  // ============================================================

  const load = async () => {
    setLoading(true);

    try {
      const data = await getAllComplaints();

      setComplaints(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD STAFF / SECURITY USERS
  // ============================================================

  const loadStaffUsers = async () => {
    setStaffLoading(true);
    setActionError('');

    try {
      const users = await getUsers();

      const usersArray = Array.isArray(users) ? users : [];

      // Only active staff and security users can receive complaints.
      const eligibleStaff = usersArray.filter(
        (user) =>
          user.isActive !== false &&
          ['staff', 'security'].includes(
            String(user.role || '').toLowerCase()
          )
      );

      setStaffUsers(eligibleStaff);

      if (eligibleStaff.length === 0) {
        setActionError(
          'No active staff or security members are available.'
        );
      }
    } catch (err) {
      setStaffUsers([]);
      setActionError(getErrorMessage(err));
    } finally {
      setStaffLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // FILTER COMPLAINTS
  // ============================================================

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return complaints.filter((c) => {
      const s = String(c.status || '')
        .toLowerCase()
        .replace(/[_-]/g, ' ');

      if (
        status !== 'All' &&
        s !== status.toLowerCase()
      ) {
        return false;
      }

      if (
        category !== 'All' &&
        c.category !== category
      ) {
        return false;
      }

      if (!q) return true;

      return [
        c.title,
        c.description,
        c.location,
        c.category,
        c.reportedBy?.name,
        c.reportedBy?.email,
        c.user?.name,
        c.user?.email,
        c.assignedTo?.name,
        c.assignedTo?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [complaints, query, status, category]);

  // ============================================================
  // CHANGE COMPLAINT STATUS
  // ============================================================

  const saveStatus = async () => {
    if (!statusTarget || !nextStatus) {
      return;
    }

    setWorking(true);
    setActionError('');

    try {
      await updateComplaintStatus(
        statusTarget._id || statusTarget.id,
        nextStatus
      );

      setStatusTarget(null);
      setNextStatus('');

      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  // ============================================================
  // ASSIGN COMPLAINT TO STAFF
  // ============================================================

  const saveAssignee = async () => {
    if (!assignTarget) {
      setActionError('No complaint selected.');
      return;
    }

    if (!assignee) {
      setActionError('Please select a staff member.');
      return;
    }

    setWorking(true);
    setActionError('');

    try {
      /*
       * IMPORTANT:
       *
       * assignee contains the MongoDB _id of the selected
       * staff/security user.
       *
       * Example:
       * {
       *   assignedTo: "68xxxxxxxxxxxxxxxxxxxx"
       * }
       */

      await assignComplaint(
        assignTarget._id || assignTarget.id,
        {
          assignedTo: assignee,
        }
      );

      setAssignTarget(null);
      setAssignee('');

      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  // ============================================================
  // OPEN STATUS MODAL
  // ============================================================

  const openStatusModal = (complaint) => {
    setStatusTarget(complaint);
    setNextStatus(complaint.status || 'Reported');
    setActionError('');
  };

  // ============================================================
  // OPEN ASSIGN MODAL
  // ============================================================

  const openAssignModal = async (complaint) => {
    setAssignTarget(complaint);

    /*
     * If complaint already has an assigned staff member,
     * keep their _id selected.
     */
    setAssignee(
      complaint.assignedTo?._id ||
      complaint.assignedTo?.id ||
      ''
    );

    setActionError('');

    await loadStaffUsers();
  };

  // ============================================================
  // CLOSE ASSIGN MODAL
  // ============================================================

  const closeAssignModal = () => {
    if (working) return;

    setAssignTarget(null);
    setAssignee('');
    setActionError('');
  };

  // ============================================================
  // CLOSE STATUS MODAL
  // ============================================================

  const closeStatusModal = () => {
    if (working) return;

    setStatusTarget(null);
    setNextStatus('');
    setActionError('');
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <h1 className="cg-page-title">
        Complaints
      </h1>

      <p className="cg-page-sub">
        Filter the queue, assign an owner and move each
        report forward.
      </p>

      {error && (
        <div className="alert alert-danger py-2 small">
          {error}
        </div>
      )}

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="cg-card mb-3">
        <div className="cg-card-body">

          <div className="row g-2 align-items-end">

            {/* SEARCH */}

            <div className="col-lg-5">

              <label
                className="form-label"
                htmlFor="q"
              >
                Search
              </label>

              <div className="input-group">

                <span className="input-group-text bg-white">
                  <Search size={15} />
                </span>

                <input
                  id="q"
                  className="form-control"
                  placeholder="Title, location or reporter"
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                />

              </div>

            </div>

            {/* STATUS */}

            <div className="col-6 col-lg-3">

              <label
                className="form-label"
                htmlFor="st"
              >
                Status
              </label>

              <select
                id="st"
                className="form-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <option>All</option>

                {STATUSES.map((s) => (
                  <option key={s}>
                    {s}
                  </option>
                ))}
              </select>

            </div>

            {/* CATEGORY */}

            <div className="col-6 col-lg-3">

              <label
                className="form-label"
                htmlFor="ct"
              >
                Category
              </label>

              <select
                id="ct"
                className="form-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option>All</option>

                {CATEGORIES.map((c) => (
                  <option key={c}>
                    {c}
                  </option>
                ))}
              </select>

            </div>

            {/* CLEAR FILTER */}

            <div className="col-lg-1">

              <button
                type="button"
                className="btn btn-guard-outline w-100"
                onClick={() => {
                  setQuery('');
                  setStatus('All');
                  setCategory('All');
                }}
                aria-label="Clear filters"
              >
                <SlidersHorizontal size={15} />
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* ======================================================
          COMPLAINT TABLE
      ====================================================== */}

      {loading ? (

        <Loading
          label="Loading complaints..."
          rows={4}
        />

      ) : visible.length === 0 ? (

        <EmptyState
          title="No complaints match"
          message="Change the filters or clear the search."
        />

      ) : (

        <div className="cg-card cg-table-wrap">

          <table className="cg-table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Reported by</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {visible.map((c) => (

                <tr key={c._id || c.id}>

                  {/* TITLE */}

                  <td>
                    <Link
                      to={`/complaints/${c._id || c.id}`}
                    >
                      {c.title}
                    </Link>
                  </td>

                  {/* CATEGORY */}

                  <td>
                    {c.category || '—'}
                  </td>

                  {/* LOCATION */}

                  <td>
                    {c.location || '—'}
                  </td>

                  {/* REPORTED BY */}

                  <td>
                    {c.reportedBy?.name ||
                      c.user?.name ||
                      '—'}
                  </td>

                  {/* PRIORITY */}

                  <td>
                    {c.priority ? (
                      <StatusBadge
                        status={c.priority}
                      />
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* STATUS */}

                  <td>
                    <StatusBadge
                      status={c.status}
                    />
                  </td>

                  {/* ASSIGNED STAFF */}

                  <td>
                    {c.assignedTo?.name ? (
                      <div>
                        <div>
                          {c.assignedTo.name}
                        </div>

                        {c.assignedTo.role && (
                          <small className="text-muted-cg">
                            {c.assignedTo.role}
                          </small>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-cg">
                        Not assigned
                      </span>
                    )}
                  </td>

                  {/* DATE */}

                  <td className="text-muted-cg">
                    {formatDate(c.createdAt)}
                  </td>

                  {/* ACTIONS */}

                  <td>

                    <div className="d-flex gap-2">

                      <button
                        type="button"
                        className="btn btn-sm btn-guard-outline"
                        onClick={() =>
                          openStatusModal(c)
                        }
                      >
                        Status
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-guard-outline"
                        onClick={() =>
                          openAssignModal(c)
                        }
                      >
                        Assign
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* ======================================================
          STATUS MODAL
      ====================================================== */}

      <Modal
        open={Boolean(statusTarget)}
        title="Change status"
        onClose={closeStatusModal}
        footer={(
          <>
            <button
              type="button"
              className="btn btn-guard-outline"
              onClick={closeStatusModal}
              disabled={working}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-guard"
              onClick={saveStatus}
              disabled={working}
            >
              {working
                ? 'Saving...'
                : 'Save status'}
            </button>
          </>
        )}
      >

        {actionError && (
          <div className="alert alert-danger py-2 small">
            {actionError}
          </div>
        )}

        <p className="small text-muted-cg">
          {statusTarget?.title}
        </p>

        <label
          className="form-label"
          htmlFor="newStatus"
        >
          New status
        </label>

        <select
          id="newStatus"
          className="form-select"
          value={nextStatus}
          onChange={(e) =>
            setNextStatus(e.target.value)
          }
        >
          {STATUSES.map((s) => (
            <option
              key={s}
              value={s}
            >
              {s}
            </option>
          ))}
        </select>

        <div className="form-text">
          The student is notified when this changes.
        </div>

      </Modal>

      {/* ======================================================
          ASSIGN STAFF MODAL
      ====================================================== */}

      <Modal
        open={Boolean(assignTarget)}
        title="Assign staff"
        onClose={closeAssignModal}
        footer={(
          <>
            <button
              type="button"
              className="btn btn-guard-outline"
              onClick={closeAssignModal}
              disabled={working}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-guard"
              onClick={saveAssignee}
              disabled={
                working ||
                staffLoading ||
                !assignee
              }
            >
              {working
                ? 'Assigning...'
                : 'Assign'}
            </button>
          </>
        )}
      >

        {actionError && (
          <div className="alert alert-danger py-2 small">
            {actionError}
          </div>
        )}

        <p className="small text-muted-cg">
          {assignTarget?.title}
        </p>

        <label
          className="form-label"
          htmlFor="assignee"
        >
          Staff / Security member
        </label>

        {staffLoading ? (

          <div className="form-control text-muted">
            Loading staff members...
          </div>

        ) : staffUsers.length === 0 ? (

          <div className="alert alert-warning py-2 small mb-0">
            No active staff or security members found.
          </div>

        ) : (

          <select
            id="assignee"
            className="form-select"
            value={assignee}
            onChange={(e) =>
              setAssignee(e.target.value)
            }
            disabled={working}
          >

            <option value="">
              Select staff member
            </option>

            {staffUsers.map((staff) => (

              <option
                key={staff._id}
                value={staff._id}
              >
                {staff.name || 'Unnamed user'}
                {' — '}
                {staff.role || 'staff'}
                {staff.email
                  ? ` (${staff.email})`
                  : ''}
              </option>

            ))}

          </select>

        )}

        <div className="form-text">
          Only active staff and security members
          can be assigned complaints.
        </div>

      </Modal>
    </>
  );
};

export default AdminComplaints;