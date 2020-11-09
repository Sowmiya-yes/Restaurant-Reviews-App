let restaurant;
var newMap;

/*
*service worker registration
*/

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
  .register('/sw.js', {scope: "/"})
    .then(reg => {
      console.log('Service Worker Registration Successful: ');
    })
    .catch(error => {
      console.log('Service Worker Registration Failed: ' + error);
    });
}


/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic293bWl5YTA3IiwiYSI6ImNqaWlncXA1dDAxeXMza282amNoNmxpYWwifQ.agqacoaXXdIOUhxxL8zvYg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a tabindex="-1" href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.tabIndex = 0;
  name.innerHTML = `<i class="material-icons">restaurant_menu</i> `+restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.tabIndex = 0;
  address.innerHTML = `<i class="material-icons">room</i>`+restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.tabIndex = 0;
  image.alt =  'Image showing the view of '+restaurant.name+' restaurant';
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.tabIndex = 0;
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.tabIndex="0";
  hours.setAttribute('aria-label','Restaurant Operating hours')
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.tabIndex="0";
    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.setAttribute('aria-label','Following are the list of reviews')
  container.appendChild(title);
  DBHelper.fetchReviewsById(self.restaurant.id)
  .then(reviews =>{
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      noReviews.tabIndex = 0;
      container.appendChild(noReviews);
      return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
});
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.tabIndex = 0;
  name.innerHTML = `<i class="material-icons">perm_identity</i> `+review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.tabIndex = 0;
  const updatedDate = new Date(review.updatedAt); 
  date.innerHTML = `<i class="material-icons">calendar_today</i> `+updatedDate.toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`+`<i class="material-icons">star</i>`;
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = 0;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

addReview = () => {
  var name = document.getElementById('formName').value;
  var rate = document.getElementById('formRating').value;
  var comment = document.getElementById('formComment').value;
  var resId = self.restaurant.id;
  DBHelper.addReviewTo(name, rate, comment, resId);
  formName.value = '';
  formRating.value = '';
  formComment.value = '';
}