import slugify from "slugify";
import sanitizeHtml from "sanitize-html";

export function createGameSlug(name) {
    return slugify(name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
    });
}

export function sanitizeIframe(iframeCode) {
    return sanitizeHtml(iframeCode, {
        allowedTags: ['iframe', 'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
        allowedAttributes: {
            'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'scrolling', 'allow'],
            'a': ['href', 'target']
        }
    });
} 