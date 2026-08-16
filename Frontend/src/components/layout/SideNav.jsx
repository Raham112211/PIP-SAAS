import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  GitFork,
  Zap,
  FileText,
  Shield,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import styles from './SideNav.module.css';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',             icon: LayoutGrid },
  { to: '/organization', label: 'Organization',          icon: Building2 },
  { to: '/branches',     label: 'Branches',              icon: GitFork },
  { to: '/scraping',     label: 'Scraping',              icon: Zap },
  { to: '/bills',        label: 'Bills',                 icon: FileText },
  { to: '/roles',        label: 'Roles and permissions', icon: Shield },
  { to: '/staff',        label: 'Staff',                 icon: Users },
  { to: '/licence',      label: 'Billing',               icon: CreditCard },
  { to: '/reports',      label: 'Reports',               icon: BarChart3 },
  { to: '/settings',     label: 'Settings',              icon: Settings },
];

export function SideNav({ isExpanded, mobileOpen, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={onClose} />}
      <nav
        className={`${styles.sidenav} ${!isExpanded ? styles.sidenavMini : ''} ${mobileOpen ? styles.sidenavOpenMobile : ''}`}
        aria-label="Main navigation"
      >
        {/* Top Logo Section Inside Sidebar */}
        <div className={styles.logoHeader}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Logo iconSize={36} showText={isExpanded} />
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <ul className={styles.navList}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={onClose}
                title={label}
              >
                <div className={styles.iconWrap}>
                  <Icon size={19} className={styles.navIcon} />
                </div>
                <span className={styles.navLinkText}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Bottom Sign Out */}
        <div className={styles.navFooter}>
          <button type="button" className={styles.signOutBtn} onClick={logout} title="Sign out">
            <div className={styles.iconWrap}>
              <LogOut size={18} className={styles.navIcon} />
            </div>
            <span className={styles.signOutText}>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
