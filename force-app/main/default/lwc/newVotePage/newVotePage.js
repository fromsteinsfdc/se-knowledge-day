import { LightningElement, api, track } from 'lwc';
import Id from '@salesforce/user/Id';
import getVotingGroupMembers from '@salesforce/apex/KnowledgeDayController.getVotingGroupMembers';
import getVotingGroups from '@salesforce/apex/KnowledgeDayController.getVotingGroups';
import handleVote from '@salesforce/apex/KnowledgeDayController.handleVote';
import ivoted from '@salesforce/resourceUrl/ivotedgif';

export default class NewVotePage extends LightningElement {
    @api groupId;
    @track members = [];
    //        return [SELECT Is_Judge__c, Is_Presenter__c, Knowledge_Day_Member__r.Topic__c, Knowledge_Day_Member__c, Knowledge_Day_Member__r.User__c, Knowledge_Day_Member__r.User__r.Name, Knowledge_Day_Member__r.User__r.Name_formula__c, Knowledge_Day_Member__r.User__r.Title, Knowledge_Day_Member__r.User__r.MediumPhotoUrl, Knowledge_Day_Member__r.User__r.FullPhotoUrl FROM Knowledge_Day_Voting_Group_Member__c WHERE Voting_Group__c = :groupId ORDER BY Name ASC];

    showGroup = true;
    groupColour;

    currentMember = {};
    selectedId;

    ivoted = ivoted;

    connectedCallback() {
        this.showGroup = true;
        getVotingGroups({kdId: 'aB55Y0000019U6qSAE'}).then(result => {
            for (let group of result) {
                for (let groupMember of group.Knowledge_Day_Voting_Group_Member__r) {
                    if (groupMember.Knowledge_Day_Member__r.User__r.Id == Id) {
                        this.groupId = group.Id;
                        this.groupColour = group.Colour_Hex_Code__c
                    }
                }
            }
            if (!this.groupId) {
                console.log('groupId not found');
                return;
            }
            console.log('groupId = ' + this.groupId);
            getVotingGroupMembers({ groupId: this.groupId }).then(result => {
                console.log('getVotingGroupMembers result = '+ JSON.stringify(result));
                this.currentMember = result.find(member => member.Knowledge_Day_Member__r.User__r.Id == Id);
                console.log('currentMember = '+ JSON.stringify(this.currentMember));
                for (let member of result) {
                    if (member.Is_Presenter__c && member.Knowledge_Day_Member__r.User__r.Id != Id && member.Knowledge_Day_Member__r.Show_and_Tell_Report__c)
                        this.members.push({
                            // userId: member.Knowledge_Day_Member__r.User__r.Id,
                            // //name: member.User__r.Name,
                            // name: member.Knowledge_Day_Member__r.User__r.Name_formula__c,
                            label: member.Knowledge_Day_Member__r.User__r.Name_formula__c +': '+ member.Knowledge_Day_Member__r.Show_and_Tell_Report__r.Topic__c,
                            value: member.Id,
                            //photoUrl: member.User__r.FullPhotoUrl,
                            // photoUrl: member.Knowledge_Day_Member__r.User__r.KD_Photo_URL__c || member.Knowledge_Day_Member__r.User__r.FullPhotoUrl,
                            // memberId: member.Id,
                            // reportId: member.Knowledge_Day_Member__r.Show_and_Tell_Report__c,
                            // topic: member.Knowledge_Day_Member__r.Show_and_Tell_Report__r.Topic__c,
                            // get colourStyle() {
                            //     console.log('background-color: ' + this.groupColour);
                            //     return 'background-color: ' + this.groupColour;
                            // }
                        });
                }
                console.log(JSON.stringify(this.members));
            }).catch(error => {
                console.log('Error: ' + JSON.stringify(error));
            })
        })
    }

    handleChange(event) {
        this.selectedId = event.detail.value;
    }

    handleVote() {
        if (!this.selectedId) return;
        handleVote({votingMemberId: this.currentMember.Id, votingForId: this.selectedId}).then(result => {
            console.log('success');
            location.reload();
        }).catch(error => {
            console.log('error = '+ JSON.stringify(error));
        })
    }
}