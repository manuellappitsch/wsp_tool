import { Zap, PlayCircle, FileText } from "lucide-react";

export interface VideoModule {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string; // Using placeholders for now
    duration: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    modules: VideoModule[];
    category: "Health" | "Mental" | "Safety";
}

export const MOCK_COURSES: Course[] = [
    {
        id: "neck-pain-relief",
        title: "Nackenschmerzen und Verspannungen loswerden",
        description: "Ein gezielter Kurs zur Linderung von Nackenbeschwerden durch effektive Übungen und Haltungskorrektur.",
        thumbnailUrl: "/images/course-neck.jpg", // Placeholder
        category: "Health",
        modules: [
            {
                id: "vid-1",
                title: "Einführung & Anatomie",
                description: "Verstehen Sie die Ursachen Ihrer Nackenschmerzen. Eine kurze Einführung in die Anatomie der Halswirbelsäule.",
                thumbnailUrl: "/thumbnails/v1.jpg",
                duration: "05:30"
            },
            {
                id: "vid-2",
                title: "Mobilisation am Arbeitsplatz",
                description: "Einfache Übungen, die Sie direkt am Schreibtisch durchführen können, um Verspannungen sofort zu lösen.",
                thumbnailUrl: "/thumbnails/v2.jpg",
                duration: "12:45"
            },
            {
                id: "vid-3",
                title: "Stärkung der Tiefenmuskulatur",
                description: "Langfristige Schmerzfreiheit durch gezielte Kräftigung der stabilisierenden Nackenmuskulatur.",
                thumbnailUrl: "/thumbnails/v3.jpg",
                duration: "18:20"
            }
        ]
    },
    {
        id: "mental-focus",
        title: "Mental Focus & Stressabbau",
        description: "Techniken zur Steigerung der Konzentration und Reduktion von Stress im Arbeitsalltag.",
        thumbnailUrl: "/images/course-mind.jpg",
        category: "Mental",
        modules: []
    }
];
