export default class DataFetcher {
    constructor(map, LabelOverlay, createBusIconWithNumber, busData) {
        this.map = map;
        this.LabelOverlay = LabelOverlay;
        this.createBusIconWithNumber = createBusIconWithNumber;
        this.busData = busData;
        this.followedBusId = null;
        this.shouldFollowBus = false;
        this.showBusMarkers = true;
        this.showBikeMarkers = true;
        this.busMarkers = {};
        this.bikeMarkers = {};
        this.twoSeconds = 2000;
    }

    setShouldFollowBus(newValue) {
        this.shouldFollowBus = newValue;
        //* if shouldFollowBus is set to false, also unset the followed bus
        if (!newValue && this.followedBusId !== null) {
            this.busData[this.followedBusId].labelOverlay.isFollowed = false;
            this.followedBusId = null;
        }
    }

    setShowBusMarkers(visible) {
        this.showBusMarkers = visible;
        //* Loop through all bus markers and set their visibility
        Object.values(this.busMarkers).forEach((marker) => {
            marker.setVisible(this.showBusMarkers);
        });
    }

    setShowBikeMarkers(visible) {
        this.showBikeMarkers = visible;
        //* Loop through all bike station markers and set their visibility
        Object.values(this.bikeMarkers).forEach((marker) => {
            marker.setVisible(this.showBikeMarkers);
        });
    }

    animateMarker(marker, toPosition, duration) {
        const start = performance.now();
        const fromPosition = marker.getPosition();
        const latDelta = toPosition.lat() - fromPosition.lat();
        const lngDelta = toPosition.lng() - fromPosition.lng();

        requestAnimationFrame(function animate(now) {
            const elapsed = now - start;
            const t = elapsed / duration;

            if (t > 1) {
                marker.setPosition(toPosition);
            } else {
                const lat = fromPosition.lat() + t * latDelta;
                const lng = fromPosition.lng() + t * lngDelta;
                marker.setPosition(new google.maps.LatLng(lat, lng));
                requestAnimationFrame(animate);
            }
        });
    }

    async fetchAndDisplayBusLocations() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/vehiclepositions"
                    : "/api/vehiclepositions";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the bus locations on the map
            const data = await response.json();

