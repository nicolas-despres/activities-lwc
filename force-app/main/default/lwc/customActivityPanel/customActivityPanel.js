import { LightningElement, api, track, wire } from 'lwc';
import getRecordFeed from '@salesforce/apex/CustomActivityFeedController.getRecordFeed';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi'

const ENGAGEMENT_INTERACTIONS_QUERY = gql`
  query EngagementInteractions($recordId: ID!) {
    uiapi {
      query {
        EngagementInteraction(
          where: { Case__c: { eq: $recordId } }
        ) {
          edges {
            node {
              Id
              Channel__c { value }
              CreatedDate { value }
              CreatedBy {
                Id
                Name { value }
              }
              InitiatingAttendee {
                __typename
                ... on Account {
                  Id
                  Name { value }
                }
                ... on Contact {
                  Id
                  Name { value }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * @typedef {Object} ActivityItem
 * @property {string} id - Unique identifier for the activity
 * @property {string} type - Type of activity ('FeedElement' or 'EngagementInteraction')
 * @property {string} date - Date string for sorting
 * @property {Object} capabilities - Email capabilities (for FeedElements)
 * @property {string} actorId - ActorId
 * @property {Object} actor - Actor information (for FeedElements)
 * @property {Object} Channel__c - Channel information (for EngagementInteractions)
 * @property {Object} CreatedDate - Creation date (for EngagementInteractions)
 */

export default class CustomActivityPanel extends LightningElement {
    @api recordId;
    @track feed; // parsed JSON
    @track error;
    @track isLoading = false;
    @track combinedActivities = [];

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
        query: ENGAGEMENT_INTERACTIONS_QUERY,
        variables: "$variables",
    })
    graphqlQueryResult(result) {
        const { data, errors } = result;

        if (data) {
            this.result = {
                data
            }
            // Combine the data once we have both sources
            this.combineActivities();
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
                // Combine the data once we have both sources
                this.combineActivities();
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

    /**
     * Combine engagement interactions and feed elements into a single sorted array
     * @returns {void}
     */
    combineActivities() {
        let allActivities = [];

        // Process feed elements if available
        if (this.feed && Array.isArray(this.feed.elements)) {
            allActivities = allActivities.concat(this.feed.elements.map(element => {
                // Standardize the date format to match Chatter's format
                const date = element.createdDate || element.relativeCreatedDate;
                // Add icon information based on element type
                const iconInfo = this.getActivityIconInfo(element.type);
                return {
                    ...element,
                    type: 'FeedElement',
                    date: date,
                    ...iconInfo
                };
            }));
        }

        // Process engagement interactions if available
        const engagementInteractions = this.engagementInteractions;
        if (engagementInteractions && Array.isArray(engagementInteractions)) {
            allActivities = allActivities.concat(engagementInteractions.map(interaction => {
                const date = interaction.node.CreatedDate?.value;
                // Add icon information based on element type
                const iconInfo = this.getActivityIconInfo('EngagementInteraction');
                const actorName = interaction.node.InitiatingAttendee?.Name?.value
                return {
                    ...interaction.node,
                    type: 'EngagementInteraction',
                    date: date,
                    relatedObjectId: interaction.node.Id,
                    relatedObjectApiName: 'EngagementInteraction',
                    body: 'Vous avez appelé ' + actorName,
                    actorId: interaction.node.InitiatingAttendee?.Id,
                    actorName: interaction.node.InitiatingAttendee?.Name?.value,
                    ...iconInfo

                };
            }));
        }

        // Sort by date descending (most recent first)
        allActivities.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // Descending order
        });

        this.combinedActivities = allActivities;
    }

    /**
     * Get icon information based on activity type
     * @param {string} activityType - Type of activity
     * @returns {Object} Icon information object
     */
    getActivityIconInfo(activityType) {
        switch (activityType) {
            case 'TextPost':
                return { icon: 'utility:text' };
            case 'EmailMessageEvent':
                return { icon: 'utility:email' };
            case 'ContentPost':
                return { icon: 'utility:document' };
            case 'LinkPost':
                return { icon: 'utility:link' };
            case 'EngagementInteraction':
                return { icon: 'standard:log_a_call' };
            default:
                return { icon: 'utility:feed' };
        }
    }

    // Rendering helpers
    get hasElements() {
        return this.combinedActivities && this.combinedActivities.length > 0;
    }

    get cardTitle() {
        return 'Activity';
    }

    get showNext() {
        return !!this.nextPageToken;
    }

    get engagementInteractions() {
        const values = Object.values(this.result?.data?.uiapi.query || {})
        return values.length > 0 ? values[0].edges : []
    }

    get nbInteractions() {
        return this.engagementInteractions.length
    }
}
