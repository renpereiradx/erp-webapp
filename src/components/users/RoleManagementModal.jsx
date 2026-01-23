import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useI18n } from '@/lib/i18n';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import roleService from '@/services/roleService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shield, Plus, Edit2, Trash2, Key, Info } from 'lucide-react';

/**
 * RoleManagementModal - Componente para la gestión de roles y permisos.
 * Implementado como un componente modular (Web Component style).
 */
export function RoleManagementModal({ open, onOpenChange }) {
    const { t } = useI18n();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('list');

    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
        },
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rolesData, permissionsData] = await Promise.all([
                roleService.getRoles(),
                roleService.getAllPermissions(),
            ]);
            setRoles(rolesData.data || []);
            setPermissions(permissionsData.data || []);
        } catch (error) {
            toast.error('Error al cargar datos de roles y permisos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrUpdateRole = async (data) => {
        // Normalizar a mayúsculas como pide la API
        const payload = { ...data, name: data.name.toUpperCase() };

        try {
            if (selectedRole) {
                await roleService.updateRole(selectedRole.id, payload);
                toast.success('Rol actualizado exitosamente');
            } else {
                await roleService.createRole(payload);
                toast.success('Rol creado exitosamente');
            }
            loadData();
            setActiveTab('list');
            setSelectedRole(null);
            form.reset();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Error al procesar la solicitud');
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este rol?')) return;
        try {
            await roleService.deleteRole(id);
            toast.success('Rol eliminado exitosamente');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Error al eliminar el rol');
        }
    };

    const startEdit = (role) => {
        setSelectedRole(role);
        form.setValue('name', role.name);
        form.setValue('description', role.description || '');
        setActiveTab('form');
    };

    const startCreate = () => {
        setSelectedRole(null);
        form.reset({ name: '', description: '' });
        setActiveTab('form');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="user-form sm:max-w-[700px] p-0 overflow-hidden border-none shadow-64">
                <DialogHeader className="user-form__header">
                    <DialogTitle className="user-form__title flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {t('roles.management_title', 'Gestión de Roles y Permisos')}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="list" className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {t('roles.tabs.list', 'Lista de Roles')}
                            </TabsTrigger>
                            <TabsTrigger value="form" className="flex items-center gap-2">
                                {selectedRole ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {selectedRole ? t('roles.tabs.edit', 'Editar Rol') : t('roles.tabs.create', 'Nuevo Rol')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="list">
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3">
                                    {roles.length === 0 && !isLoading && (
                                        <div className="text-center py-10 text-secondary">
                                            {t('roles.no_roles', 'No hay roles definidos')}
                                        </div>
                                    )}
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary">{role.name}</span>
                                                    <Badge variant="outline" className="text-[10px] py-0">{role.id}</Badge>
                                                </div>
                                                <p className="text-sm text-secondary">{role.description || t('roles.no_description', 'Sin descripción')}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {role.permissions?.slice(0, 3).map(p => (
                                                        <Badge key={p.id} variant="secondary" className="text-[10px]">
                                                            {p.name}
                                                        </Badge>
                                                    ))}
                                                    {role.permissions?.length > 3 && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            +{role.permissions.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(role)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRole(role.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={startCreate} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    {t('roles.add_new', 'Agregar Nuevo Rol')}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="form">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleCreateOrUpdateRole)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        rules={{ required: 'El nombre es obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('roles.form.name', 'Nombre del Rol')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="EJ: SUPERVISOR" style={{ textTransform: 'uppercase' }} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('roles.form.description', 'Descripción')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Descripción del rol..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {selectedRole && (
                                        <div className="mt-6 border-t pt-4">
                                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <Key className="w-4 h-4" />
                                                {t('roles.form.permissions', 'Gestionar Permisos')}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2">
                                                {permissions.map((perm) => {
                                                    const isAssigned = selectedRole.permissions?.some(p => p.id === perm.id);
                                                    return (
                                                        <div
                                                            key={perm.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-2 rounded border text-xs cursor-pointer",
                                                                isAssigned ? "bg-primary/10 border-primary" : "hover:bg-muted"
                                                            )}
                                                            onClick={async () => {
                                                                try {
                                                                    if (isAssigned) {
                                                                        await roleService.removePermissionFromRole(selectedRole.id, perm.id);
                                                                        toast.info(`Permiso ${perm.name} removido`);
                                                                    } else {
                                                                        await roleService.assignPermissionToRole(selectedRole.id, perm.id);
                                                                        toast.success(`Permiso ${perm.name} asignado`);
                                                                    }
                                                                    // Refresh the current role detail
                                                                    const updatedRole = await roleService.getRoleById(selectedRole.id);
                                                                    setSelectedRole(updatedRole.data);
                                                                    // Update list too
                                                                    setRoles(roles.map(r => r.id === selectedRole.id ? updatedRole.data : r));
                                                                } catch (e) {
                                                                    toast.error('Error al actualizar permisos');
                                                                }
                                                            }}
                                                        >
                                                            <span>{perm.name}</span>
                                                            {isAssigned && <Shield className="w-3 h-3 text-primary" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setActiveTab('list')}>
                                            {t('common.cancel', 'Cancelar')}
                                        </Button>
                                        <Button type="submit">
                                            {selectedRole ? t('common.save', 'Guardar Cambios') : t('common.create', 'Crear Rol')}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="bg-muted/30 p-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-secondary w-full">
                        <Info className="w-3 h-3" />
                        <span>{t('roles.footer_info', 'Los cambios en roles afectan a todos los usuarios asignados.')}</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
