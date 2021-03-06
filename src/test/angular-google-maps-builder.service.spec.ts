import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from '../service/google-maps-factory.service'
import { Coordinates } from '../value-object/coordinates'
import { Location } from '../value-object/location'
import Circle = google.maps.Circle
import CircleOptions = google.maps.CircleOptions
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import Polyline = google.maps.Polyline
import PolylineOptions = google.maps.PolylineOptions
import any = jasmine.any
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsBuilder', () => {

    let mapsFactorySpy: SpyObj<GoogleMapsFactory>
    let eventPublisherSpy: SpyObj<EventPublisher>
    let geocoderSpy: SpyObj<AngularGoogleMapsGeocoder>
    let builder: AngularGoogleMapsBuilder

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsBuilder,
                {
                    provide: GoogleMapsFactory,
                    useValue: createSpyObj('GoogleMapsFactory',
                        ['createMap', 'createMarker', 'createSearchBox', 'getSearchBoxInput', 'createCircle',
                            'createPolyline'])
                },
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])},
                {
                    provide: AngularGoogleMapsGeocoder,
                    useValue: createSpyObj('AngularGoogleMapsGeocoder', ['reverseGeocode'])
                }
            ]
        })
        mapsFactorySpy = TestBed.get(GoogleMapsFactory)
        eventPublisherSpy = TestBed.get(EventPublisher)
        geocoderSpy = TestBed.get(AngularGoogleMapsGeocoder)

        builder = TestBed.get(AngularGoogleMapsBuilder)
    })

    describe('Building Google Maps', () => {

        let mapSpy: SpyObj<any>
        let markerSpy: SpyObj<Marker>
        let circleSpy: SpyObj<Circle>
        let polylineSpy: SpyObj<Polyline>
        let mapOptionsSpy: SpyObj<MapOptions>
        let markerOptionsSpy: SpyObj<MarkerOptions>
        let circleOptionsSpy: SpyObj<CircleOptions>
        let polylineOptionsSpy: SpyObj<PolylineOptions>

        const location = {
            lat: (): number => 10,
            lng: (): number => 15,
            equals: () => false,
            toUrlValue: () => '',
            toJSON: (): any => ''
        }

        const mouseEvent = {
            latLng: location
        }

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['addListener', 'getCenter', 'panTo', 'setZoom'])
            polylineSpy = createSpyObj('google.maps.Polyline', ['setMap'])
            markerSpy = createSpyObj('google.maps.Marker', ['addListener', 'setMap', 'setPosition', 'getPosition'])
            circleSpy = createSpyObj(
                'google.maps.Circle',
                ['setMap', 'setPosition', 'bindTo', 'getRadius', 'addListener']
            )
            mapOptionsSpy = createSpyObj('google.maps.MapOptions', [''])
            markerOptionsSpy = createSpyObj('google.maps.MarkerOptions', [''])
            circleOptionsSpy = createSpyObj('google.maps.CircleOptions', [''])
            polylineOptionsSpy = createSpyObj('google.maps.PolylineOptions', [''])

            mapsFactorySpy.createMap.and.returnValue(mapSpy)
            mapsFactorySpy.createPolyline.and.returnValue(polylineSpy)
            mapsFactorySpy.createMarker.and.returnValue(markerSpy)
            mapsFactorySpy.createCircle.withArgs(circleOptionsSpy).and.returnValue(circleSpy)
        })

        describe('On map building', () => {

            it('creates a map', () => {
                builder.createMap(mapOptionsSpy)

                expect(mapsFactorySpy.createMap).toHaveBeenCalledWith(mapOptionsSpy)
            })

        })

        describe('On marker building', () => {

            let handlerDummy: SpyObj<() => void>

            beforeEach(() => {
                handlerDummy = createSpyObj('ListenerHandler', [''])
            })

            it('adds a marker', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)

                expect(mapsFactorySpy.createMarker).toHaveBeenCalled()
            })

            it('added marker is aligned with map location', () => {
                mapSpy.getCenter.and.returnValue(location)

                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)

                expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
            })

            it('marker is bound to map', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)

                expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
            })


            it('creates a circle', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addCircle(circleOptionsSpy)

                expect(mapsFactorySpy.createCircle).toHaveBeenCalledWith(circleOptionsSpy)
                expect(circleSpy.setMap).toHaveBeenCalledWith(mapSpy)
            })

            it('adds marker', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addMarker(markerOptionsSpy)

                expect(mapsFactorySpy.createMarker).toHaveBeenCalledWith(markerOptionsSpy)
                expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
            })

            it('adds polyline', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addPolyline(polylineOptionsSpy)

                expect(mapsFactorySpy.createPolyline).toHaveBeenCalledWith(polylineOptionsSpy)
                expect(polylineSpy.setMap).toHaveBeenCalledWith(mapSpy)
            })

            it('binds circle to marker', () => {
                mapSpy.getCenter.and.returnValue(location)

                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)
                    .addCircle(circleOptionsSpy)
                    .bindCircleToMarker()

                expect(circleSpy.bindTo).toHaveBeenCalledWith('center', markerSpy, 'position')
            })

            it('marker is removed from map', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)
                    .hideMarker()

                expect(markerSpy.setMap).toHaveBeenCalledWith(null)
            })

            it('circle is removed from map', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addCircle(circleOptionsSpy)
                    .hideCircle()

                expect(circleSpy.setMap).toHaveBeenCalledWith(null)
            })

            describe('Invoke circle radius change listener', () => {
                const radius = 123

                beforeEach(() => {
                    circleSpy.getRadius.and.returnValue(radius)
                    markerSpy.getPosition.and.returnValue(location)
                })

                it('notifies radius change', () => {
                    builder
                        .createMap(mapOptionsSpy)
                        .addCenterMarker(markerOptionsSpy)
                        .addCircle(circleOptionsSpy)

                    getCallsByInvokedParameter(circleSpy.addListener.calls.all(), 'radius_changed')[0].args[1]()

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0]).toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(new Coordinates(location.lat(), location.lng()), radius))
                })

                it('notifies radius change with default location coordinates when marker does not exist', () => {
                    builder
                        .createMap(mapOptionsSpy)
                        .addCircle(circleOptionsSpy)

                    getCallsByInvokedParameter(circleSpy.addListener.calls.all(), 'radius_changed')[0].args[1]()

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0]).toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(new Coordinates(0, 0), radius))
                })
            })


            describe('Invoked marker dragend listener handler', () => {
                const radius = 70

                beforeEach(() => {
                    circleSpy.getRadius.and.returnValue(radius)
                    markerSpy.getPosition.and.returnValue(location)

                    builder
                        .createMap(mapOptionsSpy)
                        .addCenterMarker(markerOptionsSpy)
                        .addCircle(circleOptionsSpy)
                        .bindCircleToMarker()
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[0].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0]).toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(new Coordinates(location.lat(), location.lng()), radius))
                })

                it('reverse geocodes', () => {
                    geocoderSpy.reverseGeocode.and.callFake((request, callback: any) =>
                        callback('address')
                    )

                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[1].args[1](mouseEvent)

                    const coordinates = new Coordinates(location.lat(), location.lng())
                    expect(geocoderSpy.reverseGeocode).toHaveBeenCalledWith(coordinates, any(Function))
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith(any(String), 'address')
                })

            })

            describe('Invoked marker dragend listener handler without circle', () => {

                it('notifies location change with default radius when circle does not exist', () => {
                    markerSpy.getPosition.and.returnValue(location)
                    builder.createMap(mapOptionsSpy).addCenterMarker(markerOptionsSpy)

                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[0].args[1]()

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0]).toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(new Coordinates(location.lat(), location.lng()), 0))
                })
            })

            describe('Invoked map click listener handler', () => {
                const radius = 70

                beforeEach(() => {
                    circleSpy.getRadius.and.returnValue(radius)
                    markerSpy.getPosition.and.returnValue(location)

                    builder
                        .createMap(mapOptionsSpy)
                        .addCenterMarker(markerOptionsSpy)
                        .addCircle(circleOptionsSpy)
                        .bindCircleToMarker()
                })

                it('binds marker to map and new location', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[0].args[1](mouseEvent)

                    expect(circleSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[1].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(new Coordinates(location.lat(), location.lng()), radius))
                })

                it('reverse geocodes', () => {
                    geocoderSpy.reverseGeocode.and.callFake((request, callback: any) =>
                        callback('address')
                    )
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[2].args[1](mouseEvent)

                    expect(geocoderSpy.reverseGeocode)
                        .toHaveBeenCalledWith(new Coordinates(location.lat(), location.lng()), any(Function))
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith(any(String), 'address')
                })

            })

        })

        describe('Search box building', () => {

            let searchBoxSpy: SpyObj<google.maps.places.SearchBox>
            const radius = 70

            beforeEach(() => {
                circleSpy.getRadius.and.returnValue(radius)
                searchBoxSpy = createSpyObj('google.maps.places.SearchBox', ['addListener', 'getPlaces'])

                searchBoxSpy.getPlaces.and.returnValue([{
                    geometry: {
                        location: location
                    }
                }] as any[])
                mapsFactorySpy.createSearchBox.and.returnValue(searchBoxSpy)

                builder
                    .createMap(mapOptionsSpy)
                    .addCenterMarker(markerOptionsSpy)
                    .addCircle(circleOptionsSpy)
                    .bindCircleToMarker()
                    .addSearchBox()
            })

            it('adds search box', () => {
                expect(mapsFactorySpy.createSearchBox).toHaveBeenCalledWith()
            })

            describe('Invoked search box listener handler', () => {

                it('focuses map to new location', () => {
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(mapSpy.panTo).toHaveBeenCalledWith(location)
                    expect(mapSpy.setZoom).toHaveBeenCalledWith(any(Number))
                })

                it('binds marker to map and new location', () => {
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(circleSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(eventPublisherSpy.notify.calls.first().args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.first().args[1])
                        .toEqual(new Location(new Coordinates(location.lat(), location.lng()), radius))
                })

                it('does nothing if location cannot be retrieved', () => {
                    searchBoxSpy.getPlaces.and.returnValue([])
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(mapSpy.panTo).not.toHaveBeenCalled()
                    expect(mapSpy.setZoom).not.toHaveBeenCalled()
                    expect(eventPublisherSpy.notify).not.toHaveBeenCalled()
                })

            })

        })

    })

    function getCallsByInvokedParameter(allCalls, firstParameterValue: string) {
        const matchedCalls = []
        for (const call of allCalls)
            if (call.args[0] === firstParameterValue)
                matchedCalls.push(call)
        return matchedCalls
    }

})
