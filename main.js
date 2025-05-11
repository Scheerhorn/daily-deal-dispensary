// 1️⃣ Import the Supabase client from the CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 2️⃣ Initialize with your own values
const SUPABASE_URL = 'https://yweyhssxlblrvdfzvwfc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXloc3N4bGJscnZkZnp2d2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MjMzODEsImV4cCI6MjA2MjM5OTM4MX0.fr6TPiK50Qdw0CNogv_N0bUyvwXOutBlRR3VZrpFT6U'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
})

function getDistanceMiles(lat1, lon1, lat2, lon2) {
    const toRad = d => d * (Math.PI/180)
    const R = 6371  // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 0.621371  // km → miles
}

async function loadDeals() {
    // ➋ figure out today’s weekday
    const today = new Date()
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase()

    // ➌ get user location (may throw if denied)
    let userLat, userLon
    try {
        const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej)
        );  // ← semicolon needed here
    
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        } catch (err) {
        console.warn('Location unavailable, skipping sort:', err);
        }

    // ➍ fetch today’s deals + coords
    const { data: deals, error } = await supabase
        .from('deals')
        .select('deal_text, store_name, lat, long')
        .eq('weekday', today)

    if (error) {
        console.error('Error fetching deals:', error)
        return
    }

    // ➎ if we have coords, compute & sort by distance
    const sorted = (userLat != null && userLon != null)
        ? deals
            .map(d => ({
            ...d,
            _dist: getDistanceMiles(userLat, userLon, d.lat, d.long)
            }))
            .sort((a, b) => a._dist - b._dist)
        : deals

    renderDeals(sorted)
}

function renderDeals(deals) {
    const ul = document.getElementById('deals-list')
    ul.innerHTML = deals.length
        ? deals
            .map(d => {
            // if we have a distance, format it
            const distLabel = d._dist != null
                ? ` (${d._dist.toFixed(1)} mi away)`
                : ''
            return `<li>${d.deal_text} — ${d.store_name}${distLabel}</li>`
            })
            .join('')
        : '<li>No deals for today.</li>'
}

loadDeals()

function displayCurrentDate() {
    const dateElement = document.getElementById("currentDate");
    
    // Get the current date
    const now = new Date();
    
    // Array of days to get the correct day name
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Format the date
    const dayName = days[now.getDay()];
    const formattedDate = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    // Display the result
    dateElement.textContent = `${dayName}, ${formattedDate}`;
}

// Run the function when the page loads
window.onload = displayCurrentDate;

document.getElementById('currentDay').textContent = `Deals for ${dayNames[today]}`;

