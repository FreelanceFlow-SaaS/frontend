"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/api-fetch";
import { uploadInvoiceLogo } from "@/lib/api/profile-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
// Backend limits (see multer config): 800×400
const MAX_LOGO_WIDTH_PX = 800;
const MAX_LOGO_HEIGHT_PX = 400;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Format non supporté. Utilisez PNG, JPEG ou WebP.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Fichier trop volumineux (${humanSize(file.size)}). Maximum : ${humanSize(MAX_FILE_SIZE_BYTES)}.`;
  }
  return null;
}

function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image."));
    };
    img.src = url;
  });
}

function fitContain(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
  return {
    w: Math.max(1, Math.round(srcW * ratio)),
    h: Math.max(1, Math.round(srcH * ratio)),
  };
}

async function resizeToFitLogoConstraints(file: File): Promise<{ file: File; didResize: boolean }> {
  const img = await loadImageFromFile(file);
  const srcW = img.naturalWidth || 0;
  const srcH = img.naturalHeight || 0;
  if (!srcW || !srcH) throw new Error("Impossible de lire l'image.");

  const { w, h } = fitContain(srcW, srcH, MAX_LOGO_WIDTH_PX, MAX_LOGO_HEIGHT_PX);
  const didResize = w !== srcW || h !== srcH;
  if (!didResize) return { file, didResize: false };

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Votre navigateur ne supporte pas le redimensionnement d'image.");
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Redimensionnement impossible."))),
      mime,
      mime === "image/jpeg" ? 0.9 : undefined,
    );
  });

  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  const resized = new File([blob], `logo.${ext}`, { type: blob.type });
  return { file: resized, didResize: true };
}

export interface LogoUploadProps {
  currentLogoUrl: string | null;
  onUploaded: (result: {
    logoUrl?: string | null;
    logoStorageKey?: string | null;
    logoUpdatedAt?: string | null;
  }) => void;
}

export function LogoUpload({ currentLogoUrl, onUploaded }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const remotePreviewUrlRef = useRef<string | null>(null);
  const isLocalPreviewRef = useRef(false);

  async function loadRemotePreview(url: string, accessToken: string): Promise<void> {
    // Release previously created blob URL (remote previews only).
    if (remotePreviewUrlRef.current) {
      URL.revokeObjectURL(remotePreviewUrlRef.current);
      remotePreviewUrlRef.current = null;
    }

    const res = await apiFetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 404) {
      setPreviewUrl(null);
      return;
    }
    if (!res.ok) {
      throw new Error("Impossible de charger le logo.");
    }

    const contentType = res.headers?.get?.("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const text = await res.clone().text();
      // Some environments serialize Nest StreamableFile to JSON instead of streaming bytes.
      // Surface a clear error instead of creating a blob from JSON.
      try {
        const parsed = JSON.parse(text) as { stream?: { path?: unknown } };
        const p = parsed?.stream?.path;
        if (typeof p === "string" && p.includes("/uploads/logos/")) {
          setPreviewUrl(null);
          throw new Error(
            "Le serveur renvoie un JSON au lieu de l’image du logo. Correction requise côté API.",
          );
        }
      } catch {
        // If JSON parsing fails, we'll continue and let blob() logic handle it.
      }
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    remotePreviewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  useEffect(() => {
    if (!currentLogoUrl) {
      setPreviewUrl(null);
      return;
    }
    if (isLocalPreviewRef.current) return;

    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loadRemotePreview(currentLogoUrl, token);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Impossible de charger le logo.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLogoUrl]);

  useEffect(() => {
    return () => {
      if (remotePreviewUrlRef.current) {
        URL.revokeObjectURL(remotePreviewUrlRef.current);
        remotePreviewUrlRef.current = null;
      }
    };
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(null);

    const syncErr = validateFile(file);
    if (syncErr) {
      setError(syncErr);
      return;
    }

    let fileToUpload = file;
    try {
      const resized = await resizeToFitLogoConstraints(file);
      fileToUpload = resized.file;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de traiter l'image.");
      return;
    }

    const sizeErr = validateFile(fileToUpload);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    const localPreview = URL.createObjectURL(fileToUpload);
    isLocalPreviewRef.current = true;
    setPreviewUrl(localPreview);

    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }

    setUploading(true);
    try {
      const result = await uploadInvoiceLogo(token, fileToUpload);
      onUploaded(result);
      if (result.logoUrl) {
        isLocalPreviewRef.current = false;
        await loadRemotePreview(result.logoUrl, token);
      } else {
        isLocalPreviewRef.current = false;
      }
      setSuccess("Logo enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi du logo impossible.");
      isLocalPreviewRef.current = false;
      // Best effort: if a server URL exists, try reloading it.
      if (currentLogoUrl) {
        try {
          await loadRemotePreview(currentLogoUrl, token);
        } catch {
          setPreviewUrl(null);
        }
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="space-y-3" aria-labelledby="logo-upload-heading">
      <h2 id="logo-upload-heading" className="text-base font-medium text-foreground">
        Logo facture
      </h2>
      <p className="text-sm text-muted-foreground">
        PNG, JPEG ou WebP — 2 Mo max, redimensionné automatiquement en {MAX_LOGO_WIDTH_PX}×
        {MAX_LOGO_HEIGHT_PX} px si nécessaire.
      </p>

      <div className="flex items-center gap-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Aperçu du logo"
            className="h-20 w-20 rounded-md border border-border object-contain"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            Aucun logo
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Envoi…" : previewUrl ? "Remplacer le logo" : "Choisir un logo"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={onInputChange}
            aria-label="Sélectionner un fichier logo"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert role="status">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
