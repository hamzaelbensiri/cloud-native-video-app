import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { RoleGate } from '@/components/RoleGate';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Feed from '@/pages/Feed';
import Watch from '@/pages/Watch';
import Upload from '@/pages/Upload';
import MyVideos from '@/pages/MyVideos';
import EditVideo from '@/pages/EditVideo';
import Profile from '@/pages/Profile';

import AdminUsers from '@/pages/admin/Users';
import AdminVideos from '@/pages/admin/Videos';
import AdminReports from '@/pages/admin/Reports';

import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  UploadCloud,
  Home,
  UserCircle2,
  Film,
  Shield,
  UsersRound,
  Video as VideoIcon,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/** Small helper to portal children to <body> */
function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

/** ---------- Top Navbar (responsive + portal drawer) ---------- */
function Nav() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, role, logout, clearAuth } = useAuth();
  const [open, setOpen] = useState(false);          // mobile drawer
  const [adminOpen, setAdminOpen] = useState(false); // desktop admin dropdown
  const menuId = useId();

  const isCreator = role === 'creator' || role === 'admin';
  const isAdmin = role === 'admin';

  // close menus when route changes
  useEffect(() => {
    setOpen(false);
    setAdminOpen(false);
  }, [pathname]);

  // lock scroll when drawer is open (mobile)
  useEffect(() => {
    const el = document.documentElement;
    if (open) {
      const prev = el.style.overflow;
      el.style.overflow = 'hidden';
      return () => {
        el.style.overflow = prev;
      };
    }
    return;
  }, [open]);

  const doLogout = () => (logout ?? clearAuth)();

  const linkBase =
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition';
  const linkInactive = 'text-neutral-300 hover:bg-white/5 hover:text-white';
  const linkActive = 'bg-white/10 text-white';

  return (
    <nav
      className="sticky top-0 z-[2000] w-full border-b border-white/10 bg-neutral-950/70 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-4">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-brand-red shadow-[0_0_10px_theme(colors.brand.red/70%)]" />
          <span className="select-none text-base font-semibold text-white">VidApp</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [linkBase, isActive ? linkActive : linkInactive].join(' ')
            }
          >
            <Home size={16} /> Home
          </NavLink>

          {isCreator && (
            <>
              <NavLink
                to="/my-videos"
                className={({ isActive }) =>
                  [linkBase, isActive ? linkActive : linkInactive].join(' ')
                }
              >
                <Film size={16} /> My Videos
              </NavLink>

              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  [
                    linkBase,
                    'bg-brand-red text-white hover:bg-brand-redHover',
                    isActive ? '' : '',
                  ].join(' ')
                }
              >
                <UploadCloud size={16} /> Upload
              </NavLink>
            </>
          )}

          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                className={[linkBase, linkInactive].join(' ')}
                onClick={() => setAdminOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={adminOpen}
                aria-controls={`${menuId}-admin`}
              >
                <Shield size={16} className="text-brand-red" />
                Admin
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {adminOpen && (
                  <motion.div
                    id={`${menuId}-admin`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-brand-line bg-neutral-950/95 p-1 shadow-2xl backdrop-blur"
                    role="menu"
                    onMouseLeave={() => setAdminOpen(false)}
                  >
                    <AdminLink to="/admin/users" icon={<UsersRound size={16} />}>
                      Users
                    </AdminLink>
                    <AdminLink to="/admin/videos" icon={<VideoIcon size={16} />}>
                      Videos
                    </AdminLink>
                    <AdminLink to="/admin/reports" icon={<BarChart3 size={16} />}>
                      Reports
                    </AdminLink>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right (desktop): auth area */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  [linkBase, isActive ? linkActive : linkInactive, 'max-w-[180px] truncate'].join(' ')
                }
              >
                <UserCircle2 size={16} />
                {user?.username ?? 'Profile'}
              </NavLink>
              <button
                onClick={doLogout}
                className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  [linkBase, isActive ? linkActive : linkInactive].join(' ')
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  [linkBase, isActive ? linkActive : linkInactive].join(' ')
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center rounded-lg p-2 text-neutral-300 hover:bg-white/5 hover:text-white md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-controls={menuId}
          aria-expanded={open}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer (PORTAL to body) */}
      <AnimatePresence>
        {open && (
          <Portal>
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              {/* Panel */}
              <motion.aside
                id={menuId}
                className="fixed right-0 top-0 z-[10010] h-full w-[82%] max-w-xs overflow-y-auto border-l border-white/10 bg-neutral-950/95 p-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] shadow-2xl md:hidden"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                role="dialog"
                aria-modal="true"
              >
                <div className="mb-2 flex items-center justify-between">
                  <Link to="/" onClick={() => setOpen(false)} className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-brand-red shadow-[0_0_10px_theme(colors.brand.red/70%)]" />
                    <span className="select-none text-base font-semibold text-white">VidApp</span>
                  </Link>
                  <button
                    className="rounded-lg p-2 text-neutral-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-2 grid gap-1">
                  <MobileItem to="/" label="Home" icon={<Home size={18} />} onClick={() => setOpen(false)} />
                  {isCreator && (
                    <>
                      <MobileItem to="/upload" label="Upload" icon={<UploadCloud size={18} />} onClick={() => setOpen(false)} />
                      <MobileItem to="/my-videos" label="My Videos" icon={<Film size={18} />} onClick={() => setOpen(false)} />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <div className="mt-2 mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        <Shield size={14} className="text-brand-red" /> Admin
                      </div>
                      <MobileItem to="/admin/users" label="Users" icon={<UsersRound size={18} />} onClick={() => setOpen(false)} />
                      <MobileItem to="/admin/videos" label="Videos" icon={<VideoIcon size={18} />} onClick={() => setOpen(false)} />
                      <MobileItem to="/admin/reports" label="Reports" icon={<BarChart3 size={18} />} onClick={() => setOpen(false)} />
                    </>
                  )}

                  <div className="mt-2 h-px w-full bg-white/10" />

                  {isAuthenticated ? (
                    <>
                      <MobileItem
                        to="/profile"
                        label={user?.username ?? 'Profile'}
                        icon={<UserCircle2 size={18} />}
                        onClick={() => setOpen(false)}
                      />
                      <button
                        onClick={() => {
                          doLogout();
                          setOpen(false);
                        }}
                        className="mt-1 inline-flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <MobileItem to="/login" label="Login" icon={<UserCircle2 size={18} />} onClick={() => setOpen(false)} />
                      <MobileItem to="/register" label="Register" icon={<UserCircle2 size={18} />} onClick={() => setOpen(false)} />
                    </>
                  )}
                </div>
              </motion.aside>
            </>
          </Portal>
        )}
      </AnimatePresence>
    </nav>
  );
}

function AdminLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
          isActive ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
      role="menuitem"
    >
      {icon}
      {children}
    </NavLink>
  );
}

function MobileItem({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
          isActive ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/** ---------- Routes ---------- */
export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Feed />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Creator */}
        <Route element={<ProtectedRoute roles={['creator', 'admin']} />}>
          <Route path="/upload" element={<Upload />} />
          <Route path="/my-videos" element={<MyVideos />} />
          <Route path="/my-videos/:id/edit" element={<EditVideo />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/videos" element={<AdminVideos />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </div>
  );
}
