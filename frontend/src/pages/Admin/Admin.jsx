import React, { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import {
  ShieldAlert,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  UserX,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Admin.css";

const Admin = () => {
  const { axiosAuth, user, role } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalAdmins: 0,
    totalWhitelisted: 0,
    totalBacklogs: 0,
  });
  const [whitelistRoster, setWhitelistRoster] = useState([]);
  const [flaggedStories, setFlaggedStories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Batch Graduation form
  const [gradBatch, setGradBatch] = useState(2026);
  const [excludeBacklogs, setExcludeBacklogs] = useState(true);
  const [migrationReport, setMigrationReport] = useState(null);
  const [migrating, setMigrating] = useState(false);

  // Bulk Whitelist CSV input
  const [csvText, setCsvText] = useState(
    "tannu@gehu.ac.in, Tannu Chandola, student, 2026, Computer Science & Engineering\naksh@gehu.ac.in, Aksh Bhatt, alumni, 2025, Information Technology\nhimanshu@gehu.ac.in, Himanshu Nainwal, student, 2026, Computer Science & Engineering\nanil@gehu.ac.in, Anil Kumar, student, 2026, Electronics & Communication"
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth().get("/admin/users", {
        params: { role: filterRole, department: filterDept, search: searchQuery },
      });
      if (res.data.success) {
        setUsersList(res.data.users);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  };

  const fetchWhitelist = async () => {
    try {
      const res = await axiosAuth().get("/admin/whitelist");
      if (res.data.success) setWhitelistRoster(res.data.roster);
    } catch {}
  };

  const fetchFlagged = async () => {
    try {
      const res = await axiosAuth().get("/stories/moderation");
      if (res.data.success) setFlaggedStories(res.data.stories);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchWhitelist();
    fetchFlagged();
  }, [filterRole, filterDept]);

  // Promote / Demote sub-admin
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axiosAuth().patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(`Role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Role delegation failed");
    }
  };

  // Toggle Account Suspension
  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      const res = await axiosAuth().patch(`/admin/users/${userId}/status`, { is_banned: !currentStatus });
      if (res.data.success) {
        toast.success(!currentStatus ? "User account suspended" : "User access restored");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // Toggle Backlog Status
  const handleToggleBacklog = async (userId, currentBacklog) => {
    try {
      const res = await axiosAuth().patch(`/admin/users/${userId}/backlog`, { has_backlog: !currentBacklog });
      if (res.data.success) {
        toast.success(!currentBacklog ? "Backlog marked (excluded from graduation)" : "Backlog cleared");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Failed to update backlog status");
    }
  };

  // Bulk Whitelist Upload
  const handleBulkUpload = async () => {
    const lines = csvText.trim().split("\n");
    const entries = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (!parts[0]) return null;
        return {
          email: parts[0],
          name: parts[1] || "",
          role: parts[2] || "student",
          batch: parseInt(parts[3]) || 2026,
          department: parts[4] || "Computer Science & Engineering",
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      toast.error("No valid entries found in text");
      return;
    }

    try {
      const res = await axiosAuth().post("/admin/whitelist/bulk", { entries });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchWhitelist();
        fetchUsers();
      }
    } catch (err) {
      toast.error("Bulk roster upload failed");
    }
  };

  // Automated Batch Graduation Migration
  const handleRunMigration = async () => {
    if (!window.confirm(`Are you sure you want to graduate batch ${gradBatch} students to Alumni status?`)) return;
    try {
      setMigrating(true);
      const res = await axiosAuth().post("/admin/graduate-batch", {
        batchYear: gradBatch,
        excludeBacklogs,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setMigrationReport(res.data.report);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Graduation migration failed");
    } finally {
      setMigrating(false);
    }
  };

  // Moderate flagged story
  const handleModerateStory = async (storyId, action) => {
    try {
      const res = await axiosAuth().patch(`/stories/${storyId}/moderate`, { action });
      if (res.data.success) {
        toast.success(action === "approve" ? "Story approved & restored" : "Story permanently deleted");
        fetchFlagged();
      }
    } catch {
      toast.error("Moderation action failed");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title-wrap">
          <ShieldAlert size={28} className="admin-icon" />
          <div>
            <h1>Master Admin & Governance Console</h1>
            <p>Role-Based Access Control, Annual Batch Graduation Pipeline & Content Moderation</p>
          </div>
        </div>
        <div className="admin-badge">
          Role: <strong style={{ textTransform: "uppercase" }}>{role}</strong>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <Users size={24} className="stat-icon blue" />
          <div>
            <h3>{stats.totalUsers}</h3>
            <span>Total Accounts</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <GraduationCap size={24} className="stat-icon green" />
          <div>
            <h3>{stats.totalStudents}</h3>
            <span>Active Students</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <Briefcase size={24} className="stat-icon purple" />
          <div>
            <h3>{stats.totalAlumni}</h3>
            <span>Graduated Alumni</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <UserCheck size={24} className="stat-icon orange" />
          <div>
            <h3>{stats.totalWhitelisted}</h3>
            <span>Whitelisted Roster</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <AlertTriangle size={24} className="stat-icon red" />
          <div>
            <h3>{stats.totalBacklogs}</h3>
            <span>Backlog Flags</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          <Users size={16} /> User Directory & RBAC
        </button>
        <button className={activeTab === "graduation" ? "active" : ""} onClick={() => setActiveTab("graduation")}>
          <GraduationCap size={16} /> Batch Graduation Engine
        </button>
        <button className={activeTab === "whitelist" ? "active" : ""} onClick={() => setActiveTab("whitelist")}>
          <Upload size={16} /> Institutional Email Whitelist
        </button>
        <button className={activeTab === "moderation" ? "active" : ""} onClick={() => setActiveTab("moderation")}>
          <AlertTriangle size={16} /> Moderation Queue ({flaggedStories.length})
        </button>
      </div>

      {/* Tab 1: User Directory & RBAC Management */}
      {activeTab === "overview" && (
        <div className="admin-section">
          <div className="admin-controls-bar">
            <div className="search-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              />
            </div>
            <div className="filter-wrap">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Sub-Admins</option>
                <option value="master_admin">Master Admin</option>
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="all">All Departments</option>
                <option value="Computer Science">CSE</option>
                <option value="Information Technology">IT</option>
                <option value="Electronics">ECE</option>
              </select>
              <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role (RBAC)</th>
                  <th>Department / Batch</th>
                  <th>Academic Status</th>
                  <th>Account Controls</th>
                  <th>Privilege Delegation</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id} className={u.is_banned ? "banned-row" : ""}>
                    <td>
                      <strong>{u.name}</strong>
                      <div className="sub-text">{u.email}</div>
                    </td>
                    <td>
                      <span className={`badge-role badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <div>{u.department}</div>
                      <div className="sub-text">Batch {u.batch || u.grad_year}</div>
                    </td>
                    <td>
                      {u.role === "student" ? (
                        <button
                          className={`tag-toggle ${u.has_backlog ? "backlog-active" : "clear"}`}
                          onClick={() => handleToggleBacklog(u._id, u.has_backlog)}
                          title="Click to toggle backlog exception flag"
                        >
                          {u.has_backlog ? "⚠️ Backlog Flagged" : "✓ Clear Standing"}
                        </button>
                      ) : (
                        <span className="sub-text">Alumni / Admin</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.is_banned ? "btn-success" : "btn-danger"}`}
                        onClick={() => handleToggleSuspend(u._id, u.is_banned)}
                        disabled={u.role === "master_admin"}
                      >
                        {u.is_banned ? "Unsuspend" : "Suspend / Ban"}
                      </button>
                    </td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user?._id}
                      >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="admin">Sub-Admin</option>
                        {role === "master_admin" && <option value="master_admin">Master Admin</option>}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Batch Graduation Migration Engine */}
      {activeTab === "graduation" && (
        <div className="admin-section">
          <div className="graduation-box">
            <h2>🎓 Automated Annual Batch Graduation Pipeline</h2>
            <p>
              Instantly transition an entire graduating class from <strong>Student</strong> to{" "}
              <strong>Alumni</strong> status with intelligent exception handling for students with active backlogs or
              detentions.
            </p>

            <div className="grad-form-grid">
              <div className="form-group">
                <label>Select Graduating Batch Year</label>
                <select value={gradBatch} onChange={(e) => setGradBatch(parseInt(e.target.value))}>
                  <option value={2024}>Batch 2024</option>
                  <option value={2025}>Batch 2025</option>
                  <option value={2026}>Batch 2026 (Current Passing Out)</option>
                  <option value={2027}>Batch 2027</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={excludeBacklogs}
                    onChange={(e) => setExcludeBacklogs(e.target.checked)}
                  />
                  <span>Exclude students with active backlogs / detentions</span>
                </label>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleRunMigration}
                disabled={migrating}
                style={{ height: "45px", alignSelf: "flex-end" }}
              >
                {migrating ? "Processing Graduation..." : `Execute Batch ${gradBatch} Graduation`}
              </button>
            </div>

            {migrationReport && (
              <div className="migration-report">
                <h3>
                  <CheckCircle size={20} color="#059669" /> Batch {migrationReport.batchYear} Graduation Report
                </h3>
                <div className="report-metrics">
                  <div>
                    Evaluated Students: <strong>{migrationReport.totalEvaluated}</strong>
                  </div>
                  <div>
                    Graduated to Alumni: <strong style={{ color: "#059669" }}>{migrationReport.graduatedCount}</strong>
                  </div>
                  <div>
                    Excluded (Backlogs): <strong style={{ color: "#dc2626" }}>{migrationReport.excludedCount}</strong>
                  </div>
                </div>

                {migrationReport.excludedDueToBacklog.length > 0 && (
                  <div className="excluded-list">
                    <h4>Excluded Students Checklist:</h4>
                    <ul>
                      {migrationReport.excludedDueToBacklog.map((s) => (
                        <li key={s._id}>
                          {s.name} ({s.email}) - {s.department} [Status: Active Backlog]
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Institutional Whitelist Roster */}
      {activeTab === "whitelist" && (
        <div className="admin-section">
          <div className="whitelist-manager">
            <h2>📋 Pre-stored Institutional Email Whitelisting</h2>
            <p>Upload CSV formatted rosters of approved student and alumni institutional emails.</p>

            <div className="csv-uploader">
              <label>CSV Roster Format: email, name, role, batch, department</label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="email, name, role, batch, department"
              />
              <button className="btn btn-primary" onClick={handleBulkUpload}>
                <Upload size={16} /> Import Roster Entries
              </button>
            </div>

            <h3>Current Whitelist Roster ({whitelistRoster.length} verified)</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Batch</th>
                    <th>Department</th>
                    <th>Registration Status</th>
                  </tr>
                </thead>
                <tbody>
                  {whitelistRoster.map((w) => (
                    <tr key={w._id}>
                      <td>{w.email}</td>
                      <td>{w.name || "-"}</td>
                      <td>{w.role}</td>
                      <td>{w.batch}</td>
                      <td>{w.department}</td>
                      <td>
                        <span className={`badge-status ${w.status}`}>{w.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Content Moderation Queue */}
      {activeTab === "moderation" && (
        <div className="admin-section">
          <h2>🛡️ Content Moderation & Spam Review Queue</h2>
          {flaggedStories.length === 0 ? (
            <p className="empty-notice">No flagged content pending review. All items clean!</p>
          ) : (
            <div className="flagged-cards">
              {flaggedStories.map((story) => (
                <div key={story._id} className="flagged-card">
                  <div className="flagged-header">
                    <h4>{story.title}</h4>
                    <span className="badge-flag">Reason: {story.flag_reason}</span>
                  </div>
                  <p>{story.content.slice(0, 200)}...</p>
                  <div className="flagged-actions">
                    <button className="btn btn-sm btn-success" onClick={() => handleModerateStory(story._id, "approve")}>
                      Approve & Restore
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleModerateStory(story._id, "delete")}>
                      Permanently Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
