"use client";

import React from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, ArrowRight } from "lucide-react";

export default function ContentPage() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#163B40]">Wissen & Kurse</h1>
                <p className="text-muted-foreground">
                    Exklusive Inhalte für Ihre Gesundheit und Performance.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_COURSES.map((course) => (
                    <Link href={`/user/content/${course.id}`} key={course.id} className="group">
                        <Card className="h-full border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-[2rem] overflow-hidden group-hover:-translate-y-1">
                            {/* Thumbnail Placeholder */}
                            <div className="h-48 bg-gradient-to-br from-[#163B40] to-[#2CC8C5] relative flex items-center justify-center p-6 text-center">
                                <PlayCircle className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {course.modules.length > 0 ? "~ 45 Min" : "Coming Soon"}
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <span className="text-xs font-semibold text-[#2CC8C5] uppercase tracking-wider">
                                        {course.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-[#163B40] mt-1 group-hover:text-[#2CC8C5] transition-colors">
                                        {course.title}
                                    </h3>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="pt-2">
                                    <Button variant="ghost" className="p-0 text-[#163B40] font-semibold hover:bg-transparent hover:text-[#2CC8C5] group-hover:translate-x-1 transition-all">
                                        Zum Kurs <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
