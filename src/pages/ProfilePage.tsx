import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";

export function ProfilePage() {
  const { user, logout } = useAuth();
  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">Account details for this prototype session.</p>
      <article className="card" style={{ maxWidth: 520 }}>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Location:</strong> {user?.location}</p>
        <div className="field">
          <label>Language</label>
          <LanguageSelector />
        </div>
        <p className="small">Translations are prepared for English, Hindi, Marathi and Telugu navigation labels.</p>
        <button className="btn btn-secondary" type="button" onClick={logout}>
          Sign out
        </button>
      </article>
    </div>
  );
}
