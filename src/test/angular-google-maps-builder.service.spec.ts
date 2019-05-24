import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from '../service/google-maps-factory.service'
import Marker = google.maps.Marker
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
                        ['createMap', 'createMarker', 'createSearchBox', 'getSearchBoxInput'])
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
        let mapOptionsSpy: SpyObj<any>
        let markerOptionsSpy: SpyObj<any>

        const location = {
            lat: () => 10,
            lng: () => 15
        }
        const mouseEvent = {
            latLng: location
        }

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['addListener', 'getCenter', 'panTo', 'setZoom'])
            markerSpy = createSpyObj('google.maps.Marker', ['addListener', 'setMap', 'setPosition'])
            mapOptionsSpy = createSpyObj('google.maps.MapOptions', [''])
            markerOptionsSpy = createSpyObj('google.maps.MarkerOptions', [''])

            mapsFactorySpy.createMap.and.returnValue(mapSpy)
            mapsFactorySpy.createMarker.and.returnValue(markerSpy)
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
                    .addMarker(markerOptionsSpy)

                expect(mapsFactorySpy.createMarker).toHaveBeenCalled()
            })

            it('added marker is aligned with map location', () => {
                mapSpy.getCenter.and.returnValue(location)

                builder
                    .createMap(mapOptionsSpy)
                    .addMarker(markerOptionsSpy)

                expect(markerOptionsSpy.position).toEqual(location)
            })

            it('marker is bound to map', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addMarker(markerOptionsSpy)

                expect(markerOptionsSpy.map).toEqual(mapSpy)
            })

            it('hidden marker is added to map', () => {
                builder
                    .createMap(mapOptionsSpy)
                    .addHiddenMarker(markerOptionsSpy)

                expect(markerOptionsSpy.map).toBeUndefined()
            })

            describe('Invoked marker dragend listener handler', () => {

                beforeEach(() => {
                    builder
                        .createMap(mapOptionsSpy)
                        .addMarker(markerOptionsSpy)
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[0].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

                it('reverse geocodes', () => {
                    geocoderSpy.reverseGeocode.and.callFake((request, callback: any) =>
                        callback('address')
                    )
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[1].args[1](mouseEvent)

                    expect(geocoderSpy.reverseGeocode)
                        .toHaveBeenCalledWith(new Location(location.lat(), location.lng()), any(Function))
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith(any(String), 'address')
                })

                it('deletes marker', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dblclick')[0].args[1]()

                    expect(markerSpy.setMap).toHaveBeenCalledWith(null)
                })

                it('deleted marker fires location deleted event', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dblclick')[1].args[1]()

                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith('locationDeleted')
                })

                it('deleted marker clears search box input', () => {
                    const elementSpy: SpyObj<HTMLInputElement> = createSpyObj('HTMLInputElement', [''])
                    mapsFactorySpy.getSearchBoxInput.and.returnValue(elementSpy)

                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dblclick')[2].args[1]()

                    expect(elementSpy.value).toEqual('')
                })

            })

            describe('Invoked map click listener handler', () => {

                beforeEach(() => {
                    builder
                        .createMap(mapOptionsSpy)
                        .addMarker(markerOptionsSpy)
                })

                it('binds marker to map and new location', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[0].args[1](mouseEvent)

                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[1].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

                it('reverse geocodes', () => {
                    geocoderSpy.reverseGeocode.and.callFake((request, callback: any) =>
                        callback('address')
                    )
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[2].args[1](mouseEvent)

                    expect(geocoderSpy.reverseGeocode)
                        .toHaveBeenCalledWith(new Location(location.lat(), location.lng()), any(Function))
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith(any(String), 'address')
                })

            })

        })

        describe('Search box building', () => {

            let searchBoxSpy: SpyObj<google.maps.places.SearchBox>

            beforeEach(() => {
                searchBoxSpy = createSpyObj('google.maps.places.SearchBox', ['addListener', 'getPlaces'])

                searchBoxSpy.getPlaces.and.returnValue([{
                    geometry: {
                        location: location
                    }
                }] as any[])
                mapsFactorySpy.createSearchBox.and.returnValue(searchBoxSpy)

                builder
                    .createMap(mapOptionsSpy)
                    .addMarker(markerOptionsSpy)
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

                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(eventPublisherSpy.notify.calls.first().args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.first().args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

                it('does nothing if location cannot be retrieved', () => {
                    searchBoxSpy.getPlaces.and.returnValue([])
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(mapSpy.panTo).not.toHaveBeenCalled()
                    expect(mapSpy.setZoom).not.toHaveBeenCalled()
                    expect(markerSpy.setPosition).not.toHaveBeenCalled()
                    expect(markerSpy.setMap).not.toHaveBeenCalled()
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
