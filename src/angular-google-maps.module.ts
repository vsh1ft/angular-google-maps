import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsGeocoderService } from './service/angular-google-maps-geocoder.service'
import { AngularGoogleMapsListenerService } from './service/angular-google-maps-listener.service'
import { AngularGoogleMapsService } from './service/angular-google-maps.service'
import { GoogleMapsLoader } from './service/google-maps-loader.service'
import { GoogleMapsService } from './service/google-maps.service'

@NgModule({
    declarations: [
        AngularGoogleMapsComponent
    ],
    imports: [
        FormsModule,
        MatIconModule
    ],
    exports: [
        AngularGoogleMapsComponent
    ],
    providers: [
        AngularGoogleMapsGeocoderService,
        AngularGoogleMapsListenerService,
        AngularGoogleMapsService,
        GoogleMapsLoader,
        GoogleMapsService
    ]
})
export class AngularGoogleMapsModule {
}
