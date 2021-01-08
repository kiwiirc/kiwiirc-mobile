import Logger from '@/libs/Logger';
import getState from '@/libs/state';
import { ImageSource } from '@nativescript/core';
import i18next from 'i18next';
import { previewThumbsCache } from '@mobile/libs/storage/ImageCaches';

const log = Logger.namespace('UrlEmbed');

export {
    getUrlPreviewAttach
};

function getUrlPreviewAttach(message) {
    const url = message.embed?.payload;

    if (!url) {
        return null;
    }

    const urlTransformer = getState().setting('buffers.thumbnail_url_transformer');
    if (!urlTransformer) {
        return null;
    }

    // if image embed
    if (message.embed.type === 'image') {
        const imagePreviewAttach = {
            id: 'url-preview-' + message.id,
            embedType: 'image',
            url: url,
            title: '',
            thumbnail: previewThumbsCache.placeholder,
            thumbnailUrl: urlTransformer.replace(
                '{url}',
                encodeURIComponent(url)
            ),
            loading: false,
        };

        loadItemThumbnail(imagePreviewAttach);

        return imagePreviewAttach;
    } else {
        const noembedPreviewItem = {
            id: 'url-preview-' + message.id,
            embedType: 'url',
            url: url,
            title: '',
            thumbnail: previewThumbsCache.placeholder,
            loadingInfo: true,
        };

        const embedUrl = getState().setting('buffers.embed_service_url').replace(
            '{url}',
            encodeURIComponent(url)
        );
        console.log('embedUrl: ' + embedUrl);
        fetch(embedUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Invalid response from server. Code: ${response.status}`);
                }
                return response.json();
            })
            .then((r) => {
                if (!r.title && !r.thumbnail_url) {
                    throw new Error('Could not retrieve embed data.');
                }
                noembedPreviewItem.title = r.title;
                noembedPreviewItem.loadingInfo = false;
                if (r.thumbnail_url) {
                    noembedPreviewItem.thumbnailUrl = urlTransformer.replace(
                        '{url}',
                        encodeURIComponent(r.thumbnail_url)
                    );
                    loadItemThumbnail(noembedPreviewItem);
                }
            }).catch((e) => {
                noembedPreviewItem.loadingInfo = false;
                log.error('Error retrieving embeded data:' + e);
                noembedPreviewItem.thumbnail = previewThumbsCache.errorPlaceholder;
                noembedPreviewItem.error = i18next.t('url_embed_error');
            });

        return noembedPreviewItem;
    }
}

function loadItemThumbnail(messageListItem) {
    const myImage = previewThumbsCache.get(messageListItem.thumbnailUrl);

    if (myImage) {
        messageListItem.thumbnail = new ImageSource(myImage);
    } else {
        previewThumbsCache.push({
            key: messageListItem.thumbnailUrl,
            url: messageListItem.thumbnailUrl,
            completed: (image, key) => {
                if (messageListItem.thumbnailUrl === key) {
                    messageListItem.thumbnail = new ImageSource(image).resize(200);
                }
            },
            error: (key) => {
                if (messageListItem.thumbnailUrl === key) {
                    // set error image
                    messageListItem.thumbnail = previewThumbsCache.errorPlaceholder;
                }
            },
        });
    }
}
