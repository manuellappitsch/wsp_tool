"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Lightbulb } from "lucide-react";
import { useState } from "react";

export function DailyHack() {
    const [completed, setCompleted] = useState(false);

    return (
        <Card className={`transition-all duration-500 ${completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full flex-shrink-0 transition-colors ${completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {completed ? <Check className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily Health Hack</h4>
                        <h3 className={`text-lg font-bold ${completed ? 'text-green-800' : 'text-gray-800'}`}>
                            "Trink jetzt ein großes Glas Wasser!"
                        </h3>
                        <p className="text-sm text-gray-500">
                            Dein Bandscheiben bestehen zu 80% aus Wasser. Keep them hydrated.
                        </p>

                        {!completed && (
                            <Button
                                onClick={() => setCompleted(true)}
                                variant="outline"
                                size="sm"
                                className="mt-3 text-[#1e3a5f] hover:text-white hover:bg-[#1e3a5f]"
                            >
                                Erledigt (+10 Pkt)
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
