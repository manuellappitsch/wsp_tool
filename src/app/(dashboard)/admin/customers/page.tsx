import React from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CreateCustomerDialog } from "@/components/admin/CreateCustomerDialog";
import { AddProductDialog } from "@/components/admin/AddProductDialog";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams.q || "";

    let customersQuery = supabaseAdmin
        .from('b2c_customers')
        .select('*')
        .order('lastName', { ascending: true });

    if (query) {
        customersQuery = customersQuery.ilike('lastName', `%${query}%`);
    }

    const { data: customers, error } = await customersQuery;

    if (error) {
        console.error(error);
        return <div>Fehler beim Laden der Kunden.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#163B40]">Privatkunden (B2C)</h1>
                    <p className="text-gray-500">Verwaltung der Walk-In Kunden und Guthaben.</p>
                </div>
                <CreateCustomerDialog />
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
                <form className="mb-6 max-w-sm flex gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            name="q"
                            placeholder="Nach Namen suchen..."
                            defaultValue={query}
                            className="pl-9"
                        />
                    </div>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 border-b">
                            <tr>
                                <th className="py-3 px-4 font-medium">Name</th>
                                <th className="py-3 px-4 font-medium">Kontakt</th>
                                <th className="py-3 px-4 font-medium">Level</th>
                                <th className="py-3 px-4 font-medium">Credits</th>
                                <th className="py-3 px-4 font-medium">Status</th>
                                <th className="py-3 px-4 font-medium text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {customers?.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-900">
                                        {customer.lastName}, {customer.firstName}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-gray-900">{customer.email}</div>
                                        <div className="text-gray-500 text-xs">{customer.phone}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge variant="outline" className="font-normal">
                                            Level {customer.careLevel}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <span className={`font-bold ${customer.credits > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {customer.credits} Credits
                                                </span>
                                            </div>
                                            {customer.subscriptionEndDate && new Date(customer.subscriptionEndDate) > new Date() && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Abo bis {format(new Date(customer.subscriptionEndDate), "dd.MM.yy")}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {customer.isActive ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none">Aktiv</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inaktiv</Badge>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <AddProductDialog customerId={customer.id} customerName={`${customer.firstName} ${customer.lastName}`} />
                                            {/* Edit Button could go here */}
                                            <button className="text-gray-500 hover:text-gray-900 text-sm">
                                                Bearbeiten
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {customers?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        Keine Kunden gefunden.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
