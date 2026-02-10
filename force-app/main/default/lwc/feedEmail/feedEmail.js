import { api, LightningElement } from 'lwc';


export default class FeedEmail extends LightningElement {
    @api emailData; // Pass the JSON object here
    isExpanded = false;

     get buttonIconName() {
        return this.isExpanded ? 'utility:chevronup' : 'utility:chevrondown';
    }

    get actorName() {
        return this.emailData?.actor?.displayName;
    }

    get subject() {
        return this.emailData?.capabilities?.emailMessage?.subject;
    }

    get relativeDate() {
        return this.emailData?.relativeCreatedDate;
    }

    get fromAddress() {
        const from = this.emailData?.capabilities?.emailMessage?.fromAddress;
        return `${from.displayName} <${from.emailAddress}>`;
    }

    get toAddresses() {
        return this.emailData?.capabilities?.emailMessage?.toAddresses || [];
    }

    get emailBody() {
        // Simple formatting for the body text provided in your JSON
        let body = this.emailData?.capabilities?.emailMessage?.body || '';
        return body.replace(/\n/g, '<br>');
    }

    get iconClass() {
        return this.isExpanded ? 'slds-button__icon slds-timeline__details-action-icon' : 'slds-button__icon';
    }

    get timelineItemClass() {
        return `slds-timeline__item_expandable slds-timeline__item_email ${this.isExpanded ? 'slds-is-open' : ''}`;
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }
}
