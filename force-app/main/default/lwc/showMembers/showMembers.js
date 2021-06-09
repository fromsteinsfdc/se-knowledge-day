import { LightningElement, api } from 'lwc';
import Id from '@salesforce/user/Id';
import { NavigationMixin } from 'lightning/navigation';

import getKnowledgeDayUsers from '@salesforce/apex/KnowledgeDayController.getKnowledgeDayUsers';
import getVotingGroups from '@salesforce/apex/KnowledgeDayController.getVotingGroups';
import getVotingGroupMembers from '@salesforce/apex/KnowledgeDayController.getVotingGroupMembers';

export default class ShowMembers extends NavigationMixin(LightningElement) {
    @api recordId;
    @api members = [];
    @api showGroupMembership;
    @api showAllMembers;
    @api adminMode;
    //noGroupLabel = 'The Decider';
    noGroupLabel;

    get showGroup() {
        return this.showGroupMembership === 'true';
    }
    get showAll() {
        return this.showAllMembers === 'true';
    }

    presenterImageWidth = 200;
    presenterImageHeight = 200;

    connectedCallback() {
        console.log('showGroupMembership = '+ this.showGroupMembership);
        console.log('showAllMembers = '+ this.showAllMembers);
        for (let member of this.members) {
            console.log(JSON.stringify(member));
        }
    }

    get presenters() {
        console.log('in get presenters, '+ this.showAllMembers);
        if (this.showAllMembers === 'true')
            return this.members;
        return this.members.filter(el => { return el.isPresenter });        
    }

    get nonPresenters() {
        if (this.showAllMembers === 'true')
            return this.members;
        return this.members.filter(el => { return !el.isPresenter });        
    }

    get judges() {
        if (this.showAllMembers === 'true')
            return this.members;
        return this.members.filter(el => { return el.isJudge });        
    }

    get showReportButton() {
        if (this.showAllMembers === 'true')
            return false;
        //return true;
        for (let member of this.members) {
            console.log('showreport = '+ member.userId, Id, member.userId === Id);
            if (member.userId === Id)
                return true;
        }
        return false;
    }

    handleDragStart(event) {
        //event.preventDefault();
        if (!this.adminMode)
            return;

        let userId = event.currentTarget.dataset.userId;
        console.log('dragging ' + userId);
        event.dataTransfer.setData('text', userId);
    }

    handleOpenReport(event) {
        /*
        const defaultValues = encodeDefaultFieldValues({
            Presenter__c: event.currentTarget.dataset.userId,
        });
        console.log(JSON.stringify(defaultValues));
        */
       console.log('in open report');
       console.log(event.currentTarget.dataset.reportId);

        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.currentTarget.dataset.reportId,
                actionName: 'edit'
            }
        });

    }
}