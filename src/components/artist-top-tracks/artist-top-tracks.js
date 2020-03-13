import { ApiKey, PageSize } from '/src/utils/constants.js';

let topTracksList;
let totalTrackList;
let mbid;
let topTracksCurrentPage;
let tracks;

let prevButton;
let nextButton;
let currentPageElement;
let artistNameElement;
let artistImageElement;
let artistListenersElement;

function createTrackListItem(trackName, playCount, trackImage, rank) {
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

function updatePaginator(selectedPage) {
    topTracksCurrentPage = selectedPage;
    prevButton.disabled = topTracksCurrentPage === 1;
    nextButton.disabled = tracks.length === totalTrackList;

    currentPageElement.innerText = topTracksCurrentPage;
    sessionStorage.setItem('topTracksCurrentPage', topTracksCurrentPage);
}

async function setArtistDetails(urlMbid) {
    // Get the artist details from the cache
    let cachedData = sessionStorage.getItem('selectedArtist');
    const artistDetails = JSON.parse(cachedData);

    artistNameElement.innerText = artistDetails.name;
    artistImageElement.src = artistDetails.imageUrl;
    artistListenersElement.innerText = `${artistDetails.listeners} listeners`;
}

function setTotalTrackList(attr) {
    totalTrackList = attr.total;
}

async function getTopTracks(mbid, selectedPage) {
    try {
        let data;
        if (!tracks) {
            // Get top 50 tracks
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&mbid=${mbid}&api_key=${ApiKey}&format=json`
            );

            const jsonData = await data.json();
            tracks = jsonData.toptracks.track;
            setTotalTrackList(jsonData.toptracks['@attr']);
        }

        const pageStart = PageSize * (selectedPage - 1);
        const pageEnd = pageStart + PageSize;

        // if the page is more than the data we have
        // then request new data
        if (pageEnd > tracks.length) {
            data = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&mbid=${mbid}&api_key=${ApiKey}&format=json&limit=${tracks.length +
                    50}`
            );
            const jsonData = await data.json();
            tracks = jsonData.toptracks.track;
            setTotalTrackList(jsonData.toptracks['@attr']);
        }

        topTracksList.innerHTML = '';
        for (let i = pageStart; i < pageEnd; i++) {
            const track = tracks[i];
            const trackImage = track.image[1]['#text'];

            const rank = i + 1;

            topTracksList.appendChild(
                createTrackListItem(
                    track.name,
                    track.playcount,
                    trackImage,
                    rank
                )
            );
        }

        await setArtistDetails(mbid);
        updatePaginator(selectedPage);
    } catch (e) {
        console.error(e);
    }
}

function next() {
    getTopTracks(mbid, topTracksCurrentPage + 1);
}

function prev() {
    getTopTracks(mbid, topTracksCurrentPage - 1);
}

const ArtistTopTracks = {
    constructor: async () => {
        const htmlPage = await fetch(
            'components/artist-top-tracks/artist-top-tracks.html'
        );
        const html = await htmlPage.text();

        return html;
    },
    init: async () => {
        topTracksCurrentPage = 1;
        topTracksList = document.getElementById('top-tracks-list');
        prevButton = document.getElementById('prev-button');
        nextButton = document.getElementById('next-button');
        currentPageElement = document.getElementById('current-page');
        artistNameElement = document.getElementById('artist-name');
        artistImageElement = document.getElementById('artist-image');
        artistListenersElement = document.getElementById('artist-listeners');

        prevButton.addEventListener('click', e => {
            e.preventDefault();
            prev();
        });
        nextButton.addEventListener('click', e => {
            e.preventDefault();
            next();
        });

        // get mbid from url
        const url = location.hash.slice(1).toLowerCase() || '/';
        const r = url.split('/');
        mbid = r[2];

        // Check session storage for the page
        if (sessionStorage.getItem('topTracksCurrentPage'))
            topTracksCurrentPage = JSON.parse(
                sessionStorage.getItem('topTracksCurrentPage')
            );
        getTopTracks(mbid, topTracksCurrentPage);
    }
};

export default ArtistTopTracks;
