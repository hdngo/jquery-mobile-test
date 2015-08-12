var ref = new Firebase('https://skatelife.firebaseio.com/');
var baseURL = 'https://skate-life-backend.herokuapp.com/';
// var baseURL = 'http://localhost:3000/';

var map;
var userMarker;
var markers = [];
var geoMarkers = [];
var latitude = 37.663836;
var longitude = -122.080266;




//CHANGE MAP SIZE AND INITIALIZATION LOCATION
$(document).on('pageshow', '#main-map-page', function (e, data) {
  setTimeout(function () {

    buildMap();


    //SET MARKER TO BE AT defaultLocation (MAKE IT VARIABLE LATER)
    defaultLocation = new google.maps.LatLng(latitude, longitude)
    createNewUserMarker(map);



    // Sets up Home button on Map div that will pan back to user marker postion
    var homeControlDiv = document.createElement('div');
    debugger
    var homeControl = new HomeControl(homeControlDiv, map);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);
    

    // Ajax call to grab skatepark coordinates
    $.ajax({
      url: baseURL + 'api/skateparks',
      type: 'get',
      dataType: 'json'
    })



    .done(function(response) {

      // WE DONT NEED THIS ANYMORE, SEE IF YOU CAN KEEP - IN BACKEND DB
      $.each(response, function(index, skatepark) {

        // DO THIS IN RUBY
        if (skatepark.lat[0] === '-') {
          var latParsed = skatepark.lat.substr(1);
          var lat = parseFloat(skatepark.lat);
        } else {
          var lat = parseFloat(skatepark.lat);
        }

        if (skatepark.lon[0] === '-') {
          var lonParsed = skatepark.lon.substr(1);
          var lon = parseFloat(skatepark.lon);
        } else {
          var lon = parseFloat(skatepark.lon);
        }



        var infowindow = buildSkateparkInfoWindow(skatepark, lat, lon);


        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(lat,lon),
          title: skatepark.name,
          map: map,
          icon: "./imgs/rollerskate.png"
        });

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map,marker);
        });
      });

      var mc = new MarkerClusterer(map, markers);

      //------------------GEOfence----------------------------//

        // Grab current latitude and longitude coordinates


        // Construct geofence circle
      var currentGeofence = new google.maps.Circle({
        map: map,
        radius: 9001,
        fillColor: '#336688',
        fillOpacity: .22,
        strokeColor: '#D48817',
        strokeWeight: 1.75
      });


      currentGeofence.bindTo('center', userMarker, 'position');

      $('.carousel').slick({
        arrows: false,
        focusOnSelect: true,
        mobileFirst: true,
        slidesToShow: 8,
        slidesToScroll: 3,
      });


      fireAutomaticCarouselBuilder(markers, currentGeofence);

    })

    .fail(function(response) {

    });

  }, 100);

});



// port these things to global variables and pass them in to the function
var buildMap = function() {
  var MY_MAPTYPE_ID = 'custom_style';
    var featureOpts = [
      {
        stylers: [
          {hue: '#F2A516'},
          {visibility: 'simplified'},
          {gamma: 0.8},
          {weight: 0.5}
        ]
      },
      {
        featureType: 'water',
        stylers: [
          {color: '#2E2D2A'}
        ]
      }
    ];

  // Set up map properties for custom stuff
  var mapProps = {
    center: new google.maps.LatLng(latitude, longitude),
    zoom:10,
    panControl:false,
    zoomControl:false,
    zoomControlOptions: {
      style:google.maps.ZoomControlStyle.LARGE,
    },
    mapTypeControl:false,
    scaleControl:true,
    streetViewControl:true,
    overviewMapControl:false,
    rotateControl:false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControlOptions: {
    mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
    },
    mapTypeId: MY_MAPTYPE_ID
  }

  map = new google.maps.Map(document.getElementById('googleMap'),
    mapProps
  );
  var styledMapOptions = {
      name: 'Custom Style'
  };

  var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
  map.mapTypes.set(MY_MAPTYPE_ID, customMapType)
}




// Adds and Removes from Carousel dependent on current location of User
var fireAutomaticCarouselBuilder = function(markers, geofence) {
  markers.forEach(function(marker){
    if (geofence.getBounds().contains(marker.position)) {
      var skatepark = {lat: marker.position.G, lon: marker.position.K }
      buildCarouselImage(skatepark);
      geoMarkers.push(marker);
    }
  });

  google.maps.event.addListener(userMarker, 'dragend', function(){
    $('.carousel-img').remove();

    markers.forEach(function(marker){
      if (geofence.getBounds().contains(marker.position)) {
        var skatepark = {lat: marker.position.G, lon: marker.position.K }
        buildCarouselImage(skatepark);
        geoMarkers.push(marker);
      }
    });
  });
}


var buildCarouselImage = function(skatepark) {
  $('.carousel').slick('slickAdd',
    $('<div>').addClass('carousel-img').append(
      $('<img>').attr('src', 'https://maps.googleapis.com/maps/api/streetview?size=300x100&location='+skatepark.lat+','+skatepark.lon+'&fov=70&heading=235&pitch=0')));
}


// builds little pop up window that is associated with every skatepark marker
// DEFINITELY need to refactor this
var buildSkateparkInfoWindow = function(skatepark, lat, lon) {
  var infowindow = new google.maps.InfoWindow({
       content: '<p class="center">'+skatepark.name+'</p><p class="center">'+skatepark.address+'</p><a class="skatepark-link center" href='+baseURL+'api/skateparks/'+skatepark.id+'>check it</a><p class="center center-img"><img src="https://maps.googleapis.com/maps/api/streetview?size=300x100&location='+lat+','+lon+'&fov=70&heading=235&pitch=0"/></p>'
  });

  return infowindow;

}



// Function for creating a User marker and associating it with data in firebase
// Hardcoding in User Position until Harvey grabs current location from phone


// This sets up reference to firebase database
var userMarkerRef = new Firebase('https://skatelife.firebaseio.com/markers/');

var createNewUserMarker = function(map) {
  var firebaseMarker = {
    url: '#login-page',
    position: defaultLocation,
    draggable: true,
    icon: './imgs/user-icon.png'
  }


  userMarkerRef.push(firebaseMarker);

}


userMarkerRef.on('child_added', function (snapshot) {
  var markerPosition = snapshot.val().position;
  var position = new google.maps.LatLng(markerPosition.G, markerPosition.K);

  var marker = new google.maps.Marker({
    url: '#login-page',
    position: position,
    draggable: true,
    icon: './imgs/user-icon.png'
  });

  marker.setMap(map);
  userMarker = marker;
});


// IMPLEMENT GEOLOCATION BELOW TO GET USER'S CURRENT POSITION
var onSuccess = function(position){

 latitude = position.coords.latitude;
 longitude = position.coords.longitude;
 defaultLocation = new google.maps.LatLng(latitude, longitude)

 initializeMap();
}

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
  navigator.geolocation.getCurrentPosition(onSuccess, onError)
}

onDeviceReady();



// CREATE BUTTON TO RETURN VIEW AND CURRENT USER MARKER TO CURRENT LOCATION
function HomeControl(controlDiv, map) {
  controlDiv.style.padding = '5px';

  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'black';
  controlUI.style.color = 'orange';
  controlUI.style.border = '1px solid orange';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'current locaiton';
  controlDiv.appendChild(controlUI);

  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial, sans-serif';
  controlText.style.fontSize='12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = '<b>Home<b>'
  controlUI.appendChild(controlText);

  google.maps.event.addDomListener(controlUI, 'click', function() {
    map.setCenter(userMarker.position);
  })
}



