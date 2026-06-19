'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  duration?: number;
  thumbnailUrl?: string;
}

interface UseCloudinaryUploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: string) => void;
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!cloudName || !uploadPreset) {
      const errorMsg = 'Cloudinary no está configurado. Falta CLOUD_NAME o UPLOAD_PRESET.';
      setError(errorMsg);
      options.onError?.(errorMsg);
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    // Para videos grandes, usar recurso tipo 'video'
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    formData.append('resource_type', resourceType);

    try {
      const xhr = new XMLHttpRequest();

      const promise = new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progressData: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            setProgress(progressData);
            options.onProgress?.(progressData);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            
            const result: UploadResult = {
              url: response.secure_url,
              publicId: response.public_id,
              format: response.format,
              resourceType: response.resource_type,
              bytes: response.bytes,
              duration: response.duration,
            };

            // Generar thumbnail URL para videos
            if (resourceType === 'video') {
              result.thumbnailUrl = result.url
                .replace('/upload/', '/upload/w_300,h_200,c_fill,f_jpg/')
                .replace(/\.[^.]+$/, '.jpg');
            }

            resolve(result);
          } else {
            let errorMsg = `Error ${xhr.status}: ${xhr.statusText}`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMsg = errorResponse.error?.message || errorMsg;
            } catch {}
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de red al subir archivo'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Subida cancelada'));
        });

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
        xhr.send(formData);
      });

      const result = await promise;
      setIsUploading(false);
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al subir archivo';
      setError(errorMsg);
      setIsUploading(false);
      options.onError?.(errorMsg);
      return null;
    }
  }, [cloudName, uploadPreset, options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
  }, []);

  return {
    upload,
    cancel,
    reset,
    isUploading,
    progress,
    error,
  };
}
