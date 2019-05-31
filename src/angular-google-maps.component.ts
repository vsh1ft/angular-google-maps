import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { mapsText } from './angular-google-maps.constant'
import { Location } from './location'
import { AngularGoogleMapsBuilder } from './service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from './service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from './service/google-maps-factory.service'
import { IconRegistry } from './service/icon-registry/icon-registry'
import CircleOptions = google.maps.CircleOptions
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Component({
    selector: 'google-maps',
    template: `
        <input id="search-input" name="searchBox" class="controls" type="text"
               placeholder="{{mapsText.searchBox}}"
               [ngModelOptions]="{standalone: true}"
               [(ngModel)]="address"/>
        <mat-icon id="resize-control" svgIcon="{{!isMapExpanded ? 'expand' : 'collapse'}}"
                  (click)="resizeMap()"></mat-icon>

        <div id="map"></div>`,
    providers: [AngularGoogleMapsBuilder]
})
export class AngularGoogleMapsComponent implements OnInit, OnDestroy {

    mapsText = mapsText
    address = ''
    isMapExpanded = false

    @Output() mapOptions: MapOptions = {
        center: {
            lat: 0,
            lng: 0
        },
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite'],
            position: this.googleMapsFactory.getGoogleMaps().ControlPosition.LEFT_BOTTOM
        },
        zoom: 10,
        controlSize: 22,
        fullscreenControl: false
    }
    @Output() markerOptions: MarkerOptions = {
        position: {
            lat: 0,
            lng: 0
        },
        draggable: true,
        animation: this.googleMapsFactory.getGoogleMaps().Animation.DROP
    }

    @Output() markerCircleOptions: CircleOptions = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        radius: 50
    }

    constructor(private googleMapsFactory: GoogleMapsFactory,
                private googleMapsBuilder: AngularGoogleMapsBuilder,
                private googleMapsGeocoder: AngularGoogleMapsGeocoder,
                private eventPublisher: EventPublisher,
                private iconRegistry: IconRegistry) {
    }

    ngOnInit() {
        this.eventPublisher.subscribe('addressReverseGeocoded', (address: string) => this.address = address)
        this.iconRegistry.register('expand', './assets/expand.svg')
        this.iconRegistry.register('collapse', './assets/collapse.svg')

    }

    ngOnDestroy() {
        this.eventPublisher.unsubscribeAll('addressReverseGeocoded')
    }

    createMapByLocation(focusLocation: Location) {
        this.googleMapsGeocoder.reverseGeocode(focusLocation, (address: string) => this.address = address)

        this.changeMapCenter(focusLocation)
        this.googleMapsBuilder
            .createMap(this.mapOptions)
            .addMarkerWithCircle(this.markerOptions, this.markerCircleOptions)
            .addSearchBox()
    }

    createMapByAddress(address: string) {
        this.googleMapsGeocoder.geocode(address, (location: Location) => {
                this.changeMapCenter(location)
                this.googleMapsBuilder
                    .createMap(this.mapOptions)
                    .addMarkerWithCircle(this.markerOptions, this.markerCircleOptions)
                    .hideMarkerWithCircle()
                    .addSearchBox()
            }
        )
    }

    resizeMap() {
        this.isMapExpanded = !this.isMapExpanded
        if (this.isMapExpanded)
            this.eventPublisher.notify('googleMapsExpanded')
        else
            this.eventPublisher.notify('googleMapsCollapsed')
    }

    private changeMapCenter(location: Location) {
        this.mapOptions.center = {
            lat: location.latitude,
            lng: location.longitude
        }
    }
}
