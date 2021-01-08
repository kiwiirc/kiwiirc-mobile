import { ImageCache, ImageSource } from '@nativescript/core';

const previewThumbsCache = new ImageCache();

previewThumbsCache.placeholder = ImageSource.fromResourceSync('imageplaceholder');
previewThumbsCache.errorPlaceholder = ImageSource.fromResourceSync('imageplaceholdererror');

export {
    previewThumbsCache
};
