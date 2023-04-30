import LocationSetter from "./LocationSetter.js";

let map;
let userMarker;
let config;
let directionsService;
let directionsRenderer;
let startAutocomplete;
let endAutocomplete;
let startInput;
let endInput;

const locationSetter = new LocationSetter();

export async function initMap() {
    const { Map } = await google.maps.importLibrary("maps", "places");
    const isMobile = window.innerWidth <= 800;

    map = new Map(document.getElementById("map"), {
        center: { lat: 62.89279594884219, lng: 27.678417174348255 },
        zoom: 14,
        mapTypeControl: true,
        mapTypeControlOptions: {
            position: isMobile
                ? google.maps.ControlPosition.LEFT_BOTTOM
                : google.maps.ControlPosition.TOP_RIGHT,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: isMobile
                ? google.maps.ControlPosition.RIGHT_BOTTOM
                : google.maps.ControlPosition.RIGHT_TOP,
        },
        mapId: config.GOOGLE_MAPS_MAP_ID,
    });

    const LabelOverlay = defineLabelOverlay();
    const busData = {};

    async function fetchAndDisplayBusLocations() {
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
            // console.log("Vilkku bus data:", data);

            for (const busEntity of data.entity) {
                const bus = busEntity.vehicle;
                const position = {
                    lat: bus.position.latitude,
                    lng: bus.position.longitude,
                };
                const busId = bus.vehicle.id;

                if (!busData[busId]) {
                    const infoWindow = new google.maps.InfoWindow({
                        //* converting the bus speed from m/s to km/h
                        content: `Nopeus: ${(bus.position.speed * 3.6).toFixed(
                            2
                        )} km/h.<br>Linja: ${bus.trip.routeId}<br>Reitti: ${
                            bus.vehicle.label
                        }`,
                    });

                    const routeId = busEntity.vehicle.trip.routeId;
                    const labelOverlay = new LabelOverlay(
                        position,
                        routeId,
                        map,
                        infoWindow
                    );

                    busData[busId] = {
                        infoWindow: infoWindow,
                        labelOverlay: labelOverlay,
                    };
                } else {
                    const infoWindow = busData[busId].infoWindow;
                    infoWindow.setContent(
                        `Nopeus: ${(bus.position.speed * 3.6).toFixed(
                            2
                        )} km/h.<br>Linja: ${bus.trip.routeId}<br>Reitti: ${
                            bus.vehicle.label
                        }`
                    );

                    const labelOverlay = busData[busId].labelOverlay;
                    labelOverlay.updatePosition(position);
                }
            }
        } catch (error) {
            console.error("Error fetching bus locations:", error);
        }
    }

    async function fetchAndDisplayServiceAlerts() {
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

    async function fetchAndDisplayTripUpdates() {
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

    async function fetchAndDisplayVilkkuBicycles() {
        const apiUrl = "/.netlify/functions/vilkkuBicycles";

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.text();
            console.log("Vilkku bicycles data: " + data);
            const parser = new DOMParser();
            const xmlData = parser.parseFromString(data, "application/xml");
            const bicycleStations = xmlData.getElementsByTagName("marker");

            console.log("Number of bicycle stations:", bicycleStations.length);

            for (const station of bicycleStations) {
                const lat = parseFloat(station.getAttribute("lat"));
                const lng = parseFloat(station.getAttribute("lng"));
                const position = { lat, lng };

                const marker = new google.maps.Marker({
                    position,
                    map,
                    icon: {
                        url: "img/vilkku-bicycle-icon.jpg",
                        scaledSize: new google.maps.Size(30, 30),
                    },
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `${station.getAttribute(
                        "name"
                    )}: ${station.getAttribute("bikes")} pyörää vapaana`,
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });
            }
        } catch (error) {
            console.error("Error fetching VILKKU bicycle data:", error);
        }
    }

    fetchAndDisplayVilkkuBicycles();

    function updateBusPositions() {
        fetchAndDisplayBusLocations().then(() => {
            setTimeout(updateBusPositions, 2000);
        });
    }

    function updateServiceAlerts() {
        fetchAndDisplayServiceAlerts().then(() => {
            setTimeout(updateServiceAlerts, 60000);
        });
    }

    function updateTripUpdates() {
        fetchAndDisplayTripUpdates().then(() => {
            setTimeout(updateTripUpdates, 60000);
        });
    }

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    const markers = [
        [
            `Bike Taxi Kuopio<br>Soita ja tilaa: 044 4410 520<br><a href="https://www.biketaxi.fi/hinnasto/?kaupunki=kuopio" target="_blank">www.biketaxi.fi</a>`,
            62.892575633523094,
            27.696424354781517,
            "img/biketaxi-kuopio.png",
            40,
            40,
        ],
    ];

    for (let currMarker of markers) {
        const marker = new google.maps.Marker({
            position: { lat: currMarker[1], lng: currMarker[2] },
            map,
            title: currMarker[0],
            icon: {
                url: currMarker[3],
                scaledSize: new google.maps.Size(currMarker[4], currMarker[5]),
            },
        });

        const infowindow = new google.maps.InfoWindow({
            content: currMarker[0],
        });

        marker.addListener("click", () => {
            infowindow.open(map, marker);
        });
    }

    startInput = document.getElementById("start");
    endInput = document.getElementById("end");

    startInput.addEventListener("focus", () => {
        locationSetter.setOrigin();
    });

    endInput.addEventListener("focus", () => {
        locationSetter.setDestination();
    });

    locationSetter.setOrigin();

    startAutocomplete = new google.maps.places.Autocomplete(startInput);
    endAutocomplete = new google.maps.places.Autocomplete(endInput);

    const kuopioBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(62.799444, 27.418611),
        new google.maps.LatLng(63.055833, 27.945833)
    );

    startAutocomplete = new google.maps.places.Autocomplete(startInput, {
        bounds: kuopioBounds,
    });

    endAutocomplete = new google.maps.places.Autocomplete(endInput, {
        bounds: kuopioBounds,
    });

    map.addListener("bounds_changed", () => {
        const newBounds = map.getBounds();
        startAutocomplete.setBounds(newBounds);
        endAutocomplete.setBounds(newBounds);
    });

    map.addListener("click", async (e) => {
        const location = e.latLng;
        const address = await reverseGeocode(location.lat(), location.lng());

        if (locationSetter.isSettingOrigin()) {
            startInput.value = address;
        } else {
            endInput.value = address;
        }
    });

    updateBusPositions();
    updateServiceAlerts();
    updateTripUpdates();
}

