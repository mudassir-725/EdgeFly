// ========== FRONTEND TEST ==========
// JS(EdgeFly API Suite v1.7.js)

// Check amadeus test:
EdgeApi.amadeusTest().then(console.log).catch(console.error)

// Register / Login / ME (then token is stored automatically on successful login):
// 1. Register:
EdgeApi.register({ email: 'you@example.com', password: 'Secret123' }).then(console.log)
// 2. Login:
EdgeApi.login({ email: 'you@example.com', password: 'Secret123' }).then(console.log)
// 3. ME:
EdgeApi.getMe().then(console.log)

// Flight search (Guest):
EdgeApi.searchFlightsGuest({ "origin": "LHR", "destination": "JFK", "departureDate": "2025-10-25", "returnDate": "2025-10-31", "travelClass": "ECONOMY", "passengers": 1 }).then(console.log)

// Flight search (User — will also be saved to history when logged in):
EdgeApi.searchFlightsUser({ "origin": "LHR", "destination": "JFK", "departureDate": "2025-10-25", "returnDate": "2025-10-31", "travelClass": "ECONOMY", "passengers": 1 }).then(console.log)

// Ask ELI (user, requires login):
EdgeApi.askAgentUser("Find best flight from Madrid to New York on 29/10/205").then(console.log)

// Ask ELI (guest fallback):
EdgeApi.askAgentGuest("Find best flight from Madrid to New York on 29/10/205").then(console.log)

// Wishlist:
// 1. add
EdgeApi.wishlistAdd({ origin: 'LHR', destination: 'DXB', departureDate: '2025-11-20', price: 400, airline: 'EK' }).then(console.log)
// 2. get
EdgeApi.wishlistGet().then(console.log)
// 3. delete
EdgeApi.wishlistDelete(12).then(console.log)

// Dashboard
EdgeApi.getDashboard().then(console.log)

// Search History
EdgeApi.getSearchHistory().then(console.log)

// Recommendations
EdgeApi.getRecommendations().then(console.log)