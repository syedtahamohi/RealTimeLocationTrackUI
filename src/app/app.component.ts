import { GoogleMapsModule } from "@angular/google-maps";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapService } from './services/map.service';

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
    scriptLoaded = false;

     constructor(private mapService: MapService, private cdr: ChangeDetectorRef) {
     this.websocket = new WebSocket('ws://localhost:8081/fetchLocation');

      this.websocket.onmessage = (event) => {
                     this.receivedLocation = true;
                     this.connected = false;
                            console.log('event.data');
                           console.log(event.data);
                           const jsonObject = JSON.parse(event.data);
                           this.currentLatitude = Number(jsonObject.latitude);
                           this.currentLongitude = Number(jsonObject.longitude);

                           this.options = {
                                 mapId: "DEMO_MAP_ID",
                                 center: { lat: this.currentLatitude, lng: this.currentLongitude },
                                 zoom: 19,
                               };

                           // Load Google Maps script only once, on first location data
                           this.ensureMapScriptLoaded();
//                            WITHOUT markForCheck():
//                             1. WebSocket receives data
//                              2. Component properties update
//                              3. Angular doesn't detect the change
//                              4. Template doesn't re-render (map stays hidden)

//                            WITH markForCheck():
//                              1. WebSocket receives data
//                              2. Component properties update
//                              3. cdr.markForCheck() signals Angular
//                              4. Angular runs change detection
//                              5. Template re-renders (map shows up)
                           this.cdr.markForCheck();
                           };
          }

    ngOnInit(): void {
     }

   sendMessage(message: any) {
        this.websocket.send(message);
    }

  private async ensureMapScriptLoaded() {
    // Only load once
    if (this.scriptLoaded) {
      return;
    }

    try {
      const configResp = await fetch('/config.json', { cache: 'no-cache' });
      if (!configResp.ok) {
        console.error('Failed to load config.json:', configResp.status);
        return;
      }

      const cfg = await configResp.json() as { googleMapsApiKey?: string };
      const apiKey = cfg?.googleMapsApiKey;

      if (!apiKey) {
        console.error('Google Maps API key is missing in config.json');
        return;
      }

      await this.mapService.load({ apiKey });
      this.scriptLoaded = true;
      this.cdr.markForCheck();
//       console.log('Google Maps script loaded successfully');
    } catch (err) {
      console.error('Failed to load Google Maps script:', err);
    }
  }

  public ngOnDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  public onSubmit() {

  this.connected = true;

  this.sendMessage(this.shareID);
  }
}
