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

export const MOCK_COURSES: Course[] = [];
