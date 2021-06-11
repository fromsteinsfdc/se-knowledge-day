import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getKnowledgeDayMembers from '@salesforce/apex/KnowledgeDayController.getKnowledgeDayMembers';
import getVotingGroups from '@salesforce/apex/KnowledgeDayController.getVotingGroups';
import saveKnowledgeDayMembers from '@salesforce/apex/KnowledgeDayController.saveKnowledgeDayMembers';

const TAB_CLASS = 'slds-vertical-tabs__nav-item';
const ACTIVE_TAB_CLASS = 'slds-is-active';
const NO_GROUP_LABEL = '[ungrouped]';
const BG_COLOUR = 'background-color: ';
const DEFAULT_BG_COLOUR = '#FFFFFF';
const KNOWLEDGE_DAY_OBJECT = 'Knowledge_Day__c';

export default class KnowledgeDayMembers extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;

    @api knowledgeDayId;

    @api adminMode;

    @track members = [];
    @track groupMembers = [];
    @track groups = [];


    isLoading;
    showAllMembers;
    selectedIndex;

    colourClick;

    allMembersLabel = 'All Members';
    noGroupLabel = '[ungrouped]';

    connectedCallback() {
        this.showAllMembers = true;
        this.isLoading = true;
        if (this.objectApiName === KNOWLEDGE_DAY_OBJECT)
            this.knowledgeDayId = this.recordId;
        if (!this.knowledgeDayId) {
            console.log('Invalid knowledge day Id, cant load page');
            return;
        }
        getKnowledgeDayMembers({ kdId: this.knowledgeDayId }).then(result => {
            console.log('kd members: ' + JSON.stringify(result));
            //this.members = result;
            for (let member of result) {
                this.members.push({
                    userId: member.User__r.Id,
                    //name: member.User__r.Name,
                    name: member.User__r.Name_formula__c,
                    //photoUrl: member.User__r.FullPhotoUrl,
                    photoUrl: member.User__r.KD_Photo_URL__c || member.User__r.FullPhotoUrl,
                    memberId: member.Id,
                    kdId: this.knowledgeDayId,
                    reportId: member.Show_and_Tell_Report__c,
                    topic: member.Show_and_Tell_Report__c ? member.Show_and_Tell_Report__r.Topic__c : null,
                    get colourStyle() {
                        console.log('background-color: ' + this.groupColour);
                        return 'background-color: ' + this.groupColour;
                    },
                    get initials() {
                        if (!this.name) return null;
                        let nameWords = this.name.split(' ');
                        let maxNumInitials = 20;
                        let initials = '';
                        for (let i = 0; i < Math.min(maxNumInitials, nameWords.length); i++) {
                            initials += nameWords[i].charAt(0).toUpperCase();
                        }
                        return initials;
                    }
                });
            }
            getVotingGroups({ kdId: this.knowledgeDayId }).then(result => {
                //console.log('kd vg members: ' + JSON.stringify(result));
                let index = 0;
                for (let group of result) {
                    console.log(group.Name, group.Id, group.IsActive__c,);
                    if (!group.IsActive__c)
                        continue;
                    this.groups.push({
                        index: index,
                        id: group.Id,
                        name: group.Name,
                        members: group.Knowledge_Day_Voting_Group_Member__r || [],
                        colour: group.Colour_Hex_Code__c || DEFAULT_BG_COLOUR
                    });
                    index++;
                    console.log('group = ' + JSON.stringify(group));
                }

                for (let group of this.groups) {
                    for (let groupMember of group.members) {
                        let member = this.members.find(el => { return el.userId === groupMember.Knowledge_Day_Member__r.User__r.Id });
                        member.groupId = group.id;
                        member.groupIndex = group.index;
                        member.groupName = group.name;
                        member.groupColour = group.colour;
                        member.isPresenter = groupMember.Is_Presenter__c,
                            member.isJudge = groupMember.Is_Judge__c,

                            console.log(member.name + ' group info set to ' + member.groupIndex, member.groupName, member.groupColour, member.isJudge, member.isPresenter)
                        /*
                        member.group = {
                            index: group.index,
                            name: group.name,
                            colour: group.colour,
                        }
                        */
                    }
                }

                /*
                for (let group of this.groups) {
                    for (let member of group.members) {                         
                        this.groupMembers.push({
                            id: member.Knowledge_Day_Member__r.User__r.Id,
                            groupIndex: group.index,
                            groupName: group.name,
                            name: member.Knowledge_Day_Member__r.User__r.Name,
                            photoUrl: member.Knowledge_Day_Member__r.User__r.FullPhotoUrl
                        })
                    }
                }
                */

                //console.log(JSON.stringify(this.groupMembers));
                //this.members = result;
                this.isLoading = false;
            }).catch(error => {
                console.log('kd vg members error: ' + JSON.stringify(error));
            })
        }).catch(error => {
            console.log('kd members error: ' + JSON.stringify(error));
        })
    }

    get currentGroupMembers() {
        return this.members.filter(el => { return el.groupIndex == this.selectedIndex });

        //console.log('in currentGroupMembers');
        if (this.showAllMembers || !this.groupMembers || !this.groupMembers.length)
            return [];
        return this.groupMembers.filter(el => { return el.groupIndex == this.selectedIndex });
    }

    get allMembers() {

        console.log('in: get allMembers()');
        let returnMembers = [];
        for (let member of this.members) {
            //console.log(JSON.stringify(member));
            let userId = member.User__r.Id;
            let groupMember = this.groupMembers.find(el => { return userId === el.id }) || {};
            let returnMember = {
                userId: userId,
                name: member.User__r.Name,
                photoUrl: member.User__r.FullPhotoUrl,
            };
            //let returnMember = Object.assign({}, member);
            //returnMember.groupName = groupMember && groupMember.groupIndex >= 0 ? this.groups[groupMember.groupIndex].name : NO_GROUP_LABEL;
            if (groupMember.groupIndex >= 0) {
                returnMember.groupName = this.groups[groupMember.groupIndex].name;
                returnMember.backgroundColour = BG_COLOUR + this.groups[groupMember.groupIndex].colour;
            }

            returnMembers.push(returnMember);
        }
        return returnMembers;
    }


    handleSave() {
        saveKnowledgeDayMembers({ kdId: this.knowledgeDayId, jsonString: JSON.stringify(this.members) }).then(result => {
            console.log('success: ' + result);
        }).catch(error => {
            console.log('error: ' + JSON.stringify(error));
        })
    }


    handleDragStart(event) {
        //event.preventDefault();
        let userId = event.currentTarget.dataset.userId;
        console.log('dragging ' + userId);
        event.dataTransfer.setData('text', userId);

    }

    handleDragOver(event) {
        event.preventDefault();
        console.log('dragging over');
    }

    handleDrop(event) {
        event.preventDefault();
        if (!this.adminMode)
            return;
        //console.log('in drop');
        let userId = event.dataTransfer.getData('text');
        let groupIndex = event.currentTarget.dataset.groupIndex;
        console.log('userId ' + userId + ' has been dropped into group ' + groupIndex);
        let member = this.members.find(el => { return el.userId === userId });
        console.log('member = ' + JSON.stringify(member));
        member.groupIndex = groupIndex;
        member.groupId = groupIndex >= 0 ? this.groups[groupIndex].id : null;
        member.groupName = groupIndex >= 0 ? this.groups[groupIndex].name : null;
        member.groupColour = groupIndex >= 0 ? this.groups[groupIndex].colour : null;
        //this.members = this.members;
        //member.groupName = group.name;
        //member.groupColour = group.colour;
        console.log('member now = ' + JSON.stringify(member));
        /*

        
        //let member = this.groupMembers.find(el => { return el.id === userId });
        if (member) {
            console.log('found member: ' + JSON.stringify(member));
            member.groupIndex = groupIndex;
            member.groupName = this.groups[groupIndex].name;
        } else {
            console.log('new member!');
            let user = this.members.find(el => { return el.User__r.Id === userId });
            if (user) {
                console.log('found user ' + JSON.stringify(user));
                this.groupMembers.push({
                    id: userId,
                    groupIndex: groupIndex, 
                    name: user.User__r.Name,
                    photoUrl: user.User__r.FullPhotoUrl
                });
            } else {
                console.log('uh oh, couldnt find user');
            }
        }
        */
    }

    handleNewGroupModalOpen() {
        console.log('in handleNewGroupModalOpen');
        //this.template.querySelector('.newGroupModal').toggleModal();
        this.template.querySelector('c-lwc-modal').open();
    }

    handleNewGroupModalSave(event) {
        //let groupName = this.template.querySelector('.newGroupModal lightning-input');
        let groupName = this.template.querySelector('c-lwc-modal lightning-input').value;
        console.log(groupName);
        if (groupName) {
            this.groups.push({
                index: this.groups.length,
                name: groupName,
                members: [],
                colour: DEFAULT_BG_COLOUR
            });
        }
        // this.template.querySelector('.newGroupModal').toggleModal();
        this.template.querySelector('c-lwc-modal').close();
    }

    handleTabClick(event) {
        if (this.colourClick) {
            this.colourClick = false;
            return;
        }
        this.selectedIndex = event.currentTarget.dataset.groupIndex;
        this.showAllMembers = this.selectedIndex < 0;
        //console.log(this.selectedIndex, this.showAllMembers);

        for (let tab of this.template.querySelectorAll('.' + TAB_CLASS)) {
            if (tab.dataset.groupIndex === this.selectedIndex) {
                tab.classList.add(ACTIVE_TAB_CLASS);
            } else {
                tab.classList.remove(ACTIVE_TAB_CLASS);
            }
        }
    }

    handleColourPick(event) {
        //console.log('colour selected: '+ event.currentTarget.value);
        if (!this.adminMode)
            return;
        this.colourClick = true;
    }

    handleColourChange(event) {
        console.log('colour selected: ' + event.currentTarget.value);
        let colour = event.currentTarget.value;
        let groupIndex = event.currentTarget.dataset.groupIndex;
        this.groups[groupIndex].colour = colour;
        console.log(groupIndex, colour, this.groups[groupIndex].colour);
        console.log(this.members.filter(el => { return el.groupIndex == groupIndex }).length);
        for (let member of this.members) {
            if (member.groupIndex == groupIndex) {
                member.groupColour = colour;
            }
        }
        /*
        for (let member of this.members.filter(el => { return el.groupIndex == groupIndex })) {
            console.log('member.groupColour = ');
            member.groupColour = colour;
            console.log(member.groupColour);
        }
        let m = this.members;
        this.members = m;
        */

    }
}