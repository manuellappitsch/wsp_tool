"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
    { name: "Mo", mental: 65, physical: 40 },
    { name: "Di", mental: 68, physical: 55 },
    { name: "Mi", mental: 75, physical: 60 },
    { name: "Do", mental: 72, physical: 70 },
    { name: "Fr", mental: 80, physical: 75 },
    { name: "Sa", mental: 85, physical: 78 },
    { name: "So", mental: 82, physical: 80 },
];

export function FluxChart() {
    return (
        <Card className="rounded-[2rem] border-none shadow-sm shadow-gray-200/50 bg-white">
            <CardHeader>
                <CardTitle className="text-[#163B40]">Flux Health Trends</CardTitle>
                <CardDescription>Durchschnittliche Werte der letzten 7 Tage</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMental" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2CC8C5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2CC8C5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPhysical" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#163B40" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#163B40" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                            <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="physical"
                                stroke="#163B40"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPhysical)"
                                name="Physisch"
                            />
                            <Area
                                type="monotone"
                                dataKey="mental"
                                stroke="#2CC8C5"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMental)"
                                name="Mental"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
