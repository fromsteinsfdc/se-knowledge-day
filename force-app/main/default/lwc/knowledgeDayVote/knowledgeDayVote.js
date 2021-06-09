import { LightningElement, api, track } from 'lwc';
import Id from '@salesforce/user/Id';
import getVotingGroupMembers from '@salesforce/apex/KnowledgeDayController.getVotingGroupMembers';
import getVotingGroups from '@salesforce/apex/KnowledgeDayController.getVotingGroups';
//return [SELECT Id, Name, Colour_Hex_Code__c, (SELECT Is_Judge__c, Is_Presenter__c, Knowledge_Day_Member__c, Knowledge_Day_Member__r.User__c, Knowledge_Day_Member__r.User__r.Name, Knowledge_Day_Member__r.User__r.Name_formula__c, Knowledge_Day_Member__r.User__r.Title, Knowledge_Day_Member__r.User__r.MediumPhotoUrl, Knowledge_Day_Member__r.User__r.FullPhotoUrl FROM Knowledge_Day_Voting_Group_Member__r) FROM Knowledge_Day_Voting_Group__c WHERE Knowledge_Day__c = :kdId];

export default class KnowledgeDayVote extends LightningElement {
    @api groupId;
    @track members = [];
    //        return [SELECT Is_Judge__c, Is_Presenter__c, Knowledge_Day_Member__r.Topic__c, Knowledge_Day_Member__c, Knowledge_Day_Member__r.User__c, Knowledge_Day_Member__r.User__r.Name, Knowledge_Day_Member__r.User__r.Name_formula__c, Knowledge_Day_Member__r.User__r.Title, Knowledge_Day_Member__r.User__r.MediumPhotoUrl, Knowledge_Day_Member__r.User__r.FullPhotoUrl FROM Knowledge_Day_Voting_Group_Member__c WHERE Voting_Group__c = :groupId ORDER BY Name ASC];

    connectedCallback() {
        getVotingGroups().then(result => {
            for (let group of result) {
                for (groupMember of group.Knowledge_Day_Voting_Group_Member__r) {
                    if (groupMember.Knowledge_Day_Member__r.User__r.Id == Id) {
                        this.groupId = group.Id;
                    }
                }
            }
            if (!this.groupId) {
                console.log('groupId not found');
                return;
            }
            console.log('groupId = ' + groupId);
            getVotingGroupMembers({ groupId: this.groupId }).then(result => {
                for (let member of result) {
                    if (member.isPresenter && member.member.Knowledge_Day_Member__r.User__r.Id != Id)
                        this.members.push({
                            userId: member.Knowledge_Day_Member__r.User__r.Id,
                            //name: member.User__r.Name,
                            name: member.Knowledge_Day_Member__r.User__r.Name_formula__c,
                            //photoUrl: member.User__r.FullPhotoUrl,
                            photoUrl: member.Knowledge_Day_Member__r.User__r.KD_Photo_URL__c || member.Knowledge_Day_Member__r.User__r.FullPhotoUrl,
                            memberId: member.Id,
                            reportId: member.Knowledge_Day_Member__r.Show_and_Tell_Report__c,
                            topic: member.Knowledge_Day_Member__r.Show_and_Tell_Report__r.Topic__c,
                            get colourStyle() {
                                console.log('background-color: ' + this.groupColour);
                                return 'background-color: ' + this.groupColour;
                            }
                        });
                }

            }).catch(error => {
                console.log('Error: ' + JSON.stringify(error));
            })
        })
    }
}