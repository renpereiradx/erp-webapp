import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Eye, 
  FileText, 
  Ban, 
  Trash2, 
  ShieldCheck, 
  CreditCard, 
  Monitor, 
  Smartphone, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  KeyRound,
  Edit2,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const UserDetailedProfile = () => {
  return (
    <div className="user-profile">
      <main className="user-profile__content">
        <div className="user-profile__container">
          {/* Breadcrumbs */}
          <div className="user-profile__breadcrumb-container">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/usuarios">Usuarios</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Caleb Jenkins</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Section */}
          <div className="user-profile__header">
            <div className="user-profile__header-left">
              <div className="user-profile__avatar-wrapper">
                <Avatar size={96}>
                  <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuByUG1GXA4Fteawryn8QEa80rFZ1QVu6eMZojxHF5a5mBr-x0JmwQD5g7xSBS8gQx6E4tkAx0uFnDWlB1lR8FkPRqfXN8iGCDkTjKjzFwLMe02C0SdXOF4VETZXBTWM3QFJe9J7zgfBWYyA--zyzIovvFEVsTIVdGNU9yhLRSxKJUhnnYzcpvNWhmCVle9_lcpplI-Hdh9iZ1aGR1BIg4ngbC26GAmhx49kvmlDnX1OnF7dRzzLfyq_E107gks3yi5W9SQjhHWmLg" alt="Caleb Jenkins" />
                  <AvatarFallback>CJ</AvatarFallback>
                </Avatar>
                <div className="user-profile__status-indicator" />
              </div>
              <div className="user-profile__header-info">
                <div className="user-profile__name-row">
                  <h1>Caleb Jenkins</h1>
                  <Badge variant="subtle-success" shape="pill">ACTIVO</Badge>
                </div>
                <p className="user-profile__subtitle">Senior Systems Architect • Seattle, WA • Miembro desde Ene 2022</p>
                <div className="user-profile__contact-row">
                  <span className="user-profile__contact-item">
                    <Mail /> caleb.jenkins@acme.corp
                  </span>
                  <span className="user-profile__contact-item">
                    <Phone /> +1 (555) 012-3456
                  </span>
                </div>
              </div>
            </div>
            <div className="user-profile__header-actions">
              <Button variant="secondary">
                <KeyRound className="btn__icon" />
                Reiniciar Contraseña
              </Button>
              <Button variant="primary">
                <Edit2 className="btn__icon" />
                Editar Perfil
              </Button>
              <Button variant="secondary" size="icon">
                <MoreVertical />
              </Button>
            </div>
          </div>

          <div className="user-profile__grid">
            {/* Left Sidebar: Metadata & Stats */}
            <div className="user-profile__sidebar">
              <Card>
                <CardHeader>
                  <CardTitle className="user-profile__card-title">
                    <Info /> Resumen de Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent className="user-profile__info-list">
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">ID Empleado</span>
                    <span className="user-profile__info-value">EMP-88294</span>
                  </div>
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">Departamento</span>
                    <span className="user-profile__info-value">Ingeniería Core</span>
                  </div>
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">Reporta a</span>
                    <div className="user-profile__info-value--persona">
                      <div className="user-profile__reports-avatar">SH</div>
                      <span>Sarah Henderson</span>
                    </div>
                  </div>
                  <div className="user-profile__info-item">
                    <span className="user-profile__info-label">Último Acceso</span>
                    <span className="user-profile__info-value">hace 2 horas (desde Seattle, WA)</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gestión Rápida</CardTitle>
                </CardHeader>
                <CardContent className="user-profile__action-list">
                  <Button variant="ghost" className="user-profile__quick-action-btn">
                    <Eye /> Suplantar Usuario
                  </Button>
                  <Button variant="ghost" className="user-profile__quick-action-btn">
                    <FileText /> Exportar Registro de Auditoría
                  </Button>
                  <Button variant="ghost" className="user-profile__quick-action-btn">
                    <Ban /> Desactivar Cuenta
                  </Button>
                  <Button variant="ghost" className="user-profile__quick-action-btn user-profile__quick-action-btn--destructive">
                    <Trash2 /> Eliminar Usuario
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Roles, Sessions, History */}
            <div className="user-profile__main">
              {/* Roles & Permissions */}
              <Card>
                <CardHeader className="card__header--with-action">
                  <CardTitle>Roles y Permisos Asignados</CardTitle>
                  <Button variant="ghost" className="btn--link">Gestionar Roles</Button>
                </CardHeader>
                <CardContent>
                  <div className="user-profile__roles-grid">
                    <div className="user-profile__role-card">
                      <div className="user-profile__role-header">
                        <Badge variant="primary">SYSTEM ADMIN</Badge>
                        <ShieldCheck />
                      </div>
                      <p className="user-profile__role-name">Acceso Total a la Instancia</p>
                      <p className="user-profile__role-description">Capacidad para gestionar todos los usuarios, configuraciones de seguridad y ajustes globales.</p>
                    </div>
                    <div className="user-profile__role-card">
                      <div className="user-profile__role-header">
                        <Badge variant="secondary">BILLING EDITOR</Badge>
                        <CreditCard />
                      </div>
                      <p className="user-profile__role-name">Operaciones Financieras</p>
                      <p className="user-profile__role-description">Puede ver y modificar planes de suscripción y métodos de pago.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader className="card__header--highlight card__header--with-action">
                  <CardTitle>Sesiones de Seguridad Activas</CardTitle>
                  <Button variant="ghost" className="btn--destructive-link">Cerrar sesión en todos los dispositivos</Button>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navegador / SO</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Dirección IP</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="user-profile__session-info">
                          <div className="flex items-center gap-8">
                            <Monitor className="text-primary w-20 h-20" />
                            <div>
                              <span className="font-semibold">Chrome en Windows</span>
                              <div className="text-success">Sesión Actual</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>Seattle, USA</TableCell>
                      <TableCell className="id-cell">192.168.1.104</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <LogOut />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="user-profile__session-info">
                          <div className="flex items-center gap-8">
                            <Smartphone className="w-20 h-20" />
                            <div>
                              <span className="font-semibold">Safari en iPhone 15</span>
                              <div className="text-muted">Activo hace 4 horas</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>Bellevue, USA</TableCell>
                      <TableCell className="id-cell">74.125.22.101</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" className="badge--subtle-error badge--small">
                          Revocar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>

              {/* Login History */}
              <Card>
                <CardHeader className="card__header--with-action">
                  <CardTitle>Historial de Inicio de Sesión Reciente</CardTitle>
                  <Button variant="ghost" className="btn--link">
                    Ver Auditoría Completa <ChevronRight />
                  </Button>
                </CardHeader>
                <div className="user-profile__history-list">
                  <div className="user-profile__history-item">
                    <div className="user-profile__history-left">
                      <div className="user-profile__history-icon user-profile__history-icon--success">
                        <CheckCircle />
                      </div>
                      <div className="user-profile__history-details">
                        <span className="title">Inicio de Sesión Exitoso</span>
                        <span className="date">24 de Marzo, 2024 a las 10:14 AM</span>
                      </div>
                    </div>
                    <span className="user-profile__ip-badge">192.168.1.104</span>
                  </div>
                  <div className="user-profile__history-item">
                    <div className="user-profile__history-left">
                      <div className="user-profile__history-icon user-profile__history-icon--error">
                        <AlertCircle />
                      </div>
                      <div className="user-profile__history-details">
                        <span className="title">Intento Fallido</span>
                        <span className="date">23 de Marzo, 2024 a las 11:45 PM (Contraseña Incorrecta)</span>
                      </div>
                    </div>
                    <span className="user-profile__ip-badge">203.0.113.42</span>
                  </div>
                  <div className="user-profile__history-item">
                    <div className="user-profile__history-left">
                      <div className="user-profile__history-icon user-profile__history-icon--success">
                        <CheckCircle />
                      </div>
                      <div className="user-profile__history-details">
                        <span className="title">Inicio de Sesión Exitoso</span>
                        <span className="date">22 de Marzo, 2024 a las 09:02 AM</span>
                      </div>
                    </div>
                    <span className="user-profile__ip-badge">192.168.1.104</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDetailedProfile;