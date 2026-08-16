import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/organization': 'Organization',
  '/branches': 'Branch Management',
  '/scraping': 'DISCO Scraper',
  '/bills': 'Bill Management',
  '/roles': 'Roles & Permissions',
  '/staff': 'Staff Directory',
  '/licence': 'Subscription & Billing',
  '/reports': 'Executive Reports',
  '/settings': 'Settings',
  '/profile': 'User Profile',
};

export function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTitle = ROUTE_TITLES[location.pathname] || 'PIP Platform';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      {/* Left Area: Toggle & Breadcrumb */}
      <div className={styles.left}>
        <button type="button" className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Portal</span>
          <span style={{ fontSize: 13, color: '#cbd5e1' }}>/</span>
          <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>{currentTitle}</span>
        </div>
      </div>

      {/* Right Area: System Status & User Menu */}
      <div className={styles.right}>
        {/* Live System Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 999,
            color: '#047857',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span>Live SQLite Sync</span>
        </div>

        {/* Notifications */}
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notificationDot} />
        </button>

        {/* User Profile Menu */}
        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => setDropdownOpen((p) => !p)}
            aria-label="User menu"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{user?.name || 'Administrator'}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>{user?.email || 'admin@pip.com'}</div>
              </div>
              <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>
                User Profile
              </button>
              <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); logout(); }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
