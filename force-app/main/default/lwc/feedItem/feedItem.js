import { LightningElement, api } from 'lwc';

export default class FeedItem extends LightningElement {
    @api element;
    isExpanded = false;

    get timelineItemClass() {
        return `slds-timeline__item_expandable slds-timeline__item_email ${this.isExpanded ? 'slds-is-open' : ''}`;
    }

    get hasActor() {
        return !!this.element?.actor;
    }

    get buttonIconName() {
        return this.isExpanded ? 'utility:chevronup' : 'utility:chevrondown';
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }


    get hasActorId() {
        // Check if actorId is populated (for linking)
        return !!this.element?.actorId;
    }

    get iconClass() {
        return `slds-icon_container slds-icon-${this.defaultIconName} slds-timeline__icon`;
    }

    get bodyText() {
        // Handle different body text locations based on type
       
        // For engagement interactions, we might not have a body, so return empty
        return typeof this.element?.body === 'string' ? this.element.body : '';
    }

    get actorName() {

        return this.element?.actorName;
    }

    get actorUrl() {
        // Generate URL for the actor object if actorId exists
        if (this.element?.actorId) {
            // For User objects, use the standard Salesforce URL format
            return `/lightning/r/User/${this.element.actorId}/view`;
        }
        return '';
    }

    get relatedObjectUrl() {
        // Generate URL for the actor object if actorId exists
        if (this.element?.relatedObjectId) {
            // For User objects, use the standard Salesforce URL format
            return `/lightning/r/${this.element.relatedObjectApiName}/${this.element.relatedObjectId}/view`;
        }
        return '';
    }


    get isEmailElement() {
        // Check if this is a feed element with email capabilities
        if (this.element?.type === 'EmailMessageEvent' || this.element?.capabilities?.emailMessage) {
            return true;
        }
        // For engagement interactions, we don't show email details
        return false;
    }

    get header() {
        // Handle different data structures
        if (this.element?.type === 'FeedElement') {
            if (this.element.header?.text) {
                return this.element.header.text;
            }
            return this.element?.capabilities?.emailMessage?.subject
                || this.element.body?.text  // type TextPost
                || this.element?.header || '';
        } else {
            // For engagement interactions, use a different approach
            return this.element?.Channel__c?.value || 'Engagement Interaction';
        }
    }

    get actorInitials() {
        if (!this.element?.actor?.displayName) return '';
        const parts = this.element?.actor?.displayName.trim().split(/\s+/);
        const first = parts[0]?.charAt(0) || '';
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase();
    }

    get actorIconName() {
        // Return appropriate icon based on actor type
        if (this.element?.actor?.type === 'User') {
            return 'standard:user';
        } else if (this.element?.actor?.type === 'Account') {
            return 'standard:account';
        } else if (this.element?.actor?.type === 'Contact') {
            return 'standard:contact';
        } else {
            return 'utility:user';
        }
    }


    get defaultIconName() {
        // Return appropriate icon based on element type
        if (this.element?.icon) {
            return this.element.icon
        }
        if (this.element?.type === 'TextPost') {
            return 'utility:text';
        } else if (this.element?.type === 'EmailMessageEvent') {
            return 'utility:email';
        } else if (this.element?.type === 'ContentPost') {
            return 'utility:document';
        } else if (this.element?.type === 'LinkPost') {
            return 'utility:link';
        } else {
            return 'utility:feed';
        }
    }

    get photoUrl() {
        const small = this.element?.actor?.photo?.smallPhotoUrl;
        return small || this.element?.photoUrl || null;
    }

    

    get toggleIcon() {
        return this._isEmailExpanded ? 'utility:chevronup' : 'utility:chevrondown';
    }

    // Get created date for engagement interactions
    get createdDateValue() {
        if (this.element?.CreatedDate?.value) {
            return this.element.CreatedDate.value;
        }
        // For feed elements, use the date we already standardized
        if (this.element?.date) {
            return this.element.date;
        }
        return '';
    }

}
