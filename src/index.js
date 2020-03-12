'use strict';

const apiKey = '24deab2c47494e5a9e23cb06975282ea';
const pageSize = 5;
const topArtistsList = document.getElementById('top-artists-list');
const paginator = document.getElementsByTagName('fm-paginator')[0];
const countryTitle = document.getElementById('country-title');

const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const currentPageElement = document.getElementById('current-page');

let currentPage = 1;
let currentCountry = 'Australia';
let totalPages;

function createArtistListItem(artistName, artistImage, artistListeners, rank) {
    const listElement = document.createElement('li');
    listElement.innerHTML = `
        <div class='card artist-details-card'>
            <h2 class='artist-rank'>#${rank}</h2>
            <div class='artist-details'>
                <h2>${artistName}</h2>
                <div class='listeners'>${artistListeners} listeners</div>   
            </div>
            <img src='${artistImage}' alt='${artistName} image' class='artist-image'>     
        </div>
    `;

    return listElement;
}

function setCountryTitle() {
    countryTitle.innerText = currentCountry;
}

// get the data from the json file
async function getArtists(country, selectedPage) {
    try {
        currentCountry = country;
        setCountryTitle(country);
        updatePaginator(selectedPage);

        let data;
        let jsonData;

        //check session storage
        const sessionStorageKey = `${country}-${selectedPage}`;
        if (sessionStorage.getItem(sessionStorageKey)) {
            jsonData = JSON.parse(sessionStorage.getItem(sessionStorageKey));
        } else {
            if (country.toLowerCase() === 'Australia'.toLocaleLowerCase())
                data = await fetch('./data.json');
            else
                data = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${country}&api_key=${apiKey}&format=json&limit=${pageSize}&page=${selectedPage}`
                );
            jsonData = await data.json();
            sessionStorage.setItem(sessionStorageKey, JSON.stringify(jsonData));
        }

        const artists = jsonData.topartists.artist;

        // Reset the list to blank
        topArtistsList.innerHTML = '';
        const pageEnd = pageSize * selectedPage;
        const pageStart = pageSize * (selectedPage - 1);
        // Create a table row for each artists
        for (let i = 0; i < pageSize; i++) {
            // Get artist
            const artist = artists[i];
            // Get the medium image
            const artistImage = artist.image[1]['#text'];
            
            let rank;
            if (selectedPage === 1) rank = i + 1;
            else rank = (pageSize * (selectedPage - 1)) + i;

            topArtistsList.appendChild(
                createArtistListItem(artist.name, artistImage, artist.listeners, rank)
            );
        }

        // Set the pagination
        const highLevelData = jsonData.topartists['@attr'];
        if (!totalPages) {
            totalPages = highLevelData.totalPages;
            console.log(totalPages);
        }
    } catch (e) {
        console.error(e);
    }
}

function next() {
    getArtists(currentCountry, currentPage + 1);
}

function prev() {
    getArtists(currentCountry, currentPage - 1);
}

function updatePaginator(selectedPage) {
    currentPage = selectedPage;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentCountry === totalPages;

    currentPageElement.innerText = currentPage;
    sessionStorage.setItem('currentPage', currentPage);
}

function init() {
    // Check session storage for the page
    if (sessionStorage.getItem('currentPage'))
        currentPage = JSON.parse(sessionStorage.getItem('currentPage'));

    getArtists(currentCountry, currentPage);
}

init();
