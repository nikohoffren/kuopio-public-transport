import LocationSetter from './LocationSetter.js';

let map;
let config;
let directionsService;
let directionsRenderer;
let startAutocomplete;
let endAutocomplete;
let startInput;
let endInput;
let settingOrigin = false;

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          resolve({ lat, lng });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

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

  const locationSetter = new LocationSetter();

  class BlinkingCircleOverlay extends google.maps.OverlayView {
    constructor(position, map) {
      super();
      this.position = position;
      this.div = null;
      this.setMap(map);
    }

    onAdd() {
      const div = document.createElement("div");
      div.className = "blinking";
      div.style.position = "absolute";
      div.style.width = "20px";
      div.style.height = "20px";
      div.style.borderRadius = "50%";
      div.style.backgroundColor = "red";

      this.div = div;
      const panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    }

    draw() {
      const overlayProjection = this.getProjection();
      const position = overlayProjection.fromLatLngToDivPixel(this.position);

      this.div.style.left = `${position.x - 10}px`;
      this.div.style.top = `${position.y - 10}px`;
    }

    onRemove() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }
  }

  async function addUserLocationToMap() {
    try {
      const position = await getCurrentPosition();
      //* create an instance of the BlinkingCircleOverlay class, it is working even it seems not to be used
      const circleOverlay = new BlinkingCircleOverlay(position, map);
      map.panTo(position);
    } catch (error) {
      console.error("Error getting user location:", error);
    }
  }

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
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Process and display the bus locations on the map
      const data = await response.json();
      console.log("Vilkku bus data:", data);

      for (const busEntity of data.entity) {
        const bus = busEntity.vehicle;
        const position = { lat: bus.position.latitude, lng: bus.position.longitude };
        const busId = bus.vehicle.id;

        if (!busData[busId]) {
          const busMarker = new google.maps.Marker({
            position: position,
            map: map,
            icon: {
              url: 'img/bus-stop-icon.png',
              scaledSize: new google.maps.Size(30, 30),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            //* converting the bus speed from m/s to km/h
            content: `Speed: ${(bus.position.speed * 3.6 * 10).toFixed(2)} km/h.`,
          });

          busMarker.addListener("click", () => {
            infoWindow.open(map, busMarker);
          });

          const busNumber = busEntity.vehicle.trip.routeId;
          const labelOverlay = new LabelOverlay(position, busNumber, map);

          busData[busId] = { marker: busMarker, infoWindow: infoWindow, labelOverlay: labelOverlay };
        } else {
          const busMarker = busData[busId].marker;
          busMarker.setPosition(position);

          const infoWindow = busData[busId].infoWindow;
          infoWindow.setContent(`Speed: ${bus.position.speed.toFixed(2)} km/h`);

          const labelOverlay = busData[busId].labelOverlay;
          labelOverlay.updatePosition(position);
        }
      }
    } catch (error) {
      console.error("Error fetching bus locations:", error);
    }
  }

  async function fetchAndDisplayVilkkuBicycles() {
    const apiUrl = "/.netlify/functions/vilkkuBicycles";

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
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
          content: `${station.getAttribute("name")}: ${station.getAttribute("bikes")} bikes available`,
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
  addUserLocationToMap();

  function updateBusPositions() {
    fetchAndDisplayBusLocations().then(() => {
      setTimeout(updateBusPositions, 2000); // 2000 milliseconds (2 seconds)
    });
  }

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  const markers = [
    [
      "Bike Taxi Kuopio",
      62.892575633523094,
      27.696424354781517,
      "img/biketaxi-kuopio.jpeg",
      40,
      40,
    ],
    // [
    //   "Vilkku Fillarit",
    //   62.89532713579455,
    //   27.67992516359851,
    //   "img/vilkku-bicycle-icon.jpg",
    //   40,
    //   40,
    // ],
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

  locationSetter.setOrigin();

  function setUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        if (locationSetter.isSettingOrigin()) {
          startInput.value = `lat: ${userLocation.lat().toFixed(6)}, lng: ${userLocation.lng().toFixed(6)}`;
        } else {
          endInput.value = `lat: ${userLocation.lat().toFixed(6)}, lng: ${userLocation.lng().toFixed(6)}`;
        }
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }
  setUserLocation();

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

  map.addListener("click", (e) => {
    const location = e.latLng;
    if (locationSetter.isSettingOrigin()) {
      startInput.value = `lat: ${location.lat().toFixed(6)}, lng: ${location.lng().toFixed(6)}`;
    } else {
      endInput.value = `lat: ${location.lat().toFixed(6)}, lng: ${location.lng().toFixed(6)}`;
    }
    locationSetter.isSettingOrigin() = false;
  });

  updateBusPositions();
}

