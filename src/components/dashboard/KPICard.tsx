

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string;
    description: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    icon: React.ElementType;
    className?: string;
}

export function KPICard({ title, value, description, trend, trendValue, icon: Icon, className }: KPICardProps) {
    return (
        <Card className={cn("rounded-[1.5rem] border-none shadow-sm shadow-gray-200/50 bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-9 w-9 bg-[#EAF8F7] rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[#2CC8C5]" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-[#163B40]">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                    {trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    {trend === "neutral" && <Minus className="w-4 h-4 text-gray-400" />}

                    {trendValue && (
                        <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' :
                            trend === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {trendValue}
                        </span>
                    )}
                    <p className="text-xs text-muted-foreground ml-auto">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
