import { api, LightningElement } from 'lwc';

/**
 * @typedef {Object} EmailAddress
 * @property {string} displayName
 * @property {string} emailAddress
 */

/**
 * @typedef {Object} EmailMessageCapabilities
 * @property {string} subject
 * @property {EmailAddress} fromAddress
 * @property {EmailAddress[]} toAddresses
 * @property {string} body
 */

/**
 * @typedef {Object} FeedElementActor
 * @property {string} displayName
 */

/**
 * @typedef {Object} FeedElementCapabilities
 * @property {EmailMessageCapabilities} emailMessage
 */

/**
 * @typedef {Object} FeedEmailData
 * @property {FeedElementActor} [actor]
 * @property {FeedElementCapabilities} [capabilities]
 * @property {string} [relativeCreatedDate]
 */

/**
 * Feed email component for displaying email feed elements
 */
export default class FeedEmail extends LightningElement {
    /** @type {FeedEmailData} */
    @api emailData;

    /** @type {boolean} */
    isExpanded = false;

    // ==================== UI State ====================

    /**
     * Toggles the expanded state of the email
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    get buttonIconName() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get iconClass() {
        return this.isExpanded
            ? 'slds-button__icon slds-timeline__details-action-icon'
            : 'slds-button__icon';
    }

    get timelineItemClass() {
        return `slds-timeline__item_expandable slds-timeline__item_email ${this.isExpanded ? 'slds-is-open' : ''}`;
    }

    // ==================== Email Content ====================

    /**
     * @returns {string}
     */
    get actorName() {
        return this.emailData?.actor?.displayName || '';
    }

    /**
     * @returns {string}
     */
    get subject() {
        return this.emailData?.capabilities?.emailMessage?.subject || '';
    }

    /**
     * @returns {string}
     */
    get relativeDate() {
        return this.emailData?.relativeCreatedDate || '';
    }

    /**
     * Formats the from address for display
     * @returns {string}
     */
    get fromAddress() {
        const from = this.emailData?.capabilities?.emailMessage?.fromAddress;
        if (!from) return '';

        const displayName = from.displayName || '';
        const emailAddress = from.emailAddress || '';
        
        return displayName && emailAddress
            ? `${displayName} <${emailAddress}>`
            : emailAddress || displayName;
    }

    /**
     * @returns {EmailAddress[]}
     */
    get toAddresses() {
        return this.emailData?.capabilities?.emailMessage?.toAddresses || [];
    }

    /**
     * Formats the list of recipients for display
     * @returns {string}
     */
    get formattedToAddresses() {
        const addresses = this.toAddresses;
        if (!addresses || addresses.length === 0) {
            return '';
        }

        // Extract display names and join them with commas
        const names = addresses
            .map(addr => addr.displayName || addr.emailAddress || '')
            .filter(name => name.length > 0);

        if (names.length === 0) {
            return '';
        }

        // Join with commas, and add "and" before the last one if multiple
        if (names.length === 1) {
            return names[0];
        } else if (names.length === 2) {
            return `${names[0]} and ${names[1]}`;
        } else {
            const last = names.pop();
            return `${names.join(', ')}, and ${last}`;
        }
    }

    /**
     * @returns {boolean}
     */
    get hasToAddresses() {
        return this.toAddresses && this.toAddresses.length > 0;
    }

    /**
     * Formats email body text, converting newlines to HTML breaks
     * @returns {string}
     */
    get emailBody() {
        const body = this.emailData?.capabilities?.emailMessage?.body || '';
        return body.replace(/\n/g, '<br>');
    }
}
