        // DOM elements
        const tripForm = document.getElementById('trip-form');
        const destinationInput = document.getElementById('destination');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const tripsList = document.getElementById('trips-list');
        const formError = document.getElementById('form-error');
        const loadingTrips = document.getElementById('loading-trips');
        const currentWeather = document.getElementById('current-weather');
        const weatherDetails = document.getElementById('weather-details');

        // Set default dates (today and tomorrow)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        startDateInput.valueAsDate = today;
        endDateInput.valueAsDate = tomorrow;
        
        // Load trips from LocalStorage on page load
        document.addEventListener('DOMContentLoaded', loadTrips);
        
        // Form submission handler
        tripForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous errors
            formError.style.display = 'none';
            
            // Get form values
            const destination = destinationInput.value.trim();
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            // Validate form
            if (!destination) {
                showError('Please enter a destination');
                return;
            }
            
            if (!startDate || !endDate) {
                showError('Please select both start and end dates');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                showError('End date must be after start date');
                return;
            }
            
            // Show loading state
            const addBtn = document.getElementById('add-trip-btn');
            const originalText = addBtn.innerHTML;
            addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching weather...';
            addBtn.disabled = true;
            
            try {
                // Fetch weather data for the destination
                const weatherData = await fetchWeatherData(destination);
                
                // Create trip object
                const trip = {
                    id: Date.now(), // Simple ID generation
                    destination,
                    startDate,
                    endDate,
                    weather: weatherData,
                    createdAt: new Date().toISOString()
                };
                
                // Save trip to LocalStorage
                saveTrip(trip);
                
                // Add trip to UI
                addTripToUI(trip);
                
                // Show current weather
                showCurrentWeather(weatherData);
                
                // Reset form
                tripForm.reset();
                startDateInput.valueAsDate = today;
                endDateInput.valueAsDate = tomorrow;
                
            } catch (error) {
                console.error('Error adding trip:', error);
                showError('Failed to fetch weather data. Please try again.');
            } finally {
                // Reset button
                addBtn.innerHTML = originalText;
                addBtn.disabled = false;
            }
        });
        
        // Function to fetch weather data from JSONPlaceholder
        async function fetchWeatherData(destination) {
            // Using JSONPlaceholder to simulate weather API
            // In a real app, you would use a real weather API like OpenWeatherMap
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify({
                    destination: destination,
                    requestId: Date.now()
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const data = await response.json();
            
            // Generate simulated weather data based on destination and current month
            return generateWeatherData(destination, data.id);
        }
        
        // Function to generate simulated weather data
        function generateWeatherData(destination, seed) {
            const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            
            // Use seed for pseudo-random but consistent results
            const tempBase = 15 + (seed % 20); // 15-35°C
            const conditionIndex = seed % conditions.length;
            
            return {
                condition: conditions[conditionIndex],
                temperature: tempBase + (conditionIndex * 2),
                humidity: 30 + (seed % 50),
                windSpeed: 1 + (seed % 20),
                precipitation: conditionIndex > 2 ? (seed % 90) : (seed % 30),
                forecast: [
                    { day: 'Today', high: tempBase + 5, low: tempBase - 5, condition: conditions[conditionIndex] },
                    { day: 'Tomorrow', high: tempBase + 3, low: tempBase - 3, condition: conditions[(conditionIndex + 1) % conditions.length] },
                    { day: months[(currentMonth + 2) % 12], high: tempBase + 1, low: tempBase - 7, condition: conditions[(conditionIndex + 2) % conditions.length] }
                ]
            };
        }
        
        // Function to save trip to LocalStorage
        function saveTrip(trip) {
            let trips = getTripsFromStorage();
            trips.push(trip);
            localStorage.setItem('trips', JSON.stringify(trips));
        }
        
        // Function to get trips from LocalStorage
        function getTripsFromStorage() {
            const tripsJSON = localStorage.getItem('trips');
            return tripsJSON ? JSON.parse(tripsJSON) : [];
        }
        
        // Function to load trips from LocalStorage and display them
        function loadTrips() {
            const trips = getTripsFromStorage();
            
            // Hide loading message
            loadingTrips.style.display = 'none';
            
            if (trips.length === 0) {
                tripsList.innerHTML = `
                    <div class="empty-trips">
                        <i class="fas fa-suitcase"></i>
                        <h3>No trips planned yet</h3>
                        <p>Add your first trip using the form on the left!</p>
                    </div>
                `;
                return;
            }
            
            // Clear trips list
            tripsList.innerHTML = '';
            
            // Add each trip to UI
            trips.forEach(trip => addTripToUI(trip));
        }
        
        // Function to add a trip to the UI
        function addTripToUI(trip) {
            // Remove empty message if present
            const emptyMessage = document.querySelector('.empty-trips');
            if (emptyMessage) emptyMessage.remove();
            
            // Format dates
            const startDateFormatted = new Date(trip.startDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const endDateFormatted = new Date(trip.endDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Create trip card
            const tripCard = document.createElement('div');
            tripCard.className = 'trip-card';
            tripCard.setAttribute('data-id', trip.id);
            
            // Determine weather icon based on condition
            const weatherIcon = getWeatherIcon(trip.weather.condition);
            
            tripCard.innerHTML = `
                <div class="trip-header">
                    <div class="trip-destination">${trip.destination}</div>
                    <button class="delete-btn" onclick="deleteTrip(${trip.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <div class="trip-dates">
                    <i class="far fa-calendar"></i> ${startDateFormatted} to ${endDateFormatted}
                </div>
                <div class="trip-weather">
                    <div class="weather-header">
                        <div class="weather-condition">
                            <i class="${weatherIcon}"></i> ${trip.weather.condition}, ${trip.weather.temperature}°C
                        </div>
                        <button class="weather-btn" onclick="showTripWeather(${trip.id})">
                            <i class="fas fa-cloud-sun"></i> Details
                        </button>
                    </div>
                    <div class="weather-details" id="weather-details-${trip.id}" style="display: none;">
                        ${generateWeatherDetailsHTML(trip.weather)}
                    </div>
                </div>
            `;
            
            // Add to the beginning of the list (most recent first)
            tripsList.prepend(tripCard);
        }
        
        // Function to get appropriate weather icon
        function getWeatherIcon(condition) {
            switch(condition.toLowerCase()) {
                case 'sunny': return 'fas fa-sun';
                case 'partly cloudy': return 'fas fa-cloud-sun';
                case 'cloudy': return 'fas fa-cloud';
                case 'rainy': return 'fas fa-cloud-rain';
                case 'stormy': return 'fas fa-bolt';
                case 'snowy': return 'fas fa-snowflake';
                default: return 'fas fa-cloud';
            }
        }
        
        // Function to generate weather details HTML
        function generateWeatherDetailsHTML(weather) {
            let forecastHTML = '';
            weather.forecast.forEach(day => {
                forecastHTML += `
                    <div class="weather-detail">
                        <span>${day.day}</span>
                        <span>${day.high}° / ${day.low}° - ${day.condition}</span>
                    </div>
                `;
            });
            
            return `
                <div class="weather-detail">
                    <span>Temperature</span>
                    <span>${weather.temperature}°C</span>
                </div>
                <div class="weather-detail">
                    <span>Humidity</span>
                    <span>${weather.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span>Wind Speed</span>
                    <span>${weather.windSpeed} km/h</span>
                </div>
                <div class="weather-detail">
                    <span>Precipitation</span>
                    <span>${weather.precipitation}%</span>
                </div>
                <div style="grid-column: span 2; margin-top: 10px; font-weight: 600;">3-Day Forecast:</div>
                ${forecastHTML}
            `;
        }
        
        // Function to delete a trip
        function deleteTrip(tripId) {
            // Remove from LocalStorage
            let trips = getTripsFromStorage();
            trips = trips.filter(trip => trip.id !== tripId);
            localStorage.setItem('trips', JSON.stringify(trips));
            
            // Remove from UI
            const tripCard = document.querySelector(`[data-id="${tripId}"]`);
            if (tripCard) tripCard.remove();
            
            // Show empty message if no trips left
            if (trips.length === 0) {
                loadTrips();
            }
        }
        
        // Function to show weather details for a trip
        function showTripWeather(tripId) {
            const weatherDetails = document.getElementById(`weather-details-${tripId}`);
            const isVisible = weatherDetails.style.display === 'block';
            
            // Toggle visibility
            weatherDetails.style.display = isVisible ? 'none' : 'block';
        }
        
        // Function to show current weather in the form section
        function showCurrentWeather(weatherData) {
            currentWeather.style.display = 'block';
            weatherDetails.innerHTML = `
                <div class="weather-condition" style="font-size: 1.2rem; margin-bottom: 15px;">
                    <i class="${getWeatherIcon(weatherData.condition)}"></i> 
                    ${weatherData.condition}, ${weatherData.temperature}°C
                </div>
                <div class="weather-details">
                    ${generateWeatherDetailsHTML(weatherData)}
                </div>
            `;
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                currentWeather.style.display = 'none';
            }, 10000);
        }
        
        // Function to show error messages
        function showError(message) {
            formError.textContent = message;
            formError.style.display = 'block';
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                formError.style.display = 'none';
            }, 5000);
        }