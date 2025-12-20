"use client";

import React, { useState, useActionState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCourse } from "@/actions/content";
import { FolderPlus, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSignedUploadUrl } from "@/actions/storage";

const initialState = {
    success: false,
    message: ""
};

interface Props {
    trigger?: React.ReactNode;
}

export function AddCourseDialog({ trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createCourse, initialState);

    // Thumbnail State
    const [uploading, setUploading] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState("");

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            setThumbnailUrl("");
        }
    }, [state.success]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `course_thumb_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const bucketName = "videos"; // Reusing videos bucket for simplicity, or create 'images'

            const { data, error: tokenError } = await getSignedUploadUrl(bucketName, fileName);
            if (tokenError || !data) throw new Error("Token Error");

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .uploadToSignedUrl(fileName, data.token, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            setThumbnailUrl(publicUrl);

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Fehler beim Upload!');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#163B40] hover:bg-[#163B40]/90">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Neuer Kurs
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Neuen Videokurs erstellen</DialogTitle>
                </DialogHeader>

                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Kurstitel *</Label>
                        <Input id="title" name="title" required placeholder="z.B. Rückentraining Level 1" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea id="description" name="description" placeholder="Worum geht es in diesem Kurs?" />
                    </div>

                    <div className="space-y-2">
                        <Label>Thumbnail (Optional)</Label>
                        <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="course-thumb-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                                    ) : thumbnailUrl ? (
                                        <div className="relative h-full w-full">
                                            <img src={thumbnailUrl} alt="Preview" className="h-24 object-cover rounded mx-auto" />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                            <p className="text-xs text-gray-500">Bild hochladen</p>
                                        </>
                                    )}
                                </div>
                                <input id="course-thumb-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {state.message && (
                        <div className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                        <Button type="submit" className="bg-[#163B40] hover:bg-[#163B40]/90" disabled={uploading}>
                            {uploading ? "Lädt..." : "Erstellen"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
