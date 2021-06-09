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
                addKnowledgeUserCSV({ usersString: JSON.stringify(results.data) }).then(result => {
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