import { Link } from 'react-router-dom';
import {
  Activity, BarChart3, Clock, MapPin, Search, ShieldCheck, TriangleAlert, Users, Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeRouteFor } from '../utils/auth';

const MODULES = [
  {
    icon: Wrench,
    title: 'Report a campus problem',
    tone: '',
    body: 'A broken fan, a dead Wi-Fi point, a flooded washroom. Add a photo and a location, and it goes straight to the team that fixes it.',
    points: ['Photo and exact block', 'Status you can follow', 'Upvote what others reported']
  },
  {
    icon: TriangleAlert,
    title: 'Emergency network',
    tone: 'alert-top',
    body: 'Raise an in-app alert to the campus response team with your type, location and optional coordinates, so help knows where to go.',
    points: ['Medical, fire, accident, security', 'Live status for responders', 'Location shared with the team']
  },
  {
    icon: Search,
    title: 'Lost & found',
    tone: 'amber-top',
    body: 'Post what you lost or what you picked up. Smart Match compares category, wording, place and date to suggest likely pairs.',
    points: ['Photos of every item', 'Smart Match suggestions', 'Verification before handover']
  }
];

const STEPS = [
  { title: 'Report it', body: 'A student files a complaint, an emergency alert or a lost item in under a minute.' },
  { title: 'It reaches the right desk', body: 'The report lands in the admin console, tagged by category, location and priority.' },
  { title: 'Someone is assigned', body: 'Staff take ownership and move the report through assigned, in progress and resolved.' },
  { title: 'The student is told', body: 'Every change sends a notification, so nobody has to walk to an office to ask.' }
];

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const primaryHome = isAuthenticated ? homeRouteFor(user) : '/register';

  return (
    <>
      <header className="cg-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <h1>CAMPUS<br />GUARDIAN</h1>
              <div className="tagline">Report. Respond. Recover.</div>
              <p className="lead mb-4">
                A smarter and safer campus platform for reporting problems, emergency coordination
                and lost &amp; found recovery.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/report-problem" className="btn btn-lg btn-guard"><Wrench size={18} className="me-2" />Report a problem</Link>
                <Link to="/emergency" className="btn btn-lg btn-alert"><TriangleAlert size={18} className="me-2" />Emergency help</Link>
                <Link to="/lost-found" className="btn btn-lg btn-guard-outline"><Search size={18} className="me-2" />Lost &amp; found</Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="cg-hero-panel">
                <div className="d-flex align-items-center gap-2 mb-2 small" style={{ color: 'rgba(255,255,255,.75)' }}>
                  <span className="cg-live-dot" /> How a report moves
                </div>
                <div className="cg-hero-row">
                  <MapPin size={18} className="flex-shrink-0 mt-1" />
                  <div>
                    <div className="fw-semibold">Block B, second floor washroom</div>
                    <div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>Reported with a photo at 09:14</div>
                  </div>
                </div>
                <div className="cg-hero-row">
                  <Users size={18} className="flex-shrink-0 mt-1" />
                  <div>
                    <div className="fw-semibold">Assigned to maintenance</div>
                    <div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>Picked up by the admin desk at 09:31</div>
                  </div>
                </div>
                <div className="cg-hero-row">
                  <ShieldCheck size={18} className="flex-shrink-0 mt-1" />
                  <div>
                    <div className="fw-semibold">Resolved, student notified</div>
                    <div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>Closed the same afternoon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="cg-section tint">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-lg-5">
              <div className="cg-kicker">The problem</div>
              <h2 className="h3 mb-3">Campus issues get lost between people</h2>
              <p className="text-muted-cg">
                Complaints are written in registers nobody reads back. Emergencies travel by phone calls
                to whoever happens to pick up. Lost wallets sit in a drawer while their owner posts in a
                group chat. There is no shared record, so nothing can be tracked or measured.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="cg-kicker">The solution</div>
              <h2 className="h3 mb-3">One record every side can see</h2>
              <p className="text-muted-cg mb-4">
                Campus Guardian puts reporting, response and recovery on the same platform. Students see
                the status of their own reports. Staff see a queue they can filter and assign. Administrators
                see what keeps breaking, and where.
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="cg-card h-100"><div className="cg-card-body">
                    <Activity size={20} className="mb-2" style={{ color: 'var(--cg-deep)' }} />
                    <div className="fw-semibold">Nothing gets dropped</div>
                    <div className="small text-muted-cg">Every report has an owner and a status.</div>
                  </div></div>
                </div>
                <div className="col-sm-6">
                  <div className="cg-card h-100"><div className="cg-card-body">
                    <Clock size={20} className="mb-2" style={{ color: 'var(--cg-deep)' }} />
                    <div className="fw-semibold">Faster response</div>
                    <div className="small text-muted-cg">Alerts reach the response team the moment they are raised.</div>
                  </div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cg-section">
        <div className="container">
          <div className="cg-kicker">Three modules</div>
          <h2 className="h3 mb-4">Everything a campus actually needs</h2>
          <div className="row g-4">
            {MODULES.map(({ icon: Icon, title, body, points, tone }) => (
              <div className="col-md-4" key={title}>
                <div className={`cg-card cg-module-card ${tone}`}>
                  <div className="cg-card-body">
                    <Icon size={24} className="mb-3" style={{ color: 'var(--cg-deep)' }} />
                    <h3 className="h6">{title}</h3>
                    <p className="small text-muted-cg">{body}</p>
                    <ul className="small text-muted-cg mb-0 ps-3">
                      {points.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cg-section tint">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6">
              <div className="cg-kicker">How it works</div>
              <h2 className="h3 mb-3">Four steps, start to close</h2>
              <div>
                {STEPS.map((step, i) => (
                  <div className="cg-step" key={step.title}>
                    <span className="cg-step-num">{i + 1}</span>
                    <div>
                      <div className="fw-semibold">{step.title}</div>
                      <div className="small text-muted-cg">{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="cg-kicker">Campus intelligence</div>
              <h2 className="h3 mb-3">The data answers questions</h2>
              <p className="text-muted-cg">
                Because every report is structured, the admin console can show which category fails most,
                which block generates the most complaints, how long resolution takes, and which emergency
                types recur. Budget and staffing decisions stop being guesswork.
              </p>
              <div className="cg-card">
                <div className="cg-card-body d-flex gap-3 align-items-start">
                  <BarChart3 size={22} style={{ color: 'var(--cg-deep)' }} />
                  <div className="small text-muted-cg">
                    Complaints by category and location, status breakdown, emergency types and lost &amp; found
                    recovery rates, all on one analytics page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cg-section">
        <div className="container">
          <div className="cg-kicker">Impact</div>
          <h2 className="h3 mb-4">What changes on day one</h2>
          <div className="row g-4">
            {[
              { title: 'For students', body: 'A complaint takes a minute and can be followed to closure. Emergency help is two taps away.' },
              { title: 'For staff', body: 'One queue instead of phone calls and registers, with filters, search and assignment built in.' },
              { title: 'For the institution', body: 'A measurable record of campus problems, response times and recovered belongings.' }
            ].map((c) => (
              <div className="col-md-4" key={c.title}>
                <div className="cg-card h-100"><div className="cg-card-body">
                  <h3 className="h6">{c.title}</h3>
                  <p className="small text-muted-cg mb-0">{c.body}</p>
                </div></div>
              </div>
            ))}
          </div>

          <div className="cg-card mt-4" style={{ borderLeft: '5px solid var(--cg-alert)' }}>
            <div className="cg-card-body d-flex gap-3">
              <TriangleAlert size={22} style={{ color: 'var(--cg-alert)' }} className="flex-shrink-0" />
              <div className="small">
                <strong>About emergency alerts.</strong> Campus Guardian sends alerts to the campus response
                team inside the app. It does not call the police, an ambulance or the fire service.
                In a life-threatening situation, contact your local emergency services directly first.
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <Link to={primaryHome} className="btn btn-lg btn-guard">
              {isAuthenticated ? 'Go to my dashboard' : 'Create your campus account'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Landing;
