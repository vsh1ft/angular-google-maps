import { TestBed } from '@angular/core/testing'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsComponent } from '../angular-google-maps.component'
import { Location } from '../location'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsService } from '../service/google-maps.service'
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsComponent', () => {

    let component: AngularGoogleMapsComponent

    let eventPublisherSpy: SpyObj<EventPublisher>
    let matIconRegistrySpy: SpyObj<MatIconRegistry>
    let domSanitizerSpy: SpyObj<DomSanitizer>
    let googleMapsBuilderSpy: SpyObj<AngularGoogleMapsBuilder>
    let geocoderSpy: SpyObj<AngularGoogleMapsGeocoder>
    let googleMapsServiceStub: SpyObj<GoogleMapsService>

    const subscribers = new Map<string, Function>()
    const location = new Location(10, 20)
    const googleMapsStub = {
        Animation: {DROP: ''},
        ControlPosition: {LEFT_BOTTOM: 'position'}
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AngularGoogleMapsComponent,
                {
                    provide: AngularGoogleMapsBuilder,
                    useValue: createSpyObj('AngularGoogleMapsBuilder',
                        ['createMap', 'addMarker', 'addSearchBox', 'addResizeControl', 'build'])
                },
                {
                    provide: AngularGoogleMapsGeocoder,
                    useValue: createSpyObj('AngularGoogleMapsGeocoder', ['reverseGeocode', 'geocode'])
                },
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService', ['getGoogleMaps'])
                },
                {
                    provide: EventPublisher,
                    useValue: createSpyObj('EvenPublisher', ['subscribe', 'notify', 'unsubscribeAll'])
                },
                {provide: MatIconRegistry, useValue: createSpyObj('MatIconRegistry', ['addSvgIcon'])},
                {provide: DomSanitizer, useValue: createSpyObj('DomSanitizer', ['bypassSecurityTrustResourceUrl'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        eventPublisherSpy.subscribe.and.callFake((e, fun) => subscribers.set(e, fun))
        matIconRegistrySpy = TestBed.get(MatIconRegistry)
        domSanitizerSpy = TestBed.get(DomSanitizer)
        googleMapsBuilderSpy = TestBed.get(AngularGoogleMapsBuilder)
        geocoderSpy = TestBed.get(AngularGoogleMapsGeocoder)
        googleMapsServiceStub = TestBed.get(GoogleMapsService)
        googleMapsServiceStub.getGoogleMaps.and.returnValue(googleMapsStub)

        component = TestBed.get(AngularGoogleMapsComponent)
    })

    it('registers an icon', () => {
        const safeResource = createSpyObj('SafeResourceUrl', [''])
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue(safeResource)

        component.ngOnInit()

        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledTimes(2)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalledTimes(2)
        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledWith(jasmine.any(String), safeResource)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalled()
    })

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy()

        expect(eventPublisherSpy.unsubscribeAll).toHaveBeenCalledWith('addressReverseGeocoded')
    })

    describe('Loading Google Maps', () => {

        beforeEach(() => {
            googleMapsBuilderSpy.createMap.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addMarker.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addSearchBox.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.build.and.returnValue(createSpyObj('google.maps.Map', ['']))
        })

        it('builds a map with marker and search box', () => {
            component.ngOnInit()

            component.setUpMapByLocation(location)

            expect(googleMapsBuilderSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }), location)
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                position: jasmine.anything()
            }), true)
            expect(googleMapsBuilderSpy.addSearchBox).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.build).toHaveBeenCalled()
        })

        it('builds a map by address', () => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback(location, null)
            )
            component.ngOnInit()

            component.setUpMapByAddress('address')

            expect(googleMapsBuilderSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }), location)
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                position: jasmine.anything()
            }), false)
            expect(googleMapsBuilderSpy.addSearchBox)
            expect(googleMapsBuilderSpy.build).toHaveBeenCalled()
        })

    })

    it('sets address from broadcast event', () => {
        const address = 'Some address'
        component.ngOnInit()

        subscribers.get('addressReverseGeocoded')(address)

        expect(component.address).toEqual(address)
    })

    describe('Resizes Google Maps', () => {

        it('expands map', () => {
            component.ngOnInit()

            component.resizeMap()

            expect(component.isMapExpanded).toBeTruthy()
            expect(eventPublisherSpy.notify).toHaveBeenCalledWith('googleMapsExpanded')
        })

        it('collapses map', () => {
            component.ngOnInit()

            component.resizeMap()
            component.resizeMap()

            expect(component.isMapExpanded).toBeFalsy()
            expect(eventPublisherSpy.notify).toHaveBeenCalledWith('googleMapsCollapsed')
        })
    })

})