import { ApiKey, PageSize } from '/src/utils/constants.js';

const ArtistTopTracks = {
    topTracksList: null,
    totalTrackList: null,
    mbid: null,
    topTracksCurrentPage: null,
    tracks: null,
    prevButton: null,
    nextButton: null,
    currentPageElement: null,
    artistNameElement: null,
    artistImageElement: null,
    artistListenersElement: null,
    constructor: async function() {
        const htmlPage = await fetch(
            'components/artist-top-tracks/artist-top-tracks.html'
        );
        const html = await htmlPage.text();

        return html;
    },
    initProperties: function() {
        this.topTracksList = document.getElementById('top-tracks-list');
        this.topTracksCurrentPage = 1;
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.currentPageElement = document.getElementById('current-page');
        this.artistNameElement = document.getElementById('artist-name');
        this.artistImageElement = document.getElementById('artist-image');
        this.artistListenersElement = document.getElementById('artist-listeners');
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

        // get mbid from url
        this.getMbidFromUrl();

        // Check session storage for the page
        if (sessionStorage.getItem('topTracksCurrentPage'))
            this.topTracksCurrentPage = JSON.parse(
                sessionStorage.getItem('topTracksCurrentPage')
            );
        this.getTopTracks(this.mbid, this.topTracksCurrentPage);
    },
    getMbidFromUrl: function() {
        const url = location.hash.slice(1).toLowerCase() || '/';
        const r = url.split('/');
        this.mbid = r[2];
    },
    getTopTracks: async function(mbid, selectedPage) {
        try {
            let data;
            if (!this.tracks) {
                // Get top 50 tracks
                data = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&mbid=${mbid}&api_key=${ApiKey}&format=json`
                );
    
                const jsonData = await data.json();
                this.tracks = jsonData.toptracks.track;
                this.setTotalTrackList(jsonData.toptracks['@attr']);
            }
    
            const pageStart = PageSize * (selectedPage - 1);
            const pageEnd = pageStart + PageSize;
    
            // if the page is more than the data we have
            // then request new data
            if (pageEnd > this.tracks.length) {
                data = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&mbid=${mbid}&api_key=${ApiKey}&format=json&limit=${this.tracks.length +
                        50}`
                );
                const jsonData = await data.json();
                this.tracks = jsonData.toptracks.track;
                this.setTotalTrackList(jsonData.toptracks['@attr']);
            }
    
            this.topTracksList.innerHTML = '';
            for (let i = pageStart; i < pageEnd; i++) {
                const track = this.tracks[i];
                const trackImage = track.image[1]['#text'];
    
                const rank = i + 1;
    
                this.topTracksList.appendChild(
                    this.createTrackListItem(
                        track.name,
                        track.playcount,
                        trackImage,
                        rank
                    )
                );
            }
    
            await this.setArtistDetails(mbid);
            this.updatePaginator(selectedPage);
        } catch (e) {
            console.error(e);
        }
    },
    setTotalTrackList: function(attr) { this.totalTrackList = attr.total },
    next: function() { this.getTopTracks(this.mbid, this.topTracksCurrentPage + 1); },  
    prev: function() { this.getTopTracks(this.mbid, this.topTracksCurrentPage - 1); },
    updatePaginator: function(selectedPage) {
        this.topTracksCurrentPage = selectedPage;
        this.prevButton.disabled = this.topTracksCurrentPage === 1;
        this.nextButton.disabled = this.tracks.length === this.totalTrackList;
    
        this.currentPageElement.innerText = this.topTracksCurrentPage;
        sessionStorage.setItem('topTracksCurrentPage', this.topTracksCurrentPage);
    },
    setArtistDetails: async function() {
        // Get the artist details from the cache
        let cachedData = sessionStorage.getItem('selectedArtist');
        const artistDetails = JSON.parse(cachedData);
    
        this.artistNameElement.innerText = artistDetails.name;
        this.artistImageElement.src = artistDetails.imageUrl;
        this.artistListenersElement.innerText = `${artistDetails.listeners} listeners`;
    },
    createTrackListItem: function(trackName, playCount, trackImage, rank) {
        const listElement = document.createElement('li');
        listElement.innerHTML = `
            <div class='card track-card'>
                <h2 class='track-rank'>#${rank}</h2>
                <div class='track-details'>
                    <h2 class='track-name'>${trackName}</h2>
                    <div class='play-count'>${playCount} plays</div>   
                </div>
                <img src='${trackImage}' alt='${trackName} image' class='track-image'>
            </div>
        `;
    
        return listElement;
    }
};

export default ArtistTopTracks;
