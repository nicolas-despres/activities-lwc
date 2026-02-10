import { LightningElement, api } from 'lwc';
import { renderRichText } from 'c/richTextRenderer';

/**
 * @typedef {Object} FeedElementActor
 * @property {string} id
 * @property {string} displayName
 * @property {string} type
 * @property {Object} photo
 * @property {string} photo.smallPhotoUrl
 */

/**
 * @typedef {Object} FeedElementParent
 * @property {string} id
 * @property {string} type
 * @property {string} name
 */

/**
 * @typedef {Object} TrackedChange
 * @property {string} fieldName
 * @property {string} [oldValue]
 * @property {string} newValue
 */

/**
 * @typedef {Object} FeedElementBody
 * @property {string} [text]
 * @property {boolean} [isRichText]
 */

/**
 * @typedef {Object} FeedElementCapabilities
 * @property {Object} [emailMessage]
 * @property {Object} [trackedChanges]
 * @property {TrackedChange[]} [trackedChanges.changes]
 */

/**
 * @typedef {Object} FeedElement
 * @property {string} type - Feed element type (TextPost, EmailMessageEvent, ChangeStatusPost, etc.)
 * @property {FeedElementActor} [actor]
 * @property {FeedElementBody} [body]
 * @property {FeedElementCapabilities} [capabilities]
 * @property {FeedElementParent} [parent]
 * @property {string} [relatedObjectId]
 * @property {string} [relatedObjectApiName]
 * @property {string} [createdDate]
 * @property {string} [relativeCreatedDate]
 * @property {string} [icon]
 * @property {Object} [header]
 * @property {string} [header.text]
 * @property {Object} [CreatedDate]
 * @property {string} [CreatedDate.value]
 */

/**
 * Feed item component for displaying feed elements in a timeline
 */
export default class FeedItem extends LightningElement {
    /** @type {FeedElement} */
    @api element;

    /** @type {boolean} */
    isExpanded = false;

    /** @type {string} */
    _previousRenderedHtml = '';

    // ==================== UI State ====================

    /**
     * Toggles the expanded state of the feed item
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    /**
     * Lifecycle hook to render rich text HTML when component updates
     */
    renderedCallback() {
        if (this.isRichTextBody && this.renderedBody) {
            const container = this.template.querySelector('.rich-text-body');
            if (container && container.innerHTML !== this.renderedBody) {
                container.innerHTML = this.renderedBody;
                this._previousRenderedHtml = this.renderedBody;
            }
        }
    }

    get timelineItemClass() {
        return `slds-timeline__item_expandable slds-timeline__item_email ${this.isExpanded ? 'slds-is-open' : ''}`;
    }

    get buttonIconName() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    /**
     * Returns the icon container class with proper SLDS styling
     * Maps icon names to SLDS icon container classes (e.g., utility:text -> slds-icon-utility-text)
     * @returns {string}
     */
    get iconContainerClass() {
        const iconName = this.defaultIconName;
        
        // Extract icon type and name (e.g., "utility:text" -> ["utility", "text"])
        const parts = iconName.split(':');
        if (parts.length === 2) {
            const [type, name] = parts;
            // Map to SLDS icon container classes
            // utility:text -> slds-icon-utility-text
            // standard:email -> slds-icon-standard-email
            return `slds-icon_container slds-icon-${type}-${name} slds-timeline__icon`;
        }
        
        // Fallback to generic container
        return 'slds-icon_container slds-timeline__icon';
    }

    // ==================== Element Type Detection ====================

    /**
     * @returns {boolean}
     */
    get isEmailElement() {
        return this.element?.type === 'EmailMessageEvent' || !!this.element?.capabilities?.emailMessage;
    }

    /**
     * @returns {boolean}
     */
    get isTextPost() {
        return this.element?.type === 'TextPost';
    }

    /**
     * @returns {boolean}
     */
    get hasTrackedChanges() {
        return !!this.element?.capabilities?.trackedChanges?.changes?.length;
    }

    // ==================== Content Extraction ====================

    /**
     * Extracts body text from the feed element
     * @returns {string}
     */
    get bodyText() {
        if (!this.element) return '';

        // For TextPost, get text from body.text
        if (this.isTextPost && this.element.body?.text) {
            return this.element.body.text;
        }

        // For other types, check if body is a string
        if (typeof this.element.body === 'string') {
            return this.element.body;
        }

        return '';
    }

    /**
     * Renders rich text body if available, otherwise returns plain text
     * @returns {string}
     */
    get renderedBody() {
        if (!this.element?.body) return '';

        const body = this.element.body;

        // Check if rich text is available
        if (body.isRichText && body.messageSegments && body.messageSegments.length > 0) {
            return renderRichText(body.messageSegments);
        }

        // Fallback to plain text
        return body.text || '';
    }