            for (const busEntity of data.entity) {
                const bus = busEntity.vehicle;
                const position = {
                    lat: bus.position.latitude,
                    lng: bus.position.longitude,
                };
                const busId = bus.vehicle.id;

                if (!this.busData[busId]) {
                    const infoWindow = new google.maps.InfoWindow({
                        //* converting the bus speed from m/s to km/h
                        content: `
                    <strong>Linja: ${bus.trip.routeId}</strong><br>
                    Reitti: ${bus.vehicle.label}<br>
                    Nopeus: ${(bus.position.speed * 3.6).toFixed(2)} km/h.
                `,
                    });

                    const routeId = busEntity.vehicle.trip.routeId;
                    //* Pass an onClick callback to the LabelOverlay constructor
                    const labelOverlay = new this.LabelOverlay(
                        position,
                        routeId,
                        this.map,
                        infoWindow,
                        () => {
                            if (this.shouldFollowBus) {
                                if (this.followedBusId !== null) {
                                    this.busData[
                                        this.followedBusId
                                    ].labelOverlay.isFollowed = false;
                                }
                                this.followedBusId = busId;
                                labelOverlay.isFollowed = true;
                                this.map.setCenter(position);
                            }
                        }
                    );

                    this.busData[busId] = {
                        infoWindow: infoWindow,
                        labelOverlay: labelOverlay,
                    };

                    if (labelOverlay.isFollowed && this.shouldFollowBus) {
                        this.map.setCenter(position);
                    }
                } else {
                    const infoWindow = this.busData[busId].infoWindow;
                    infoWindow.setContent(
                        `
                            <div class="card">
                                <strong>Linja: ${bus.trip.routeId}</strong><br>
                                Reitti: ${bus.vehicle.label}<br>
                                Nopeus: ${(bus.position.speed * 3.6).toFixed(
                                    2
                                )} km/h.
                                <p><a href='https://vilkku.kuopio.fi/' target='_blank'>Osta lippu</a></p>
                            </div>
                        `
                    );

                    const labelOverlay = this.busData[busId].labelOverlay;

                    //* Set the marker visibility based on the showBusMarkers flag
                    labelOverlay.marker.setVisible(this.showBusMarkers);

                    //* Update the map center if the current bus is being followed
                    if (labelOverlay.isFollowed) {
                        this.map.setCenter(position);
                    }

                    //* update the marker's position with animation
                    const nextPosition = new google.maps.LatLng(
                        position.lat,
                        position.lng
                    );
                    this.animateMarker(labelOverlay.marker, nextPosition, this.twoSeconds);
                }
            }
        } catch (error) {
            console.error("Error fetching bus locations:", error);
        }
    }

    async fetchAndDisplayServiceAlerts() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/servicealerts"
                    : "/api/servicealerts";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the service alerts
            const data = await response.json();
            console.log("Service alerts:", data);
        } catch (error) {
            console.error("Error fetching service alerts:", error);
        }
    }

    async fetchAndDisplayTripUpdates() {
        try {
            const apiUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost:3999/api/tripupdates"
                    : "/api/tripupdates";

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            //* Process and display the trip updates
            const data = await response.json();
            // console.log("Trip updates:", data);
        } catch (error) {
            console.error("Error fetching trip updates:", error);
        }
    }

    async fetchAndDisplayFreeBikeLocations() {
        const apiUrl =
            window.location.hostname === "localhost"
                ? "http://localhost:3999/.netlify/functions/vilkkuBicycles"
                : "/.netlify/functions/vilkkuBicycles";

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.json();

            const bikesAtStation = {};

            for (const bike of data.bikeData.data.bikes) {
                if (bike.station_id) {
                    if (!bikesAtStation[bike.station_id]) {
                        bikesAtStation[bike.station_id] = [];
                    }

                    bikesAtStation[bike.station_id].push(bike);
                }
            }

            const stationStatusById = {};

            for (const station of data.stationStatusData.data.stations) {
                stationStatusById[station.station_id] = station;
            }

            for (const station of data.stationInformationData.data.stations) {
                const stationStatus = stationStatusById[station.station_id];
                if (stationStatus) {
                    const position = { lat: station.lat, lng: station.lon };

                    if (this.bikeMarkers[station.station_id]) {
                        this.bikeMarkers[station.station_id].setMap(null);
                        delete this.bikeMarkers[station.station_id];
                    }

                    if (this.showBikeMarkers) {
                        const marker = new google.maps.Marker({
                            position,
                            map: this.map,
                            icon: {
                                url: "img/vilkku-bicycle-icon.png",
                                scaledSize: new google.maps.Size(30, 30),
                            },
                        });

                        this.bikeMarkers[station.station_id] = marker;

                        let bikeInfo = "";
                        if (bikesAtStation[station.station_id]) {
                            for (const bike of bikesAtStation[
                                station.station_id
                            ]) {
                                let fuelPercent = (
                                    bike.current_fuel_percent * 100
                                ).toFixed(0);
                                let rangeKm = (
                                    bike.current_range_meters / 1000
                                ).toFixed(2);
                                if (isNaN(fuelPercent)) fuelPercent = "N/A";
                                if (isNaN(rangeKm)) rangeKm = "N/A";
                                bikeInfo += `<p>Freebike ${bike.bike_id}: Virtaa ${fuelPercent}%, ${rangeKm} km</p>`;
                            }
                        }

                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div class="card">
                                    <p><strong>Asema: ${station.name}</strong></p>
                                    <p>Pyöriä vapaana: ${stationStatus.num_bikes_available}</p>
                                    <p><a href='https://kaupunkipyorat.kuopio.fi/ajelulle.html' target='_blank'>Osta lippu</a></p>
                                    ${bikeInfo}
                                </div>
                            `,
                        });

                        marker.addListener("click", () => {
                            infoWindow.open(this.map, marker);
                        });
                    }
                } else {
                    console.warn(
                        `No status information found for station ${station.station_id}`
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching VILKKU bicycle data:", error);
        }
    }
}
