'use strict';

import { ApiKey, PageSize } from '/src/utils/constants.js';

const Home = {
    topArtistsListElements: null,
    countryTitle: null,
    limit: null,
    totalArtistsCount: null,
    topArtistsList: null,
    prevButton: null,
    nextButton: null,
    currentPageElement: null,
    topArtistsCurrentPage: null,
    currentCountry: null,
    totalPages: null,
    searchErrorElement: null,
    constructor: async function() {
        // Get the view
        const htmlPage = await fetch('components/home/home.html');
        const html = await htmlPage.text();

        return html;
    },
    initProperties: function() {
        this.topArtistsListElements = document.getElementById(
            'top-artists-list'
        );
        this.countryTitle = document.getElementById('country-title');
        this.limit = 50;
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.currentPageElement = document.getElementById('current-page');
        this.searchErrorElement = document.getElementById('search-error');

        this.topArtistsCurrentPage = 1;
        this.currentCountry = 'Australia';
    },
    init: async function() {
        this.initProperties();
        this.prevButton.addEventListener('click', e => {
            e.preventDefault();
            this.prev();
        });
        this.nextButton.addEventListener('click', e => {
            e.preventDefault();
            this.next();
        });

        document
            .getElementById('search-button')
            .addEventListener('click', e => {
                e.preventDefault();
                const country = document.querySelector('[name="countryInput"]')
                    .value;
                this.topArtistsList = null;
                this.getArtists(country, 1);
            });

        // Check session storage for the page
        if (sessionStorage.getItem('topArtistsCurrentPage'))
            this.topArtistsCurrentPage = JSON.parse(
                sessionStorage.getItem('topArtistsCurrentPage')
            );

        // Check session storage for the page
        if (sessionStorage.getItem('selectedCountry'))
            this.currentCountry = JSON.parse(
                sessionStorage.getItem('selectedCountry')
            );

        this.getArtists(this.currentCountry, this.topArtistsCurrentPage);

        // Reset the page for the artists top tracks
        sessionStorage.removeItem('topTracksCurrentPage');
    },
    next: function() {
        this.getArtists(this.currentCountry, this.topArtistsCurrentPage + 1);
    },
    prev: function() {
        this.getArtists(this.currentCountry, this.topArtistsCurrentPage - 1);
    },
    updatePaginator: function(selectedPage) {
        this.topArtistsCurrentPage = selectedPage;
        this.prevButton.disabled = this.topArtistsCurrentPage === 1;
        this.nextButton.disabled =
            this.topArtistsCurrentPage === this.totalPages;

        this.currentPageElement.innerText = this.topArtistsCurrentPage;
        sessionStorage.setItem(
            'topArtistsCurrentPage',
            this.topArtistsCurrentPage
        );
    },
    getArtistsFromApi: async function(country, pageEnd) {
        let data;
        let newRequestNeeded;

        if (!this.topArtistsList) {
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${country}&api_key=${ApiKey}&format=json&limit=${this.limit}`
            );
        } else if (pageEnd > this.topArtistsList.length) {
            newRequestNeeded = true;
            // if the page is more than the data we have
            // then fetch the next 50 results
            const apiPage = (this.topArtistsList.length + this.limit) / 50;
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=${country}&api_key=${ApiKey}&format=json&limit=${this.limit}&page=${apiPage}`
            );
        } 
        // If the top artists list is populated
        // and we don't need more data
        // then we don't need the extra processing
        else return;

        const jsonData = await data.json();

        // Check if there are api errors
        if (jsonData.error) {
            switch (jsonData.error) {
                case 6:
                    this.searchErrorElement.innerText =
                        'Please enter a valid country';
                    break;
                case 11:
                    this.searchErrorElement.innerText =
                        'Service is temporarily offline. Please try again later.';
                    break;
                case 29:
                    this.searchErrorElement.innerText =
                        'Too many requests. Please try again later.';
                    break;
            }
            throw jsonData.message;
        }

        this.searchErrorElement.innerText = '';
        this.topArtistsList = newRequestNeeded
            ? this.topArtistsList.concat(jsonData.topartists.artist)
            : jsonData.topartists.artist;
        this.setTotalArtistCount(jsonData.topartists['@attr']);
    },
    getArtists: async function(country, selectedPage) {
        try {
            const pageStart = PageSize * (selectedPage - 1);
            const pageEnd = pageStart + PageSize;
            await this.getArtistsFromApi(country, pageEnd);
            // Reset the list to blank
            this.topArtistsListElements.innerHTML = '';

            // Create a list item for each artists
            for (let i = pageStart; i < pageEnd; i++) {
                // Get artist
                const artist = this.topArtistsList[i];
                // Get the medium image
                const artistImage = artist.image[1]['#text'];

                const rank = i + 1;

                const artistListItem = this.createArtistListItem(
                    artist.name,
                    artistImage,
                    artist.listeners,
                    rank,
                    artist.mbid
                );
                this.topArtistsListElements.appendChild(artistListItem);

                // Save the large image to the storage
                this.addOnClickListener(
                    artistListItem,
                    artist.mbid,
                    artist.name,
                    artist.image[2]['#text'],
                    artist.listeners
                );
            }

            this.currentCountry = country;
            // cache the selected country
            sessionStorage.setItem('selectedCountry', JSON.stringify(country));
            this.setCountryTitle(country);
            this.updatePaginator(selectedPage);
        } catch (e) {
            console.error(e);
        }
    },
    setTotalArtistCount: function(attr) {
        this.totalArtistsCount = attr.total;
    },
    addOnClickListener: function(
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
            sessionStorage.setItem(
                'selectedArtist',
                JSON.stringify(artistDetails)
            );
        });
    },
    setCountryTitle: function() {
        this.countryTitle.innerText = this.currentCountry;
    },
    createArtistListItem: function(
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
};

export default Home;
