import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { SideNav } from './SideNav';
import styles from './AppShell.module.css';

export function AppShell() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen((p) => !p);
    } else {
      setIsExpanded((p) => !p);
    }
  };

  return (
    <div className={styles.shell}>
      {/* Full-Height Left Sidebar */}
      <SideNav
        isExpanded={isExpanded}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleExpand={() => setIsExpanded((p) => !p)}
      />

      {/* Main Content Area on Right */}
      <div className={styles.contentArea}>
        <Header onMenuToggle={handleMenuToggle} isExpanded={isExpanded} />
        <main className={styles.main}>
          <div style={{ width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
