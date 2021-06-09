import { LightningElement, api, wire, track } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import { getListUi } from 'lightning/uiListApi';

import getKnowledgeDayUsers from '@salesforce/apex/KnowledgeDayController.getKnowledgeDayUsers';
import getVotingGroups from '@salesforce/apex/KnowledgeDayController.getVotingGroups';
import getVotingGroupMembers from '@salesforce/apex/KnowledgeDayController.getVotingGroupMembers';
import getKnowledgeDayMembers from '@salesforce/apex/KnowledgeDayController.getKnowledgeDayMembers';

import papaparse from '@salesforce/resourceUrl/papaparse';

const KNOWLEDGE_DAY_OBJECT = 'Knowledge_Day__c';
const VOTING_GROUP_OBJECT = 'Knowledge_Day_Voting_Group__c';

export default class VotingGroup extends LightningElement {

    @api recordId;
    @api objectApiName;
    @api groupId;
    isLoading;

    @track allKDUsers = [];
    @track members = [];

    @wire(getKnowledgeDayUsers)
    handleGetKnowledgeDayUsers({ error, data }) {
        if (data) {
            //console.log('handleGetKnowledgeDayUsers data = '+ JSON.stringify(data));
            this.allKDUsers = data;
        }
        if (error) {
            console.log('handleGetKnowledgeDayUsers error = ' + JSON.stringify(error));
        }
    }

    //@wire(getKnowledgeDayMembers, {kdId: '$recordId'})
    //members;

    //@wire(getVotingGroupMembers, {groupId: '$groupId'})
    //groupMembers;
    /*
    handleVotingGroupMembers({error, data}) {
        if (data) {
            console.log('data: '+ JSON.stringify(data));
        }
        if (error) {
            console.log('error: '+ JSON.stringify(error));
        }
    }
    */

    connectedCallback() {
        this.isLoading = true;
        loadScript(this, papaparse);
        console.log('objectApiName = ' + this.objectApiName, KNOWLEDGE_DAY_OBJECT, VOTING_GROUP_OBJECT);
        console.log(this.objectApiName === KNOWLEDGE_DAY_OBJECT);
        if (this.objectApiName === KNOWLEDGE_DAY_OBJECT) {
            console.log('is knowledge day');
            getKnowledgeDayMembers({ kdId: this.recordId }).then(result => {
                console.log('kd members: ' + JSON.stringify(result));
                for (let member of result) {
                    this.members.push({
                        name: member.User__r.Name,
                        photoUrl: member.User__r.FullPhotoUrl
                    });
                }
                //this.members = result;
                this.isLoading = false;
            }).catch(error => {
                console.log('kd members error: ' + JSON.stringify(error));
            })
        } else if (this.objectApiName === VOTING_GROUP_OBJECT) {
            console.log('is voting group');
            getVotingGroupMembers({ groupId: this.recordId }).then(result => {
                console.log('voting group members: ' + JSON.stringify(result));
                for (let member of result) {

                    this.members.push({
                        name: member.Knowledge_Day_Member__r.User__r.Name,
                        photoUrl: member.Knowledge_Day_Member__r.User__r.FullPhotoUrl,
                        isJudge: member.Is_Judge__c,
                        isPresenter: member.Is_Presenter__c
                    });
                    this.isLoading = false;
                }
            }).catch(error => {
                console.log('voting group members error: ' + JSON.stringify(error));
            })
        }
    }

    /*
    @wire(getKnowledgetVotingGroupsgeDayUsers)
    handleGetVotingGroups({error, data}) {
        if (data) {
            console.log('handleGetVotingGroups data = '+ JSON.stringify(data));
        }
        if (error) {
            console.log('handleGetVotingGroups error = '+ JSON.stringify(error));
        }
    }
    */
}