function createBusIconWithNumber(number) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = "img/bluecircle.png";
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 32, 32);

            //* Draw the number on top of the bus icon
            ctx.font = "14px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(number, 16, 16);

            //* Convert the canvas to a data URL
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = () => {
            reject(new Error("Failed to load bus icon image"));
        };
    });
}

function defineLabelOverlay() {
    class LabelOverlay {
        constructor(position, label, map, infoWindow) {
            this.position = position;
            this.label = label;
            this.infoWindow = infoWindow;

            //* Set the marker without an icon first
            this.marker = new google.maps.Marker({
                position: position,
                map: map,
            });

            //* Load the custom icon and update the marker
            createBusIconWithNumber(label)
                .then((iconDataURL) => {
                    this.marker.setIcon({
                        url: iconDataURL,
                        scaledSize: new google.maps.Size(32, 32),
                        //* Set the offset to correct bus marker position
                        anchor: new google.maps.Point(16, 17),
                    });
                })
                .catch((error) => {
                    console.error("Error creating bus icon:", error);
                });

            //* Set the click listener for the marker
            this.marker.addListener("click", () => {
                this.infoWindow.open(map, this.marker);
            });
        }

        updatePosition(position) {
            this.position = position;
            if (this.marker) {
                this.marker.setPosition(position);
            }
        }

        setClickListener(listener) {
            this.marker.addListener("click", () => {
                if (listener) {
                    listener();
                }
            });
        }
    }
    return LabelOverlay;
}

async function calculateRoute(origin, destination) {
    try {
        const walkingResponse = await getDirections(
            origin,
            destination,
            google.maps.TravelMode.WALKING
        );
        const walkingDistance =
            walkingResponse.routes[0].legs[0].distance.value;

        //* prioritize walking routes for distances less than 1,2 km
        if (walkingDistance < 1200) {
            directionsRenderer.setDirections(walkingResponse);
            displayRouteInfo(walkingResponse, false);
            return;
        }

        const transitResponse = await getDirections(
            origin,
            destination,
            google.maps.TravelMode.TRANSIT,
            { modes: [google.maps.TransitMode.BUS] }
        );

        directionsRenderer.setDirections(transitResponse);
        displayRouteInfo(transitResponse, true);
    } catch (transitError) {
        console.warn("Transit route not found:", transitError);

        try {
            const walkingResponse = await getDirections(
                origin,
                destination,
                google.maps.TravelMode.WALKING
            );
            directionsRenderer.setDirections(walkingResponse);
            displayRouteInfo(walkingResponse, false);
        } catch (walkingError) {
            console.warn("Walking route not found:", walkingError);

            try {
                const bicyclingResponse = await getDirections(
                    origin,
                    destination,
                    google.maps.TravelMode.BICYCLING
                );
                directionsRenderer.setDirections(bicyclingResponse);
                displayRouteInfo(bicyclingResponse, false);
            } catch (bicyclingError) {
                console.error("Bicycling route not found:", bicyclingError);
                window.alert(
                    "Ei löydettyjä reittejä. Virhe: " + bicyclingError
                );
            }
        }
    }
}

function getDirections(origin, destination, travelMode, transitOptions) {
    return new Promise((resolve, reject) => {
        directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: travelMode,
                transitOptions: transitOptions,
            },
            (response, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    resolve(response);
                } else {
                    reject(status);
                }
            }
        );
    });
}