    /**
     * @returns {boolean}
     */
    get hasBodyText() {
        if (!this.element?.body) return false;

        const body = this.element.body;
        
        // Check for rich text
        if (body.isRichText && body.messageSegments && body.messageSegments.length > 0) {
            return true;
        }

        // Check for plain text
        return !!body.text;
    }

    /**
     * @returns {boolean}
     */
    get isRichTextBody() {
        return !!this.element?.body?.isRichText && 
               !!this.element?.body?.messageSegments?.length;
    }

    /**
     * Extracts header text from the feed element
     * @returns {string}
     */
    get header() {
        if (!this.element) return '';

        if (this.element.type === 'FeedElement') {
            return this.element.header?.text
                || this.element?.capabilities?.emailMessage?.subject
                || this.element.body?.text
                || this.element?.header
                || '';
        }

        // For engagement interactions
        return this.element?.Channel__c?.value || 'Engagement Interaction';
    }

    // ==================== Actor Information ====================

    /**
     * @returns {boolean}
     */
    get hasActor() {
        return !!this.element?.actor;
    }

    /**
     * @returns {boolean}
     */
    get hasActorId() {
        return !!this.element?.actorId;
    }

    /**
     * @returns {string}
     */
    get actorName() {
        return this.element?.actorName || '';
    }

    /**
     * @returns {string}
     */
    get actorUrl() {
        if (this.element?.actorId) {
            return `/lightning/r/User/${this.element.actorId}/view`;
        }
        return '';
    }

    /**
     * @returns {string}
     */
    get actorInitials() {
        const displayName = this.element?.actor?.displayName;
        if (!displayName) return '';

        const parts = displayName.trim().split(/\s+/);
        const first = parts[0]?.charAt(0) || '';
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase();
    }

    /**
     * @returns {string}
     */
    get actorIconName() {
        const actorType = this.element?.actor?.type;
        const iconMap = {
            'User': 'standard:user',
            'Account': 'standard:account',
            'Contact': 'standard:contact'
        };
        return iconMap[actorType] || 'utility:user';
    }

    /**
     * @returns {string|null}
     */
    get photoUrl() {
        return this.element?.actor?.photo?.smallPhotoUrl || this.element?.photoUrl || null;
    }

    // ==================== Related Object Information ====================

    /**
     * @returns {string|null}
     */
    get relatedObjectId() {
        return this.element?.relatedObjectId || this.element?.parent?.id || null;
    }

    /**
     * @returns {string|null}
     */
    get relatedObjectApiName() {
        return this.element?.relatedObjectApiName || this.element?.parent?.type || null;
    }

    /**
     * @returns {string}
     */
    get relatedObjectUrl() {
        const objectId = this.relatedObjectId;
        const apiName = this.relatedObjectApiName;

        if (objectId && apiName) {
            return `/lightning/r/${apiName}/${objectId}/view`;
        }

        return '';
    }

    // ==================== Tracked Changes ====================

    /**
     * @returns {TrackedChange[]}
     */
    get trackedChanges() {
        return this.element?.capabilities?.trackedChanges?.changes || [];
    }

    /**
     * Formats tracked changes for display
     * @returns {Array<{fieldName: string, oldValue: string, newValue: string}>}
     */
    get formattedTrackedChanges() {
        if (!this.hasTrackedChanges) return [];

        return this.trackedChanges.map(change => ({
            fieldName: change.fieldName || 'Field',
            oldValue: change.oldValue || '',
            newValue: change.newValue || ''
        }));
    }

    // ==================== Icons ====================

    /**
     * Returns the appropriate icon name based on element type
     * @returns {string}
     */
    get defaultIconName() {
        if (this.element?.icon) {
            return this.element.icon;
        }

       

        return 'standard:task';
    }

    // ==================== Date Handling ====================

    /**
     * Extracts the created date from various possible locations
     * @returns {string|null}
     */
    get createdDateValue() {
        if (!this.element) return null;

        // Check CreatedDate.value (for engagement interactions)
        if (this.element.CreatedDate?.value) {
            return this.element.CreatedDate.value;
        }

        // Check createdDate (ISO format from feed elements)
        if (this.element.createdDate) {
            return this.element.createdDate;
        }

        // Check relativeCreatedDate as fallback
        if (this.element.relativeCreatedDate) {
            return this.element.relativeCreatedDate;
        }

        // For feed elements, use the date we already standardized
        if (this.element.date) {
            return this.element.date;
        }

        return null;
    }

    /**
     * @returns {boolean}
     */
    get hasDate() {
        return !!this.createdDateValue;
    }
}
