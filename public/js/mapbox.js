export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYXRlbmEtZCIsImEiOiJjbGY4N3BnajMwMjh3M3lwY3o1eTc4cGRtIn0.VBAJ2lJtbuGOqmWhEjf63w';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/atena-d/clf8f778q00e201qazb17y97z',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach(loc => {
    const el = document.createElement('div')
    el.className = 'marker'

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map)

    // Add a popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}<p>`)
      .addTo(map)

    // Extend the map bounds to include current location
    bounds.extend(loc.coordinates)

    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    })
  })
}

