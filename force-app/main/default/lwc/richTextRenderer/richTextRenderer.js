/**
 * Utility function to render rich text from Salesforce Chatter messageSegments
 * 
 * @typedef {Object} MessageSegment
 * @property {string} type - Segment type: "Text", "Link", "MarkupBegin", "MarkupEnd", "EntityLink", etc.
 * @property {string} [text] - Text content
 * @property {string} [url] - URL for Link segments
 * @property {string} [htmlTag] - HTML tag name for MarkupBegin/MarkupEnd segments
 * @property {string} [markupType] - Markup type (e.g., "Paragraph")
 * @property {string} [altText] - Alt text for images
 */

/**
 * Renders rich text from Salesforce Chatter messageSegments array to HTML string
 * 
 * @param {MessageSegment[]} messageSegments - Array of message segments from Chatter API
 * @returns {string} Rendered HTML string
 * 
 * @example
 * const segments = [
 *   { type: "MarkupBegin", htmlTag: "p" },
 *   { type: "Text", text: "Hello " },
 *   { type: "Link", text: "world", url: "https://example.com" },
 *   { type: "MarkupEnd", htmlTag: "p" }
 * ];
 * const html = renderRichText(segments);
 * // Returns: "<p>Hello <a href=\"https://example.com\">world</a></p>"
 */
export function renderRichText(messageSegments = []) {
    if (!Array.isArray(messageSegments) || messageSegments.length === 0) {
        return '';
    }

    let html = '';
    const openTags = []; // Stack to track open markup tags

    for (const segment of messageSegments) {
        switch (segment.type) {
            case 'MarkupBegin':
                if (segment.htmlTag) {
                    html += `<${segment.htmlTag}>`;
                    openTags.push(segment.htmlTag);
                }
                break;

            case 'MarkupEnd':
                if (segment.htmlTag && openTags.length > 0) {
                    const tag = openTags.pop();
                    html += `</${tag}>`;
                }
                break;

            case 'Text':
                if (segment.text) {
                    // Decode HTML entities and escape HTML
                    html += escapeHtml(decodeHtmlEntities(segment.text));
                }
                break;

            case 'Link':
                if (segment.text && segment.url) {
                    html += `<a href="${escapeHtml(segment.url)}">${escapeHtml(decodeHtmlEntities(segment.text))}</a>`;
                } else if (segment.text) {
                    // If no URL, just render as text
                    html += escapeHtml(decodeHtmlEntities(segment.text));
                }
                break;

            case 'EntityLink':
                // EntityLink typically represents a user or record mention
                if (segment.text && segment.reference?.url) {
                    html += `<a href="${escapeHtml(segment.reference.url)}">${escapeHtml(segment.text)}</a>`;
                } else if (segment.text) {
                    html += escapeHtml(segment.text);
                }
                break;

            default:
                // For unknown types, try to render text if available
                if (segment.text) {
                    html += escapeHtml(decodeHtmlEntities(segment.text));
                }
                break;
        }
    }

    // Close any remaining open tags
    while (openTags.length > 0) {
        const tag = openTags.pop();
        html += `</${tag}>`;
    }

    return html;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Decodes HTML entities like &#39; to '
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    // Common HTML entities mapping
    const entityMap = {
        '&#39;': "'",
        '&apos;': "'",
        '&quot;': '"',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&nbsp;': ' ',
        '&#160;': ' '
    };
    
    // Decode numeric entities (&#39; -> ')
    let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
    });
    
    // Decode hex entities (&#x27; -> ')
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Decode named entities
    for (const [entity, char] of Object.entries(entityMap)) {
        decoded = decoded.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char);
    }
    
    return decoded;
}
