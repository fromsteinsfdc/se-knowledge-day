public without sharing class KnowledgeDayController {


    // Org-specific hard codes
    public static Id memberProfileId = '00e5Y00000373GX'; // Hardcoded for now. Should default to '*Customer Community Plus' profile
    public static String kdName = 'testkd1';    
    
    // Defaults
    public static String defaultTimeZone = 'America/Los_Angeles';
    public static String defaultLocale = 'en_US';
    public static String defaultEmailEcoding = 'ISO-8859-1'; // no idea what this means
    public static String defaultLanguageLocale = 'en_US';
    
    @AuraEnabled
    public static String saveKnowledgeDayMembers(String kdId, String jsonString) {
        System.debug('in saveKnowledgeDayMembers');
        //Map<String, Object> m = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        List<KDMember> users = (List<KDMember>)JSON.deserialize(jsonString, List<KDMember>.class);
        Map<Id, Id> idMap = new Map<Id, Id>();
        List<Id> memberIdsToDelete = new List<Id>();
        delete [SELECT Id FROM Knowledge_Day_Voting_Group_Member__c WHERE Voting_Group__r.Knowledge_Day__c = :kdId];
        List<Knowledge_Day_Voting_Group_Member__c> newVGMs = new List<Knowledge_Day_Voting_Group_Member__c>();
        for (KDMember u : users) {
            if (u.groupId != null) {
                Knowledge_Day_Voting_Group_Member__c newVGM = new Knowledge_Day_Voting_Group_Member__c();
                newVGM.Knowledge_Day_Member__c = u.memberId;
                newVGM.Voting_Group__c = u.groupId;
                newVGMs.add(newVGM);
            }
        }
        insert newVGMs;
        return JSON.serialize(newVGMs);
    }

    @AuraEnabled(cacheable=true)
    public static List<User> getKnowledgeDayUsers() {
        return [SELECT Id, FirstName, LastName, FullPhotoUrl FROM User WHERE IsActive = true AND Knowledge_Day_User__c = true];
    }

    @AuraEnabled
    public static List<Knowledge_Day_Member__c> getKnowledgeDayMembers(String kdId) {
        System.debug('in getKDMembers, '+ kdId);
        if (!isIdThisObject(kdId, 'Knowledge_Day__c'))
            return null;
        System.debug(Knowledge_Day__c.getSObjectType().getDescribe().getKeyPrefix() +' - '+ Knowledge_Day__c.getSObjectType().getDescribe().getKeyPrefix().startsWith(kdId.left(3)));
        return [SELECT Id, Name, Show_and_Tell_Report__c, Show_and_Tell_Report__r.Topic__c, User__c, User__r.Name, User__r.Name_formula__c, User__r.Title, User__r.MediumPhotoUrl, User__r.FullPhotoUrl, User__r.KD_Photo_URL__c FROM Knowledge_Day_Member__c WHERE Knowledge_Day__c = :kdId];
        //return [SELECT Id, FirstName, LastName, FullPhotoUrl FROM User WHERE IsActive = true AND Knowledge_Day_User__c = true];
    }    

    @AuraEnabled(cacheable=true)
    public static List<Knowledge_Day_Voting_Group__c> getVotingGroups(String kdId) {
        return [SELECT Id, Name, IsActive__c, Colour_Hex_Code__c, (SELECT Is_Judge__c, Is_Presenter__c, Knowledge_Day_Member__c, Knowledge_Day_Member__r.User__c, Knowledge_Day_Member__r.User__r.Name, Knowledge_Day_Member__r.User__r.Name_formula__c, Knowledge_Day_Member__r.User__r.Title, Knowledge_Day_Member__r.User__r.MediumPhotoUrl, Knowledge_Day_Member__r.User__r.FullPhotoUrl FROM Knowledge_Day_Voting_Group_Member__r) FROM Knowledge_Day_Voting_Group__c WHERE Knowledge_Day__c = :kdId];
    }

    @AuraEnabled
    public static List<Knowledge_Day_Voting_Group_Member__c> getVotingGroupMembers(String groupId) {
        return [SELECT Is_Judge__c, Is_Presenter__c, Knowledge_Day_Member__r.Topic__c, Knowledge_Day_Member__r.Show_and_Tell_Report__r.Topic__c, Knowledge_Day_Member__c, Knowledge_Day_Member__r.User__c, Knowledge_Day_Member__r.User__r.Name, Knowledge_Day_Member__r.User__r.Name_formula__c, Knowledge_Day_Member__r.User__r.Title, Knowledge_Day_Member__r.User__r.MediumPhotoUrl, Knowledge_Day_Member__r.User__r.FullPhotoUrl FROM Knowledge_Day_Voting_Group_Member__c WHERE Voting_Group__c = :groupId ORDER BY Name ASC];
    }

    @AuraEnabled
    public static String addKnowledgeUserCSV(String usersString){
        String returnMessage = 'Test return message';
        System.debug('usersString = '+ usersString);
        
        Account kdAccount = new Account(Name = 'MFG FY22 Q1 Knowledge Day');
        insert kdAccount;

        List<KnowledgeDayUser> users = (List<KnowledgeDayUser>)JSON.deserialize(usersString, List<KnowledgeDayUser>.class);
        List<Contact> newContacts = new List<Contact>();
        List<User> newUsers = new List<User>();
        for (KnowledgeDayUser u : users) {
            if (u.LastName == null)
                continue;
            Contact newContact = new Contact(Knowledge_Day_Contact__c = true, FirstName = u.FirstName, LastName = u.LastName, Email = u.Email + 'z', AccountId = kdAccount.Id, KD_Photo_URL__c = u.FullPhotoUrl);
            newContacts.add(newContact);
            System.debug('user: '+ u);
            System.debug('-newContact: '+ newContact);
        }
        if(false) 
            return null;
        insert newContacts;
        System.debug('Successfully inserted '+ newContacts.size() +' new contacts');

        integer index = 0;
        for (Contact c : newContacts) {
            //KnowledgeDayUser kdUser = users[index];
            //String now = '' + DateTime.getTime();
            String timestamp = String.valueOf(DateTime.now().getTime()).right(10);
            //String username = c.FirstName +'.'+ c.LastName + timestamp +'@'+ kdName + '.demo';
            String userName = c.Email.substring(0, c.Email.indexOf('@')) + '@mfgkd11.demo';
            String alias = c.FirstName.left(1) + c.LastName.left(4);
            System.debug('username = '+ username);
            User newUser = new User(Knowledge_Day_User__c = true, ProfileId = memberProfileId, FirstName = c.FirstName, LastName = c.LastName, ContactId = c.Id, Username = username, 
                Email = username, Alias = alias, TimeZoneSidKey = defaultTimeZone, LocaleSidKey = defaultLocale, EmailEncodingKey = defaultEmailEcoding, LanguageLocaleKey = defaultLanguageLocale, KD_Photo_URL__c = c.KD_Photo_URL__c);
            System.debug('newUser = '+ newUser);
            index++;
            newUsers.add(newUser);            
        }
        insert newUsers;
        return String.valueOf(users);
    }

    public static boolean isIdThisObject(String id, String objectName) {
        return Schema.getGlobalDescribe().get(objectName).getDescribe().getKeyPrefix().startsWith(id.left(3));
    }

    /*
    @AuraEnabled
    public static List<KnowledgeDayUser> getKnowledgeDayUsers() {
        List<KnowledgeDayUser> users = new List<KnowledgeDayUser>();
        return users;
    }
    */

    public static void deleteAndDisable() {
        List<User> users = [SELECT Id FROM User WHERE Knowledge_Day_User__c = true AND ProfileId = :memberProfileId And IsActive = true];
        for (User u: users) {
            u.IsActive = false;
            u.IsPortalEnabled = false;
        }
        update users;
        //delete [SELECT Id FROM Contact WHERE Knowledge_Day_Contact__c = true];
    }

    public class KDMember {
        @AuraEnabled public String userId;
        @AuraEnabled public String kdId;
        @AuraEnabled public String groupId;
        @AuraEnabled public String memberId;

    }

    public class KnowledgeDayUser {
        @AuraEnabled public String FirstName;
        @AuraEnabled public String LastName;
        @AuraEnabled public String Email;
        @AuraEnabled public String Username;
        @AuraEnabled public String EmailEncoding;
        @AuraEnabled public String LanguageLocaleKey;
        @AuraEnabled public String LocaleSidKey;
        @AuraEnabled public String TimeZoneSidKey;
        @AuraEnabled public String ProfileId;
        @AuraEnabled public String Alias;
        @AuraEnabled public String ContactId;
        @AuraEnabled public String MediumPhotoUrl;
        @AuraEnabled public String FullPhotoUrl;
        @AuraEnabled public String AccountId;
        @AuraEnabled public String Id;
        public integer index = 0;

        // taken from https://salesforce.stackexchange.com/questions/166947/creating-a-community-user-via-apex-from-a-contact/166958
        // u.CommunityNickname = 'nickname';


    }
}
