/**
 * @description Aura-enabled controller exposing record feed for a given recordId.
 * Returns a JSON string that can be consumed by LWC component.
 * Security: with sharing. No hardcoded IDs/URLs. No DML/SOQL in loops.
 *
 * Usage from LWC: imperative Apex call with recordId (required), pageSize (optional), pageToken (optional).
 */
public with sharing class CustomActivityFeedController {
    
    @AuraEnabled(cacheable=true)
    public static String getRecordFeed(String recordId, Integer pageSize, String pageToken) {
        // Return-early validations
        if (String.isBlank(recordId)) {
            return '{"error":"Missing recordId"}';
        }
        Integer effectivePageSize = (pageSize == null || pageSize <= 0) ? 20 : pageSize;

        try {
            // Create a mock response structure to demonstrate the concept
            // In a real implementation, we would use ConnectApi or other methods
            Map<String, Object> root = new Map<String, Object>();

            
            // Mock data structure - in a real implementation this would come from actual API calls
            root.put('currentPageToken', null);
            root.put('currentPageUrl', null);
            root.put('nextPageToken', null);
            root.put('nextPageUrl', null);
            root.put('updatesToken', null);
            root.put('updatesUrl', null);
            root.put('isModifiedToken', null);
            root.put('isModifiedUrl', null);
            
            List<Object> elements = new List<Object>();
            ConnectApi.FeedElementPage feedPage = ConnectApi.ChatterFeeds.getFeedElementsFromFeed(
        null,                                   // Community Id (null = internal org)
        ConnectApi.FeedType.Record,             // Record feed
        recordId                                  // Record Id (Case Id)
    );
    for (ConnectApi.FeedElement element : feedPage.elements) {
    System.debug('Feed Item Id: ' + element.id);
    System.debug('Type: ' + element.feedElementType);
    System.debug('Created Date: ' + element.createdDate);
}
            root.put('elements', feedPage.elements);

            return JSON.serialize(root);
        } catch (Exception e) {
            // Surface a structured error payload instead of throwing to the client
            Map<String, Object> err = new Map<String, Object>{
                'error' => true,
                'message' => e.getMessage()
            };
            return JSON.serialize(err);
        }
    }
}