"use client";

import React, { useState, useActionState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createVideo } from "@/actions/content";
import { Video, Plus, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSignedUploadUrl } from "@/actions/storage";

const initialState = {
    success: false,
    message: ""
};

interface Props {
    courseId?: string;
}

export function AddVideoDialog({ courseId }: Props) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createVideo, initialState);

    // Upload State
    const [mode, setMode] = useState<"FILE" | "URL">("FILE");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState("");
    const [externalUrl, setExternalUrl] = useState("");

    // Thumbnail State
    const [thumbMode, setThumbMode] = useState<"FILE" | "URL">("FILE");
    const [thumbUploading, setThumbUploading] = useState(false);
    const [uploadedThumbUrl, setUploadedThumbUrl] = useState("");
    const [externalThumbUrl, setExternalThumbUrl] = useState("");

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            // Reset state
            setUploadedUrl("");
            setExternalUrl("");
            setUploadProgress(0);

            setUploadedThumbUrl("");
            setExternalThumbUrl("");
        }
    }, [state.success]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "VIDEO" | "IMAGE") => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (type === "VIDEO") {
                setUploading(true);
                setUploadProgress(0);
            } else {
                setThumbUploading(true);
            }

            const fileExt = file.name.split('.').pop();
            const prefix = type === "VIDEO" ? "vid" : "thumb";
            const fileName = `${prefix}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;
            const bucketName = "videos";

            // 1. Get Signed URL from Server
            const { data, error: tokenError } = await getSignedUploadUrl(bucketName, filePath);

            if (tokenError || !data) {
                console.error("Token Error:", tokenError);
                throw new Error("Konnte Upload-Token nicht generieren.");
            }

            // 2. Upload to Signed URL using Token
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .uploadToSignedUrl(filePath, data.token, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Get Public URL (Bucket is public)
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            if (type === "VIDEO") {
                setUploadedUrl(publicUrl);
                setUploadProgress(100);
            } else {
                setUploadedThumbUrl(publicUrl);
            }

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Fehler beim Upload!');
        } finally {
            if (type === "VIDEO") {
                setUploading(false);
            } else {
                setThumbUploading(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#163B40] hover:bg-[#163B40]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Video hinzufügen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neuen Videokurs erstellen</DialogTitle>
                </DialogHeader>

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="courseId" value={courseId || ""} />

                    <div className="space-y-2">
                        <Label htmlFor="title">Titel *</Label>
                        <Input id="title" name="title" required placeholder="z.B. Rückentraining - Level 1" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea id="description" name="description" placeholder="Was lernen die Teilnehmer in diesem Kurs?" />
                    </div>

                    {/* Source Selection */}
                    <div className="space-y-2">
                        <Label>Video Quelle</Label>
                        <Tabs defaultValue="FILE" onValueChange={(v) => setMode(v as "FILE" | "URL")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="FILE">Datei Upload</TabsTrigger>
                                <TabsTrigger value="URL">Externer Link</TabsTrigger>
                            </TabsList>

                            <TabsContent value="FILE" className="pt-2 space-y-2">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file-video" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 mb-2 text-gray-500 animate-spin" />
                                                    <p className="text-sm text-gray-500">Wird hochgeladen...</p>
                                                </>
                                            ) : uploadedUrl ? (
                                                <>
                                                    <Video className="w-8 h-8 mb-2 text-green-500" />
                                                    <p className="text-sm text-green-600 font-medium">Upload erfolgreich!</p>
                                                    <p className="text-xs text-gray-500 break-all px-4 text-center mt-1">{uploadedUrl.split('/').pop()}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                    <p className="text-sm text-gray-500"><span className="font-semibold">Klicken zum Upload</span></p>
                                                    <p className="text-xs text-gray-500">MP4, WebM (Max. 100MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input id="dropzone-file-video" type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, "VIDEO")} disabled={uploading} />
                                    </label>
                                </div>
                            </TabsContent>

                            <TabsContent value="URL" className="pt-2">
                                <div className="relative">
                                    <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        name="externalUrl"
                                        placeholder="https://vimeo.com/..."
                                        className="pl-9"
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Youtube, Vimeo oder direkter Link.</p>
                            </TabsContent>
                        </Tabs>

                        {/* Hidden Input for Server Action */}
                        <input type="hidden" name="url" value={mode === "FILE" ? uploadedUrl : externalUrl} required />
                    </div>

                    {/* Thumbnail Selection */}
                    <div className="space-y-2">
                        <Label>Thumbnail Bild (Optional)</Label>
                        <Tabs defaultValue="FILE" onValueChange={(v) => setThumbMode(v as "FILE" | "URL")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="FILE">Bild Upload</TabsTrigger>
                                <TabsTrigger value="URL">Bild URL</TabsTrigger>
                            </TabsList>

                            <TabsContent value="FILE" className="pt-2 space-y-2">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file-thumb" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {thumbUploading ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 mb-2 text-gray-500 animate-spin" />
                                                    <p className="text-sm text-gray-500">Lädt...</p>
                                                </>
                                            ) : uploadedThumbUrl ? (
                                                <div className="relative w-full h-full p-2">
                                                    <img src={uploadedThumbUrl} alt="Preview" className="h-20 w-auto mx-auto object-cover rounded shadow-sm" />
                                                    <p className="text-xs text-center text-green-600 mt-1">Hochgeladen!</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                    <p className="text-sm text-gray-500"><span className="font-semibold">Klicken zum Upload</span></p>
                                                    <p className="text-xs text-gray-500">JPG, PNG (16:9 empfohlen)</p>
                                                </>
                                            )}
                                        </div>
                                        <input id="dropzone-file-thumb" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "IMAGE")} disabled={thumbUploading} />
                                    </label>
                                </div>
                            </TabsContent>

                            <TabsContent value="URL" className="pt-2">
                                <Input
                                    name="externalThumbUrl"
                                    placeholder="https://..."
                                    value={externalThumbUrl}
                                    onChange={(e) => setExternalThumbUrl(e.target.value)}
                                />
                            </TabsContent>
                        </Tabs>
                        {/* Hidden Input for Server Action */}
                        <input type="hidden" name="thumbnailUrl" value={thumbMode === "FILE" ? uploadedThumbUrl : externalThumbUrl} />
                    </div>

                    {state.message && (
                        <div className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                        <Button type="submit" className="bg-[#163B40] hover:bg-[#163B40]/90" disabled={uploading || thumbUploading || (mode === "FILE" && !uploadedUrl)}>
                            {uploading || thumbUploading ? "Warten..." : "Erstellen"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
