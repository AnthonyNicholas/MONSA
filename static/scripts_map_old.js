
// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {
    
    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "on"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "on"}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: -37.7667, lng: 144.9628}, // Brunswick, Victoria
        disableDefaultUI: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };


    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);


    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);
    
    
    // allow users to add Nature Strip to MONSA
    $("#addButton").click(function(){

        // console.log(map.getStreetView().getLocation());
        // console.log(map.getStreetView().getLocation());
        // console.log("Position" + map.getStreetView().getLocation()['latLng']); //gives (lat, lng)
        // console.log(map.getStreetView().getLocation()['description']);
        // console.log(map.getStreetView().getLocation()['pano']);
        
        var latLng = "" + map.getStreetView().getLocation()['latLng']; //pass as a string
        var description = map.getStreetView().getLocation()['description'];
        var heading = map.getStreetView().getPov()['heading']; //a number
        var param = {latLng: latLng, description: description, heading:heading};
            
        $.get(Flask.url_for("captureButton"), param).done(function() {
            
            $("#addButton").text("Thankyou").css('background','#8ec252');
            
            setTimeout(function(){
              $("#addButton").text("Add this Nature Strip to MONSA Gallery").css('background','#C0C0C0');
            }, 1000);
        });
    });


});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    //instantiate marker
    
    var LatLng = {lat: place.latitude, lng: place.longitude};
    
    var Image = {
        url: 'https://vignette4.wikia.nocookie.net/tinymonsters/images/2/23/Debris_small_tree.png/revision/latest?cb=20121018203235',
        scaledSize: new google.maps.Size(25, 25)
        };
    
    var marker = new google.maps.Marker({
        position: LatLng,
        map: map,
        title: place.artistStatement,
        icon: Image
    });

    marker.setLabel(place.place_name);

    var picUrl = 'https://maps.googleapis.com/maps/api/streetview?size=640x300&location=' + place.latitude + ',' + place.longitude + '&fov=100&heading=' + place.googSV_heading + '&pitch=-5&key=AIzaSyDLA5kW1h_W6hv0G_cK3PnRcxR7LXGhA7M'
    
    var content = '<IMG BORDER="0" ALIGN="Left" SRC=' + picUrl + '>';

    marker.addListener('click', function(){showInfo(marker, content);});

    // Adds marker to array of markers
        
    markers.push(marker);
}

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update();
        }
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    // Sets markers to null

    for (var i=0; i<markers.length; i++){
        markers[i].setMap(null);    
    }
    // deletes markers array
    markers = [];
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    
    if (typeof(content) == "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='/static/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        // q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON(Flask.url_for("update"), parameters)
    .done(function(data, textStatus, jqXHR) {

      // remove old markers from map
      removeMarkers();

      // add new markers to map
      for (var i = 0; i < data.length; i++)
      {
          addMarker(data[i]);
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
};

/**
 * Add search bar to map.
 */

// function initAutocomplete() {

//     // Create the search box and link it to the UI element.
//     var input = document.getElementById('pac-input');
//     var searchBox = new google.maps.places.SearchBox(input);
//     map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);

//     // Bias the SearchBox results towards current map's viewport.
//     map.addListener('bounds_changed', function() {
//       searchBox.setBounds(map.getBounds());
//     });

//     // Listen for the event fired when the user selects a prediction and retrieve
//     // more details for that place.
//     searchBox.addListener('places_changed', function() {
//       var places = searchBox.getPlaces();

//       if (places.length == 0) {
//         return;
//       }
    
//     // Clear out the old markers.
//       markers.forEach(function(marker) {
//         marker.setMap(null);
//       });
//       markers = [];

//       // For each place, get the icon, name and location.
//       var bounds = new google.maps.LatLngBounds();
//       places.forEach(function(place) {
//         if (!place.geometry) {
//           console.log("Returned place contains no geometry");
//           return;
//         }
//         var icon = {
//           url: place.icon,
//           size: new google.maps.Size(71, 71),
//           origin: new google.maps.Point(0, 0),
//           anchor: new google.maps.Point(17, 34),
//           scaledSize: new google.maps.Size(25, 25)
//         };
    
//     // Create a marker for each place.
//         markers.push(new google.maps.Marker({
//           map: map,
//           icon: icon,
//           title: place.name,
//           position: place.geometry.location
//         }));

//         if (place.geometry.viewport) {
//           // Only geocodes have viewport.
//           bounds.union(place.geometry.viewport);
//         } else {
//           bounds.extend(place.geometry.location);
//         }
//       });
//       map.fitBounds(bounds);
//     });
//   }
    