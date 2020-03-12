'use strict';
import Home from './components/home/home.js';
import ArtistTopTracks from './components/artist-top-tracks/artist-top-tracks.js';

const routes = {
    '/': Home,
    '/artists/:id': ArtistTopTracks
};

function getRoute() {
    // Use the hash as the root
    const url = location.hash.slice(1).toLowerCase();
    const r = url.split('/');

    // Figure out the route 
    const resource = r[1] ? r[1] : '';
    const id = r[2] ? '/:id' : '';

    return `/${resource}${id}`;
}

const router = async () => {
    // Lazy load view element:
    const content = null || document.getElementById('container');

    const route = getRoute();

    // Get the associated page for the route
    const page = routes[route];
    content.innerHTML = await page.constructor();
    await page.init();
};

// Run the router every time the url changes
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
