"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
    data: {
        date: string;
        bookings: number;
        capacity: number;
    }[];
}

export function PartnerUtilizationChart({ data }: Props) {
    if (!data || data.length === 0) return <div>Keine Daten verfügbar</div>;

    const maxCapacity = Math.max(...data.map(d => d.capacity));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {/* Capacity Line (Limit) */}
                <Line
                    type="stepAfter"
                    dataKey="capacity"
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    dot={false}
                    strokeWidth={2}
                    name="Tgl. Limit"
                />

                {/* Bookings Line */}
                <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#163B40"
                    strokeWidth={3}
                    dot={{ fill: '#163B40', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Buchungen"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
