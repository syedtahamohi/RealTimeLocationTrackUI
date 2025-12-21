import { GoogleMapsModule } from "@angular/google-maps";
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [GoogleMapsModule,FormsModule,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {


  websocket: WebSocket;
  title = 'RealTimeLocationTrackUI';

  currentLatitude = 0;
  currentLongitude = 0;

  shareID='';

  options: google.maps.MapOptions = {};

    connected = false;
    receivedLocation = false;

     constructor() {
     this.websocket = new WebSocket('ws://localhost:8081/fetchLocation');

      this.websocket.onmessage = (event) => {
                     this.receivedLocation = true;
                     this.connected = false;
                            console.log('event.data');
                           console.log(event.data);
                           const jsonObject = JSON.parse(event.data);
                           this.currentLatitude = Number(jsonObject.latitude);
                           this.currentLongitude = Number(jsonObject.longitude);
           //                 this.options.center = { lat: this.currentLatitude, lng: this.currentLongitude }

                           this.options = {
                                 mapId: "DEMO_MAP_ID",
                                 center: { lat: this.currentLatitude, lng: this.currentLongitude },
                                 zoom: 19,
                               };
                           };
          }

    ngOnInit(): void {
     }

     sendMessage(message: any) {
         console.log(this.websocket.readyState);
         console.log('about to send data before ');
         console.log('about to send data');
         this.websocket.send(message);
         }

     ngOnDestroy() {
     }

      onSubmit() {

      this.connected = true;

      this.sendMessage(this.shareID);
      }
}
