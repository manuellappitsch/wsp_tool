"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
    userRole: string;
}

export function DashboardHeader({ userRole }: DashboardHeaderProps) {
    return (
        <header className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">

            {/* Left: Mobile Menu & Title */}
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="lg:hidden">
                            <Menu className="w-5 h-5 text-gray-500" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <Sidebar userRole={userRole} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-600">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>

                <div className="h-8 w-px bg-gray-200 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                                <AvatarImage src="/avatars/01.png" alt="@admin" />
                                <AvatarFallback className="bg-[#EAF8F7] text-[#163B40] font-bold">JD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">John Doe</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    admin@firma.com
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
