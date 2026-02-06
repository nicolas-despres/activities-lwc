import { LightningElement, api, track, wire } from 'lwc';
import getRecordFeed from '@salesforce/apex/CustomActivityFeedController.getRecordFeed';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi'

export default class CustomActivityPanel extends LightningElement {
    @api recordId;
    @track feed; // parsed JSON
    @track error;
    @track isLoading = false;

    pageSize = 20;
    nextPageToken;
    currentPageToken;

    get variables() {
        return {
           recordId: this.recordId,
        }
    }

    connectedCallback() {
        if (this.recordId) {
            this.loadFeed();
        }
    }

    @wire(graphql, {
        query: gql`query ($recordId: ID!="%") {
    uiapi {
        query {
            EngagementInteraction (where: {Case__c: {eq: $recordId}}) {
                edges {
                    node {
                        Channel__c {
                            value
                        }
                        CreatedDate {
                            value
                        }
                    }
                }
            }
        }
    }
}`,
        variables: "$variables",
    })
    graphqlQueryResult(result) {
        const { data, errors } = result;
        
        if (data) {
            this.result = { 
                    data
            }
        }
        if (errors) {
            this.errors = errors
            console.error(errors)
            this.result = undefined
        }
        this.errors = errors;
        // Store the result so refreshGraphQL() can refresh it later
        this.graphqlData = result;
    }

    async handleRefresh() {
        return refreshGraphQL(this.graphqlData);
    }

    async loadFeed(token) {
        this.isLoading = true;
        this.error = undefined;
        try {
            const json = await getRecordFeed({ recordId: this.recordId, pageSize: this.pageSize, pageToken: token });
            const parsed = this.safeParse(json);
            console.log('Parsed JSON:', JSON.stringify(parsed))
            if (parsed && !parsed.error) {
                this.feed = parsed;
                this.currentPageToken = parsed.currentPageToken || null;
                this.nextPageToken = parsed.nextPageToken || null;
            } else {
                this.error = (parsed && parsed.message) || 'Unknown error';
            }
        } catch (e) {
            this.error = e?.body?.message || e?.message || 'Failed to load activity feed';
        } finally {
            this.isLoading = false;
        }
    }

    safeParse(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return { error: true, message: 'Invalid JSON returned from server' };
        }
    }

    handleNext() {
        if (this.nextPageToken) {
            this.loadFeed(this.nextPageToken);
        }
    }

    // Rendering helpers
    get hasElements() {
        return this.feed && Array.isArray(this.feed.elements) && this.feed.elements.length > 0;
    }

    get cardTitle() {
        return 'Activity';
    }

    get showNext() {
        return !!this.nextPageToken;
    }


    get engagementInteractions(){
        const values = Object.values(this.result?.data?.uiapi.query || {})
        return values.length>0 ? values[0].edges : []
    }

    get nbInteractions(){
        return this.engagementInteractions.length
    }
}