function displayRouteInfo(response, isBusRoute) {
    const busInfoElement = document.querySelector("#busInfoContent");
    const legs = response.routes[0].legs;

    busInfoElement.style.backgroundColor = "white";
    busInfoElement.style.padding = "16px";
    busInfoElement.style.marginBottom = "10px";

    let routeInfoHTML = "";

    if (isBusRoute) {
        for (const leg of legs) {
            for (const step of leg.steps) {
                if (step.travel_mode === "TRANSIT") {
                    const arrivalTime = step.transit.arrival_time.text;
                    const departureTime = step.transit.departure_time.text;
                    const lineName =
                        step.transit.line.short_name || step.transit.line.name;
                    const delay =
                        step.transit.departure_time.value -
                        step.transit.departure_time.real_value;

                    routeInfoHTML += `<p>
                        Linja: ${lineName}<br>
                        Lähtöaika: ${departureTime}<br>
                        Saapumisaika: ${arrivalTime}<br>
                        Matka-aika: ${step.duration.text}<br>
                        Viive: ${
                            delay > 0
                                ? `${delay} minuuttia myöhässä`
                                : "Ajallaan"
                        }
                        <br><br>
                    </p>`;
                }
            }
        }
        routeInfoHTML += `<p><a href="https://vilkku.kuopio.fi/" target="_blank" class="link">Osta lippu</a></p>`;
    } else {
        for (const leg of legs) {
            routeInfoHTML += `<p>
                Matka-aika kävellen: ${leg.duration.text}<br>
                Matkan pituus: ${leg.distance.text}
                <br><br>
            </p>`;
        }
    }

    busInfoElement.innerHTML = routeInfoHTML;

    //* Show the toggleBusInfo button once the route information is available
    document.querySelector("#toggleBusInfo").style.display = "block";
    document.querySelector("#toggleBusInfo").style.marginBottom = "1rem";
    document.querySelector("#busInfo").style.display = "block";
}

document.querySelector("#toggleBusInfo").addEventListener("click", () => {
    const busInfoContent = document.querySelector("#busInfoContent");
    busInfoContent.style.display =
        busInfoContent.style.display === "none" ? "block" : "none";
});

document.querySelector("#toggleBusInfo").style.display = "none";
const busInfoContent = document.querySelector("#busInfoContent");
busInfoContent.style.display = "block";

async function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
                resolve(results[0].geometry.location);
            } else {
                reject(
                    new Error(
                        "Geocode was not successful for the following reason: " +
                            status
                    )
                );
            }
        });
    });
}

export async function onButtonClick() {
    const originValue = startInput.value;
    const destinationValue = endInput.value;

    let origin, destination;

    const latLngRegex = /^lat:\s*(-?\d+(\.\d+)?),\s*lng:\s*(-?\d+(\.\d+)?)$/;

    if (latLngRegex.test(originValue)) {
        const [, lat, , lng] = originValue.match(latLngRegex);
        origin = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    } else {
        try {
            origin = await geocodeAddress(originValue);
        } catch (error) {
            alert("Valitse olemassa oleva lähtöpaikka.");
            return;
        }
    }

    if (latLngRegex.test(destinationValue)) {
        const [, lat, , lng] = destinationValue.match(latLngRegex);
        destination = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    } else {
        try {
            destination = await geocodeAddress(destinationValue);
        } catch (error) {
            alert("Valitse olemassa oleva saapumispaikka.");
            return;
        }
    }

    calculateRoute(origin, destination);
}

window.onButtonClick = onButtonClick;

async function reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);
    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    resolve("Valittu sijainti");
                }
            } else {
                reject(new Error("Geocoder failed due to: " + status));
            }
        });
    });
}

async function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                //* reverse geocode the user's location
                try {
                    const address = await reverseGeocode(pos.lat, pos.lng);
                    //* update the input field with the address
                    if (locationSetter.isSettingOrigin()) {
                        startInput.value = address;
                    } else {
                        endInput.value = address;
                    }
                } catch (error) {
                    console.error(
                        "Failed to reverse geocode user's location:",
                        error
                    );
                }

                //* remove the previous user marker if it exists
                if (userMarker) {
                    userMarker.setMap(null);
                }

                userMarker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: "Sijaintisi",
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    },
                });
                map.setCenter(pos);
            },
            () => {
                handleLocationError(true, infoWindow, map.getCenter());
            }
        );
    } else {
        //? browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

window.addEventListener("resize", () => {
    const isMobile = window.innerWidth <= 800;

    map.setOptions({
        mapTypeControlOptions: {
            position: isMobile
                ? google.maps.ControlPosition.BOTTOM_CENTER
                : google.maps.ControlPosition.TOP_RIGHT,
        },
        fullscreenControlOptions: {
            position: isMobile
                ? google.maps.ControlPosition.RIGHT_BOTTOM
                : google.maps.ControlPosition.RIGHT_TOP,
        },
    });
});

document
    .querySelector("#useCurrentLocation")
    .addEventListener("click", getUserLocation);

async function fetchConfig() {
    const response = await fetch("/config");
    const data = await response.json();
    return data;
}

export async function loadMap() {
    config = await fetchConfig();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.GOOGLE_MAPS_API_KEY}&map_ids=${config.GOOGLE_MAPS_MAP_ID}&callback=initMap&libraries=places`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
}

window.initMap = initMap;
loadMap();
