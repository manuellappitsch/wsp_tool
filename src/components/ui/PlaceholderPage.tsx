import React from "react";
import { Hammer, Construction } from "lucide-react";

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh] border-2 border-dashed border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Construction className="h-10 w-10 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#163B40] mb-2">{title}</h1>
            <p className="text-gray-500 max-w-md">
                {description || "Diese Funktion wird in Kürze verfügbar sein. Wir arbeiten mit Hochdruck daran!"}
            </p>
        </div>
    );
}
