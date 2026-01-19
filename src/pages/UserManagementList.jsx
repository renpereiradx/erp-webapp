import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// URLs de imágenes del ejemplo
const AVATAR_URLS = {
  alex: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmk3Rv4lFk00ZfTu6sOhb3HXHaC0Db8DLLwQr9FvPY5rOTgrKxQ29kyjCa46rsKB0hAcYlHbf-Dacplgwz5Xo8l9S1INTBYSjVJH5ZM_JGZgkFH14c8TdOg4iW_xfEoaHWhK_KRvL4mRmd27vaHK0Cofbz-VfHGpQBqJwN4RtZm7maKo9HVIdike7fkALzRrZmRp59AaMbepa7wLDKcbJJPiaej8CVU5P2V9T_aRX6oYixAgLQUliIwtpEYFqw5VsDMMywDWcGWw",
  sarah: "https://lh3.googleusercontent.com/aida-public/AB6AXuD90dlcJz5mG_zUNtP1BzsozmqTbcEEeJh8TBAFIVhMjbhSB6BKx1-XF7TCE-wQO02iXbrlTisJ0VWAUkXD6Eex4NLr_9lWuzPg4fhQuGR_b0UrbqZnlSIu_UigyVIeTfXc3HnwFDTE_gz3Gm9PeQ0aqYr8ngnRZTUZCu20RuCl-0WKT_bhiY7ccqaCvcu7iJAIGlnY7Zl0sZ52C3ejM9XNVzLkJ8rAddg0mNhO4jh96AGzS-5fmhytZsjjmz-YYOQBb5qb7g16EA",
  marcus: "https://lh3.googleusercontent.com/aida-public/AB6AXuASZ1h2zlUudvBfYZcoHVWaIeJ_x_ZKzuW-VE3e0Kt1S1RRjKc_4085l4yZAZz2jz0HjwqOUXg_-KeBFGYhGF3C1Kl7kPeW6YVyldcLT_kGkvjuJzNsJ_bJ4sO216tBfSX9CGhX_GA8a3EJe68xdKd_6tajtk0nGHTTYLk0LrKGy4GAZ8CtrSgM9AImhXA_gewUCcUnPafzxVn_ICqPKSmZwvqx5BezlEh_MNE1v9i1znZF5tZC41Doxfop8eUWmTqIcR3jaYbBLw",
  elena: "https://lh3.googleusercontent.com/aida-public/AB6AXuAaBGzmN6kMPoeM73w4kV85BUV4QuoA2q53koGBh7lM77mwegz7exopFSrG_QEPGihj6afh2qW_4EkQqJdLdKKqXDu1s5HjxbbXq7u5-FVsYkI3NCTdFA3jwY1RD06K0DK0rHedo7dr5gqbYcZT8sT84vusQPU5mAwo47kuVz9563hNXK8PvLf-wtoXCNy_R7JtHgpuTOrO1qihmtajn7XWmjY3tZNDHVLvD-f6C13grhYNIsYEvhQYjAAJ6-bE90LavUMxg_N6ng",
  david: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG-ZOuHOP2RH9SZBLDN331zLh0TgQBmJjvhME6vz4mup1VjiDUPW6RHClqyHOkBejScFh2J5Zae9RzVwTuHjuxajruUXGldHcAub6qaZXVi-FAktbvy321pW5Ng8hXP8IoMhhDa9UA9eRsXVHLcXZ0JfjAXErdBx8LRZEPBHPWifl7lnz-rkkIzTj6KaMXx9x8Zp8_naQOQDScL8U88xAJ9IzD__JJ0K7-AADM019F8iyHdXRT51-IqaW6g8jR7ygg2uaIshesrg",
  jessica: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7wEIgOpBOOwNOToirg1-g8DzqTcpsua0ERaxAr4nv7ygNbeyz8a5F9SB5gDP0N7WF4gIvDXMI_ntz6P5AeiivjTHyD2TPxxHFrJy6dj0hXoZxUDJTGot7zVPlUTbc3cfniaALm_9sPXJGRiuVVKdgfA5ilEUwzDSYhQReLPs1bgGc1oLEmpvjnPi9CD07f3r_rhb0T9DpqI9pD08SmGmp52SF1fxXXQX46TgeIH1Q4rnwdwihvB6IrYXpOa38BUV1fRIB8PW3Sg",
};

