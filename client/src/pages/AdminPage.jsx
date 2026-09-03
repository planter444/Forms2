import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminLogin, exportSubmissions, getSubmissions } from "../lib/api.js";

const storageKey = "kerea-admin-token";

const AdminPage = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState("");

  const loadSubmissions = async (authToken) => {
    setLoading(true);
    setError("");

    try {
      const data = await getSubmissions(authToken);
      setSubmissions(data.submissions || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load submissions.");
      if (requestError.status === 401) {
        localStorage.removeItem(storageKey);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSubmissions(token);
    }
  }, [token]);

  const stats = useMemo(() => {
    const listed = submissions.filter((item) => item.consent).length;
    const declined = submissions.length - listed;

    return [
      { label: "Total submissions", value: submissions.length },
      { label: "Consented", value: listed },
      { label: "Declined", value: declined }
    ];
  }, [submissions]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      const data = await adminLogin(credentials);
      localStorage.setItem(storageKey, data.token);
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    setToken("");
    setSubmissions([]);
    setCredentials({ username: "", password: "" });
  };

  const handleExport = async () => {
    try {
      const blob = await exportSubmissions(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "submissions.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || "Export failed.");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-8 shadow-soft">
          <Link to="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            ← Back to home
          </Link>
          <div className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Admin dashboard
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use your configured admin credentials to view submissions and export CSV reports.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <input
              type="text"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="Username"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              autoComplete="username"
            />
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              autoComplete="current-password"
            />
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={authenticating}
              className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
            >
              {authenticating ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link to="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              ← Back to home
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Submission dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review stakeholder responses and export the latest records as CSV.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => loadSubmissions(token)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{item.value}</div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Email",
                    "Consent",
                    "Name",
                    "Phone",
                    "Category",
                    "County",
                    "Submitted"
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>
                      Loading submissions...
                    </td>
                  </tr>
                ) : submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <tr key={submission.id} className="align-top">
                      <td className="px-4 py-4 text-sm text-slate-700">{submission.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.consent ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.full_name || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.phone_number || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {submission.category || submission.decline_reason || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{submission.county || "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {new Date(submission.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