function defineLabelOverlay() {
  class LabelOverlay extends google.maps.OverlayView {
    constructor(position, label, map) {
      super();
      this.position = position;
      this.label = label;
      this.div = null;
      this.setMap(map);
    }

    onAdd() {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.fontSize = "14px";
      div.style.fontWeight = "bold";
      div.style.color = "white";
      div.textContent = this.label;

      this.div = div;
      const panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    }

    draw() {
      const overlayProjection = this.getProjection();
      const position = overlayProjection.fromLatLngToDivPixel(this.position);

      this.div.style.left = `${position.x}px`;
      this.div.style.top = `${position.y}px`;
    }

    onRemove() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    // Add this method to update the position
    updatePosition(position) {
      this.position = position;
      if (this.div) {
        const overlayProjection = this.getProjection();
        const newPosition = overlayProjection.fromLatLngToDivPixel(position);

        this.div.style.left = `${newPosition.x}px`;
        this.div.style.top = `${newPosition.y}px`;
      }
    }
  }

  return LabelOverlay;
}

function calculateRoute(origin, destination) {
  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        modes: [google.maps.TransitMode.BUS],
      },
    },
    (response, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
        displayBusInfo(response);
      } else {
        window.alert("No routes available. Error: " + status);
      }
    }
  );
}

function displayBusInfo(response) {
  const busInfoElement = document.querySelector("#busInfoContent");
  const legs = response.routes[0].legs;

  let busInfoHTML = "";

  for (const leg of legs) {
    for (const step of leg.steps) {
      if (step.travel_mode === "TRANSIT") {
        const arrivalTime = step.transit.arrival_time.text;
        const departureTime = step.transit.departure_time.text;
        const lineName = step.transit.line.short_name || step.transit.line.name;
        const delay = step.transit.departure_time.value - step.transit.departure_time.real_value;

        busInfoHTML += `<p>Line: ${lineName}<br>
                        Departure: ${departureTime}<br>
                        Arrival: ${arrivalTime}<br>
                        Travel Time: ${step.duration.text}<br>
                        Delay: ${delay > 0 ? `${delay} minutes late` : "On time"}</p>`;
      }
    }
  }

  busInfoElement.innerHTML = busInfoHTML;

  // Show the toggleBusInfo button once the route information is available
  document.querySelector("#toggleBusInfo").style.display = "block";
  }

  document.querySelector("#toggleBusInfo").addEventListener("click", () => {
    const busInfoContent = document.querySelector("#busInfoContent");
    busInfoContent.style.display = busInfoContent.style.display === "none" ? "block" : "none";
  });

  document.querySelector("#toggleBusInfo").style.display = "none";
  const busInfoContent = document.querySelector("#busInfoContent");
  busInfoContent.style.display = "block";

  export async function onButtonClick() {
    const originPlace = startAutocomplete.getPlace();
    const destinationPlace = endAutocomplete.getPlace();

    if (!originPlace || !originPlace.geometry || !destinationPlace || !destinationPlace.geometry) {
      alert("Please select valid origin and destination locations.");
      return;
    }

    const origin = originPlace.geometry.location;
    const destination = destinationPlace.geometry.location;

    startInput.addEventListener("focus", () => {
      locationSetter.setOrigin();
    });

    endInput.addEventListener("focus", () => {
      locationSetter.setDestination();
    });


    calculateRoute(origin, destination);
  }

  document.getElementById("routeBtn").addEventListener("click", onButtonClick);

document.getElementById('useCurrentLocation').addEventListener('click', insertCurrentLocation);

async function insertCurrentLocation() {
  try {
    const position = await getCurrentPosition();
    const location = new google.maps.LatLng(position.lat, position.lng);
    const locationString = `lat: ${position.lat.toFixed(6)}, lng: ${position.lng.toFixed(6)}`;

    if (settingOrigin) {
      startInput.value = locationString;
      startAutocomplete.set('place', { geometry: { location: location } });
    } else {
      endInput.value = locationString;
      endAutocomplete.set('place', { geometry: { location: location } });
    }
  } catch (error) {
    console.error('Error getting user location:', error);
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
