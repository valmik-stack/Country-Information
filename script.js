/**
 * SELECTING DOM ELEMENTS
 */
const searchBtn = document.getElementById("search-btn");
const countryInput = document.getElementById("country-input");
const resultDiv = document.getElementById("result");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const loadingTemplate = document.getElementById("loading-template");
const THEME_KEY = "country-app-theme";

/**
 * FEATURE: DARK/LIGHT MODE TOGGLE
 */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const nextTheme = theme === "dark" ? "light" : "dark";
    themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
}

function initTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
        applyTheme(storedTheme);
    } else {
        applyTheme("dark");
    }
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
});

function showLoading() {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = loadingTemplate.innerHTML;
}

function showError(message) {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * MAIN FUNCTION: FETCH COUNTRY DATA
 */
async function getCountryData() {
    const countryName = countryInput.value.trim();

    // Check if input is empty
    if (countryName.length === 0) {
        showError("Please enter a country name.");
        return;
    }

    showLoading();

    // API URL for searching by name
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Country not found");
        }

        const data = await response.json();
        const country = data[0];
        const flag = country.flags?.svg || country.flags?.png || "";
        const name = country.name?.common || "Unknown";
        const capital = country.capital?.[0] || "N/A";
        const population = typeof country.population === "number"
            ? country.population.toLocaleString()
            : "N/A";
        const region = country.region || "N/A";
        const subRegion = country.subregion || "N/A";
        const languages = country.languages
            ? Object.values(country.languages).join(", ")
            : "N/A";
        const currencies = country.currencies
            ? Object.entries(country.currencies)
                .map(([code, info]) => `${info.name || "Unknown"} (${code})`)
                .join(", ")
            : "N/A";
        const timezones = Array.isArray(country.timezones) && country.timezones.length > 0
            ? country.timezones.slice(0, 3).join(", ")
            : "N/A";

        // Dynamic body background image from the selected country flag.
        document.body.style.setProperty("--bg-image", flag ? `url("${flag}")` : "none");

        resultDiv.style.display = "block";
        resultDiv.innerHTML = `
            <div class="flag-wrap">
                <img src="${flag}" alt="Flag of ${name}" class="flag">
            </div>
            <h2>${name}</h2>
            <div class="stats">
                <article class="stat">
                    <p class="label">Capital</p>
                    <p class="value">${capital}</p>
                </article>
                <article class="stat">
                    <p class="label">Population</p>
                    <p class="value">${population}</p>
                </article>
                <article class="stat">
                    <p class="label">Region</p>
                    <p class="value">${region}</p>
                </article>
                <article class="stat">
                    <p class="label">Sub Region</p>
                    <p class="value">${subRegion}</p>
                </article>
                <article class="stat">
                    <p class="label">Currency</p>
                    <p class="value">${currencies}</p>
                </article>
                <article class="stat">
                    <p class="label">Languages</p>
                    <p class="value">${languages}</p>
                </article>
                <article class="stat">
                    <p class="label">Timezones</p>
                    <p class="value">${timezones}</p>
                </article>
            </div>
        `;
    } catch (error) {
        showError(`Oops! ${error.message}. Try again.`);
    }
}

/**
 * EVENT LISTENERS
 */
searchBtn.addEventListener("click", getCountryData);

// Also trigger search when 'Enter' key is pressed
countryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") getCountryData();
});

initTheme();