"use client";

import React, { useTransition, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Calendar as CalendarIcon, Server, Shield, Loader2, Activity } from "lucide-react";
import { DaySchedule, generateTimeslotsForMonth } from "@/actions/schedule";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";
import { AnalysisSettings } from "@/components/admin/AnalysisSettings";
import { toast } from "sonner";
import { VideoManager } from "@/components/admin/content/VideoManager";
import { CourseManager } from "@/components/admin/content/CourseManager";
import { CourseDetail } from "@/components/admin/content/CourseDetail";
import { AddCourseDialog } from "@/components/admin/content/AddCourseDialog";
import { deleteCourse } from "@/actions/content";

interface Props {
    openingHours: DaySchedule[];
    analysisSchedules: any[]; // Using any for simplicity or import the interface
    courses: any[];
    orphanVideos: any[];
}

export function SettingsClient({ openingHours, analysisSchedules, courses, orphanVideos }: Props) {
    const [isGenerating, startTransition] = useTransition();

    // Video/Course State
    const [view, setView] = useState<"LIST" | "DETAIL">("LIST");
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    const handleGenerate = () => {
        startTransition(async () => {
            const result = await generateTimeslotsForMonth();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Erfolg! ${result.count || 0} Slots generiert.`);
            }
        });
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* ... header ... */}

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="calendar">Kalender & Zeiten</TabsTrigger>
                    <TabsTrigger value="videos">Videokurse</TabsTrigger>
                    <TabsTrigger value="defaults">Standards</TabsTrigger>
                    <TabsTrigger value="system">System & Wartung</TabsTrigger>
                </TabsList>

                {/* Tab 1: Calendar Settings */}
                <TabsContent value="calendar">
                    {/* ... content ... */}
                    <div className="grid gap-6">
                        {/* Generator Card */}
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="pt-6 flex items-start gap-4">
                                <CalendarIcon className="h-6 w-6 text-yellow-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-yellow-900 mb-1">Slots aktualisieren</h3>
                                    <p className="text-sm text-yellow-800 mb-4">
                                        Nach Änderungen an den Öffnungszeiten müssen die Zeitslots für die nächsten 30 Tage neu generiert werden.
                                        Bestehende Buchungen bleiben erhalten.
                                    </p>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300"
                                    >
                                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Slots jetzt generieren"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" /> 7-Tage & Pausen Editor
                                </CardTitle>
                                <CardDescription>
                                    Legen Sie exakte Zeiten und Pausen für jeden Wochentag fest.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <OpeningHoursEditor initialData={openingHours} />
                            </CardContent>
                        </Card>

                        {/* Analysis Settings */}
                        <Card className="border-purple-100 bg-purple-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-900">
                                    <Activity className="h-5 w-5" /> Biomechanische Analyse
                                </CardTitle>
                                <CardDescription>
                                    Definieren Sie Zeitfenster, die exklusiv für Analysen reserviert sind.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AnalysisSettings schedules={analysisSchedules} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Videos (New) */}
                <TabsContent value="videos">
                    {view === "LIST" ? (
                        <>
                            <CourseManager
                                courses={courses}
                                onSelectCourse={(course) => {
                                    setSelectedCourse(course);
                                    setView("DETAIL");
                                }}
                                onDeleteCourse={async (id) => {
                                    if (confirm("Kurs wirklich löschen?")) {
                                        await deleteCourse(id);
                                    }
                                }}
                            />
                        </>
                    ) : (
                        selectedCourse ? (
                            <CourseDetail
                                course={selectedCourse}
                                currentVideos={selectedCourse.contents || []}
                                onBack={() => {
                                    setSelectedCourse(null);
                                    setView("LIST");
                                }}
                            />
                        ) : (
                            <div>Fehler: Kein Kurs gewählt. <Button onClick={() => setView("LIST")}>Zurück</Button></div>
                        )
                    )}
                </TabsContent>

                {/* Tab 3: Defaults */}
                <TabsContent value="defaults">
                    {/* ... content ... */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" /> Standard-Werte für neue Partner
                            </CardTitle>
                            <CardDescription>
                                Diese Werte werden automatisch gesetzt, wenn Sie einen neuen B2B Partner anlegen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Standard Kontingent (täglich)</Label>
                                <Input type="number" defaultValue="1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Standard Probezeitraum (Tage)</Label>
                                <Input type="number" defaultValue="30" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: System */}
                <TabsContent value="system">
                    {/* ... content ... */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" /> System Status
                            </CardTitle>
                            <CardDescription>
                                Technische Einstellungen und Notfall-Steuerung.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-medium">Wartungsmodus</h4>
                                    <p className="text-sm text-gray-500">
                                        Verhindert neue Buchungen und zeigt einen Hinweis im Portal.
                                    </p>
                                </div>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                    Aktivieren
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-medium">Cache leeren</h4>
                                    <p className="text-sm text-gray-500">
                                        Setzt temporäre Daten und Statistiken zurück.
                                    </p>
                                </div>
                                <Button variant="outline">
                                    Ausführen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-500 font-mono">
                        <p>Version: 1.0.1 (Flux Advanced)</p>
                        <p>Environment: {process.env.NODE_ENV}</p>
                        <p>Supabase Connected: Yes</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
