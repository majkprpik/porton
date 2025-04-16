import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-uncheck-arrival-departure-modal',
  imports: [
    MatDialogModule
  ],
  template: `
    <div class="modal-container">
      <span mat-dialog-content>Uncheck {{data.arrivalOrDeparture}} for <b>House {{ data.houseNumber }}</b>?</span>
      <div class="buttons" mat-dialog-actions>
          <button class="cancel-button" mat-button (click)="onNoClick()">Cancel</button>
          <button class="delete-button" mat-button [mat-dialog-close]="true" cdkFocusInitial>Confirm</button>
      </div>
    </div>
  `,
  styles: `
  .modal-container{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 20px;

    span{
        font-size: 18px;
    }

    .buttons{
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          background-color: #fc594e;
        }
        
        .cancel-button{
            background-color: #4CAF50;
        }
        
        .delete-button{
            background-color: #fc594e;
        }
    }
  }`
})
export class UncheckArrivalDepartureModalComponent {
  constructor(
    public dialogRef: MatDialogRef<UncheckArrivalDepartureModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
  }

  onNoClick(): void{
    this.dialogRef.close();
  }
}
