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
        Object.values(this.busMarkers).forEach(marker => {
            marker.setVisible(this.showBusMarkers);
        });
    }

    setShowBikeMarkers(visible) {
        this.showBikeMarkers = visible;
        //* Loop through all bike station markers and set their visibility
        Object.values(this.bikeMarkers).forEach(marker => {
            marker.setVisible(this.showBikeMarkers);
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
                throw new Error(`API request failed with status ${response.status}`);
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
                                    this.busData[this.followedBusId].labelOverlay.isFollowed = false;
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
                            Nopeus: ${(bus.position.speed * 3.6).toFixed(2)} km/h.
                        </div>
                        `
                    );

                    const labelOverlay = this.busData[busId].labelOverlay;
                    labelOverlay.updatePosition(position);

                    //* Update the map center if the current bus is being followed
                    if (labelOverlay.isFollowed) {
                        this.map.setCenter(position);
                    }

                    //* Set the marker visibility based on the showBusMarkers flag
                    labelOverlay.marker.setVisible(this.showBusMarkers);
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

            const stationStatusById = {};

            for (const station of data.stationStatusData.data.stations) {
                stationStatusById[station.station_id] = station;
            }

            for (const station of data.stationInformationData.data.stations) {
                const stationStatus = stationStatusById[station.station_id];
                if (stationStatus) {
                    const position = { lat: station.lat, lng: station.lon };

                    //* Remove the old marker for the same bike station if it exists
                    if (this.bikeMarkers[station.station_id]) {
                        this.bikeMarkers[station.station_id].setMap(null);
                        delete this.bikeMarkers[station.station_id];
                    }

                    //* Create a new marker only if the checkbox for showing bike markers is checked
                    if (this.showBikeMarkers) {
                        const marker = new google.maps.Marker({
                            position,
                            map: this.map,
                            icon: {
                                url: "img/vilkku-logo.png",
                                scaledSize: new google.maps.Size(30, 30),
                            },
                        });

                        this.bikeMarkers[station.station_id] = marker;

                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div class="card">
                                    <p><strong>Asema: ${station.name}</strong></p>
                                    <p>Pyöriä vapaana: ${stationStatus.num_bikes_available}</p>
                                    <p><a href='https://kaupunkipyorat.kuopio.fi/ajelulle.html' target='_blank'>Osta lippu</a></p>
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

   // for (const bike of data.bikeData.data.bikes) {
            //
            //     if (
            //         typeof bike.lat !== "number" ||
            //         typeof bike.lon !== "number"
            //     ) {
            //         console.error(
            //             `Invalid coordinates for bike ${bike.bike_id}: lat = ${bike.lat}, lon = ${bike.lon}`
            //         );
            //         continue;
            //     }

            //     const position = { lat: bike.lat, lng: bike.lon };

            //     const marker = new google.maps.Marker({
            //         position,
            //         map: this.map,
            //         icon: {
            //             url: "img/vilkku-bicycle-icon.png",
            //             scaledSize: new google.maps.Size(30, 30),
            //         },
            //     });

            //     const infoWindow = new google.maps.InfoWindow({
            //         content: `ID: ${bike.bike_id}, Akun varaus: ${
            //             bike.current_fuel_percent * 100
            //         }%`,
            //     });

            //     marker.addListener("click", () => {
            //         infoWindow.open(this.map, marker);
            //     });
            // }
