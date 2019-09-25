import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { mapsText } from './angular-google-maps.constant'
import { Coordinates } from './coordinates'
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
        <mat-icon id="expand-icon" class="resize-control" svgIcon="expand" (click)="notifyMapResize()"></mat-icon>
        <mat-icon id="collapse-icon" class="resize-control" svgIcon="collapse" (click)="notifyMapResize()"></mat-icon>

        <div id="map"></div>`,
    providers: [AngularGoogleMapsBuilder]
})
export class AngularGoogleMapsComponent implements OnInit, OnDestroy {

    mapsText = mapsText
    address = ''

    @Output() mapOptions: MapOptions = {
        center: {
            lat: 0,
            lng: 0
        },
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite'],
            position: this.googleMapsFactory.getGoogleMaps().ControlPosition.LEFT_BOTTOM
        },
        zoom: 16,
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

    @Output() circleOptions: CircleOptions = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        editable: true,
        radius: 70
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
        this.googleMapsGeocoder.reverseGeocode(focusLocation.coordinates, (address: string) => this.address = address)

        this.circleOptions.radius = focusLocation.radiusInMeters
        this.changeMapCenter(focusLocation.coordinates)
        this.googleMapsBuilder
            .createMap(this.mapOptions)
            .addMarker(this.markerOptions)
            .addCircle(this.circleOptions)
            .bindCircleToMarker()
            .addSearchBox()
    }

    createMapByAddress(address: string) {
        this.googleMapsGeocoder.geocode(address, (coordinates: Coordinates) => {
                this.changeMapCenter(coordinates)
                this.googleMapsBuilder
                    .createMap(this.mapOptions)
                    .addMarker(this.markerOptions)
                    .addCircle(this.circleOptions)
                    .bindCircleToMarker()
                    .hideMarker()
                    .hideCircle()
                    .addSearchBox()
            }
        )
    }

    notifyMapResize() {
        this.eventPublisher.notify('resizeMap')
    }

    private changeMapCenter(coordinates: Coordinates) {
        this.mapOptions.center = {
            lat: coordinates.latitude,
            lng: coordinates.longitude
        }
    }
}
