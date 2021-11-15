import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { createRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import papaparse from '@salesforce/resourceUrl/papaparse';

import addKnowledgeUserCSV from '@salesforce/apex/KnowledgeDayController.addKnowledgeUserCSV';


export default class FileUploader extends LightningElement {

    isLoading = false;

    connectedCallback() {
        loadScript(this, papaparse);
    }

    handleDragOver(event) {
        event.preventDefault();
    }

    handleDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        let allInputsAreValid = true;
        // validate required inputs
        let requiredInputs = this.template.querySelectorAll('lightning-input[required]');
        console.log('requiredInputs.length = '+ requiredInputs.length);

        let allInputs = this.template.querySelectorAll('lightning-input');
        console.log('allInputs.length = '+ allInputs.length);
        for (let requiredInput of allInputs) {
            console.log('looping through '+ requiredInput);
            let isValid = requiredInput.reportValidity();
            if (!isValid) {                
                allInputsAreValid = false;
            }
        }
        console.log('allInputsAreValid = '+ allInputsAreValid);
        if (!allInputsAreValid) {
            return;
        }
        let accountInput = this.template.querySelector('lightning-input.knowledgeDayName');
        if (!accountInput) console.log('accountInput not found');
        console.log('accountName = '+ accountInput.value);
        let demoEmailInput = this.template.querySelector('lightning-input.demoEmailString');
        console.log('demoEmailString = '+ demoEmailInput.value);
        // if(!accountInput) {
        //     console.log('Account input not found');
        // }
        // let accountName = accountInput.value;
        // console.log('accountName = '+ accountName);
        // if (!accountName) {
        //     accountInput.reportValidity();
        //     this.showToast('Knowledge Day Name Required', 'Please enter a name for this Knowledge Day in order to upload users', 'error');
        //     return;
        // }
        this.isLoading = true;
        event.dataTransfer.dropEffect = 'copy';
        let file = event.dataTransfer.files[0];
        Papa.parse(file, {
            complete: (results, file) => {
                if (results.data) {
                    console.log('file read', results.data);
                    for (let contact of results.data) {
                        //console.log(JSON.stringify(contact));
                    }
                }
                console.log('about to call apex');
                this.isLoading = false;
                addKnowledgeUserCSV({ 
                    usersString: JSON.stringify(results.data), 
                    accountName: accountInput.value,  
                    demoEmailString: demoEmailInput.value,
                }).then(result => {
                    this.showToast('Success', 'Users successfully added', 'success');
                    console.log('result: ' + JSON.stringify(result));
                    this.isLoading = false;
                }).catch(error => {
                    console.log('error: ' + JSON.stringify(error));
                    this.showToast('Error calling apex', 'Error: ' + JSON.stringify(error), 'error');
                });
            },
            error: (error, file) => {
                this.showToast('Error parsing file', 'Error: ' + JSON.stringify(error), 'error');
            },
            header: true
        });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}