const MOCK_USERS = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    avatar: AVATAR_URLS.sarah,
    initials: "SJ",
    role: "Admin",
    status: "Active",
    lastActive: "2 mins ago",
    selected: true
  },
  {
    id: 2,
    name: "Marcus Smith",
    email: "m.smith@company.com",
    avatar: AVATAR_URLS.marcus,
    initials: "MS",
    role: "Editor",
    status: "Active",
    lastActive: "1 hour ago",
    selected: true
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    email: "e.rodriguez@company.com",
    avatar: AVATAR_URLS.elena,
    initials: "ER",
    role: "Viewer",
    status: "Inactive",
    lastActive: "Dec 12, 2023",
    selected: true
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.k@company.com",
    avatar: AVATAR_URLS.david,
    initials: "DK",
    role: "Editor",
    status: "Active",
    lastActive: "Just now",
    selected: false
  },
  {
    id: 5,
    name: "Jessica Lee",
    email: "jessica.lee@company.com",
    avatar: AVATAR_URLS.jessica,
    initials: "JL",
    role: "Viewer",
    status: "Active",
    lastActive: "Yesterday",
    selected: false
  }
];

export default function UserManagementList() {
  const [users, setUsers] = useState(MOCK_USERS);

  const toggleSelect = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, selected: !u.selected } : u));
  };

  const selectedCount = users.filter(u => u.selected).length;

  return (
    <div className="user-management">
      {/* Side Navigation */}
      <aside className="user-management__sidebar">
        <div className="user-management__sidebar-header">
          <div className="user-management__brand">
            <div className="user-management__brand-logo">
              <span className="material-symbols-outlined">shield</span>
            </div>
            <div className="user-management__brand-text">
              <h1>Admin Panel</h1>
              <p>Enterprise Console</p>
            </div>
          </div>
          <nav className="user-management__sidebar-nav">
            <a className="user-management__sidebar-link" href="#">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a className="user-management__sidebar-link user-management__sidebar-link--active" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <span className="text-sm font-semibold">User Management</span>
            </a>
            <a className="user-management__sidebar-link" href="#">
              <span className="material-symbols-outlined">security</span>
              <span className="text-sm font-medium">Roles & Permissions</span>
            </a>
            <a className="user-management__sidebar-link" href="#">
              <span className="material-symbols-outlined">analytics</span>
              <span className="text-sm font-medium">Activity Logs</span>
            </a>
            <div className="my-4 border-t border-subtle"></div>
            <a className="user-management__sidebar-link" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </nav>
        </div>
        <div className="user-management__sidebar-footer">
          <div className="user-management__user-profile">
            <Avatar size={32}>
              <AvatarImage src={AVATAR_URLS.alex} alt="Admin user profile picture" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <div className="user-management__user-profile-info">
              <p>Alex Chen</p>
              <p>Global Admin</p>
            </div>
            <span className="material-symbols-outlined text-secondary text-sm cursor-pointer">more_vert</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="user-management__content">
        {/* Top Nav Bar */}
        <header className="user-management__header">
          <div className="user-management__header-title">
            <h2>Users</h2>
            <Badge variant="secondary" className="border-none">1,240 Total</Badge>
          </div>
          <div className="user-management__header-actions">
            <div className="user-management__search-bar">
              <span className="material-symbols-outlined text-secondary text-xl">search</span>
              <input placeholder="Search users, emails, ID..." type="text" />
            </div>
            <div className="user-management__header-buttons">
              <Button variant="ghost" size="icon">
                <span className="material-symbols-outlined">notifications</span>
              </Button>
              <Button variant="primary">
                <span className="material-symbols-outlined text-lg">person_add</span>
                <span>Add User</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Command Bar / Toolbar */}
        <div className="user-management__toolbar">
          <div className="user-management__filter-group">
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              <span>Role: All</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </Button>
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Status: Active</span>
              <span className="material-symbols-outlined text-sm text-primary">expand_more</span>
            </Button>
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>Last Active</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </Button>
            <div className="h-6 w-px bg-subtle mx-2"></div>
            <Button variant="text" className="h-auto px-0">Clear all</Button>
          </div>
          <div className="user-management__action-group">
            <Button variant="ghost" className="h-auto">
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Export</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-auto w-auto">
              <span className="material-symbols-outlined text-lg">more_horiz</span>
            </Button>
          </div>
        </div>

        {/* Selected Actions Bar */}
        {selectedCount > 0 && (
          <div className="user-management__selection-bar">
            <div className="user-management__selection-actions">
              <span className="text-sm font-semibold text-primary">{selectedCount} users selected</span>
              <div className="h-4 w-px bg-primary opacity-20"></div>
              <div className="user-management__selection-buttons">
                <Button variant="secondary" size="sm">
                  <span className="material-symbols-outlined text-base">check</span> Activate
                </Button>
                <Button variant="secondary" size="sm">
                  <span className="material-symbols-outlined text-base">block</span> Deactivate
                </Button>
                <Button variant="destructive" size="sm">
                  <span className="material-symbols-outlined text-base">delete</span> Delete
                </Button>
              </div>
            </div>
            <button className="text-secondary hover:text-primary border-none bg-transparent cursor-pointer" onClick={() => setUsers(users.map(u => ({...u, selected: false})))}>
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Data Grid */}
        <div className="user-management__grid-container">
          <div className="user-management__grid-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center h-auto">
                    <input 
                      className="user-management__checkbox" 
                      type="checkbox" 
                      checked={selectedCount === users.length}
                      onChange={(e) => setUsers(users.map(u => ({...u, selected: e.target.checked})))}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">User</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">Role</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">Last Active</TableHead>
                  <TableHead className="w-20 h-auto"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={user.selected ? "fluent-grid-selected" : ""} 
                    aria-selected={user.selected}
                  >
                    <TableCell className="text-center">
                      <input 
                        className="user-management__checkbox" 
                        type="checkbox" 
                        checked={user.selected}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="user-management__user-cell">
                        <Avatar size={32}>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="user-management__user-info">
                          <p className="user-management__user-name">{user.name}</p>
                          <p className="user-management__user-email">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "Admin" ? "subtle-info" : "subtle-primary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`user-management__status ${user.status === 'Active' ? 'user-management__status--active' : 'user-management__status--inactive'}`}>
                        {user.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-secondary">{user.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="size-8">
                        <span className="material-symbols-outlined text-secondary">more_vert</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer / Pagination */}
          <div className="user-management__pagination">
            <div className="user-management__pagination-info">
              <span className="text-sm text-secondary">Showing <span className="font-semibold text-primary">1-25</span> of 1,240 users</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Rows per page:</span>
                <select className="user-management__rows-select">
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
            </div>
            <div className="user-management__pagination-controls">
              <Button variant="ghost" size="icon" className="size-9 text-secondary">
                <span className="material-symbols-outlined">first_page</span>
              </Button>
              <Button variant="ghost" size="icon" className="size-9 text-secondary">
                <span className="material-symbols-outlined">chevron_left</span>
              </Button>
              <div className="flex gap-1 px-2">
                <Button variant="primary" className="size-8 p-0">1</Button>
                <Button variant="ghost" className="size-8 p-0">2</Button>
                <Button variant="ghost" className="size-8 p-0">3</Button>
                <span className="size-8 flex items-center justify-center text-sm">...</span>
                <Button variant="ghost" className="size-8 p-0">50</Button>
              </div>
              <Button variant="ghost" size="icon" className="size-9 text-secondary">
                <span className="material-symbols-outlined">chevron_right</span>
              </Button>
              <Button variant="ghost" size="icon" className="size-9 text-secondary">
                <span className="material-symbols-outlined">last_page</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
