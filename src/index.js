function routeHome() {
    sessionStorage.removeItem('topArtistsCurrentPage');
    sessionStorage.removeItem('selectedCountry');

    location.hash = 'home';
}