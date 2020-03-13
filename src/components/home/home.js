'use strict';

import { ApiKey, PageSize } from '/utils/constants.js';

let topArtistsListElements;
let countryTitle;
let limit;
let totalArtistsCount;
let topArtistsList;

let prevButton;
let nextButton;
let currentPageElement;

let topArtistsCurrentPage;
let currentCountry;
let totalPages;

function createArtistListItem(
    artistName,
    artistImage,
    artistListeners,
    rank,
    artistMbid
) {
    const listElement = document.createElement('li');
    listElement.innerHTML = `
        <div class='card artist-details-card'>
            <h2 class='artist-rank'>#${rank}</h2>
            <div class='artist-details'>
                <h2>${artistName}</h2>
                <div class='listeners'>${artistListeners} listeners</div>   
            </div>
            <a href='#/artists/${artistMbid}' class='artist-image-link'>
                <img src='${artistImage}' alt='${artistName} image' class='artist-image'>
            </a>
        </div>
    `;

    return listElement;
}

function setCountryTitle() {
    countryTitle.innerText = currentCountry;
}

function addOnClickListener(
    artistListItem,
    artistMbid,
    artistName,
    artistImageUrl,
    artistListeners
) {
    const artistDetails = {
        mbid: artistMbid,
        name: artistName,
        imageUrl: artistImageUrl,
        listeners: artistListeners
    };
    artistListItem.addEventListener('click', () => {
        sessionStorage.setItem('selectedArtist', JSON.stringify(artistDetails));
    });
}

function setTotalArtistCount(attr) {
    totalArtistsCount = attr.total;
}

// get the data from the json file
async function getArtists(country, selectedPage) {
    try {
        currentCountry = country;
        // cache the selected country
        sessionStorage.setItem('selectedCountry', JSON.stringify(country));

        let data;

        if (!topArtistsList) {
            // Get top 50 artists
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${country}&api_key=${ApiKey}&format=json&limit=${limit}`
            );

            const jsonData = await data.json();
            topArtistsList = jsonData.topartists.artist;
            setTotalArtistCount(jsonData.topartists['@attr']);
        }

        const pageStart = PageSize * (selectedPage - 1);
        const pageEnd = pageStart + PageSize;

        // if the page is more than the data we have
        // then request new data
        if (pageEnd > topArtistsList.length) {
            // fetch the next 50 results
            const apiPage = (topArtistsList.length + limit) / 50;
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${country}&api_key=${ApiKey}&format=json&limit=${limit}&page=${apiPage}`
            );
            const jsonData = await data.json();
            topArtistsList = topArtistsList.concat(jsonData.topartists.artist);
            setTotalArtistCount(jsonData.topartists['@attr']);
        }

        // Reset the list to blank
        topArtistsListElements.innerHTML = '';

        // Create a list item for each artists
        for (let i = pageStart; i < pageEnd; i++) {
            // Get artist
            const artist = topArtistsList[i];
            // Get the medium image
            const artistImage = artist.image[1]['#text'];

            const rank = i + 1;

            const artistListItem = createArtistListItem(
                artist.name,
                artistImage,
                artist.listeners,
                rank,
                artist.mbid
            );
            topArtistsListElements.appendChild(artistListItem);

            // Save the large image to the storage
            addOnClickListener(
                artistListItem,
                artist.mbid,
                artist.name,
                artist.image[2]['#text'],
                artist.listeners
            );
        }

        setCountryTitle(country);
        updatePaginator(selectedPage);
    } catch (e) {
        console.error(e);
    }
}

function next() {
    getArtists(currentCountry, topArtistsCurrentPage + 1);
}

function prev() {
    getArtists(currentCountry, topArtistsCurrentPage - 1);
}

function updatePaginator(selectedPage) {
    topArtistsCurrentPage = selectedPage;
    prevButton.disabled = topArtistsCurrentPage === 1;
    nextButton.disabled = topArtistsCurrentPage === totalPages;

    currentPageElement.innerText = topArtistsCurrentPage;
    sessionStorage.setItem('topArtistsCurrentPage', topArtistsCurrentPage);
}

const Home = {
    constructor: async () => {
        // Get the view
        const htmlPage = await fetch('components/home/home.html');
        const html = await htmlPage.text();

        return html;
    },
    init: async () => {
        topArtistsListElements = document.getElementById('top-artists-list');
        countryTitle = document.getElementById('country-title');

        prevButton = document.getElementById('prev-button');
        nextButton = document.getElementById('next-button');
        currentPageElement = document.getElementById('current-page');

        prevButton.addEventListener('click', e => {
            e.preventDefault();
            prev();
        });
        nextButton.addEventListener('click', e => {
            e.preventDefault();
            next();
        });
        document
            .getElementById('search-button')
            .addEventListener('click', e => {
                e.preventDefault();
                const country = document.querySelector('[name="countryInput"]')
                    .value;
                limit = 50;
                topArtistsList = null;
                getArtists(country, 1);
            });

        topArtistsCurrentPage = 1;
        limit = 50;
        currentCountry = 'Australia';
        totalPages;

        // Check session storage for the page
        if (sessionStorage.getItem('topArtistsCurrentPage'))
            topArtistsCurrentPage = JSON.parse(
                sessionStorage.getItem('topArtistsCurrentPage')
            );

        // Check session storage for the page
        if (sessionStorage.getItem('selectedCountry'))
            currentCountry = JSON.parse(
                sessionStorage.getItem('selectedCountry')
            );

        getArtists(currentCountry, topArtistsCurrentPage);

        // Reset the page for the artists top tracks
        sessionStorage.removeItem('topTracksCurrentPage');
    }
};

export default Home;
