'use client';

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, Calendar, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { EmployeeDialog } from "@/components/tenant/EmployeeDialog";
import { deleteEmployee } from "@/actions/tenant-user";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
}

interface UsersManagementClientProps {
    initialEmployees: Employee[];
}

export function UsersManagementClient({ initialEmployees }: UsersManagementClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

    // Delete State
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleCreate = () => {
        setEmployeeToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (emp: Employee) => {
        setEmployeeToEdit(emp);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (emp: Employee) => {
        setEmployeeToDelete(emp);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;

        startDeleteTransition(async () => {
            const res = await deleteEmployee(employeeToDelete.id);
            if (res.success) {
                toast.success("Mitarbeiter gelöscht");
                setEmployeeToDelete(null);
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-[#163B40]">Mitarbeiter</h1>
                    <p className="text-muted-foreground">Verwalten Sie hier Ihr Team.</p>
                </div>
                <Button onClick={handleCreate} className="bg-[#1e3a5f]">
                    <Plus className="mr-2 h-4 w-4" />
                    Neuer Mitarbeiter
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Übersicht</CardTitle>
                    <CardDescription>
                        {initialEmployees?.length || 0} Mitarbeiter im System
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!initialEmployees || initialEmployees.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p>Noch keine Mitarbeiter angelegt.</p>
                            <Button variant="link" onClick={handleCreate} className="mt-2 text-[#1e3a5f]">
                                Jetzt starten
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">E-Mail</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Registriert am</th>
                                        <th className="px-4 py-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-white">
                                    {initialEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-3 font-medium text-[#163B40]">
                                                {emp.firstName} {emp.lastName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 opacity-50" />
                                                    {emp.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={emp.isActive ? "secondary" : "destructive"} className="font-normal">
                                                    {emp.isActive ? "Aktiv" : "Inaktiv"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Calendar className="h-3 w-3 opacity-50" />
                                                    {format(new Date(emp.createdAt), 'dd.MM.yyyy', { locale: de })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(emp)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(emp)} className="text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EmployeeDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                employeeToEdit={employeeToEdit}
            />

            <AlertDialog open={!!employeeToDelete} onOpenChange={(o) => !o && setEmployeeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mitarbeiter wirklich löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Der Zugang für {employeeToDelete?.firstName} {employeeToDelete?.lastName} wird dauerhaft entfernt.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? "Löscht..." : "Löschen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
