let chart;

async function loadCountryOptions() {
    try {
        const res = await fetch('/countries');
        const countries = await res.json();

        const select = document.getElementById('country');
        select.innerHTML = '';

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.text = country;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading country list:", error);
    }
}

async function loadData() {
    const select = document.getElementById("country");
    const selectedCountries = Array.from(select.selectedOptions).map(opt => opt.value);
    const startYear = document.getElementById("startYear").value;
    const endYear = document.getElementById("endYear").value;

    if (chart) chart.destroy();

    const ctx = document.getElementById('co2Chart').getContext('2d');
    const datasets = [];
    let labels = [];

    for (const country of selectedCountries) {
        const response = await fetch(`/data?country=${encodeURIComponent(country)}&start=${startYear}&end=${endYear}`);
        const data = await response.json();

        if (labels.length === 0) {
            labels = data.map(row => row.year);
        }
        const values = data.map(row => row.co2);

        datasets.push({
            label: `CO2: ${country}`,
            data: values,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        });
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CO₂ (metric tons per capita)'
                    }
                }
            }
        }
    });

    try {
        const countryForSummary = selectedCountries.length === 1 ? selectedCountries[0] : null;

        if (countryForSummary) {
            const summaryRes = await fetch(`/summary?country=${encodeURIComponent(countryForSummary)}&start=${startYear}&end=${endYear}`);

            if (!summaryRes.ok) throw new Error("Server error");

            const summaryData = await summaryRes.json();

            if (summaryData.message && summaryData.message.trim() !== "") {
                document.getElementById("summaryText").innerText = summaryData.message;
            } else {
                document.getElementById("summaryText").innerText = "No summary available for this selection.";
            }
        } else {
            document.getElementById("summaryText").innerText = "Select a single country to view summary text.";
        }
    } catch (error) {
        console.error("Error fetching summary:", error);
        document.getElementById("summaryText").innerText = "Unable to load summary data at this time.";
    }
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgb(${r}, ${g}, ${b})`;
}

let topChart;

async function loadYearOptions() {
    const res = await fetch('/years');
    const years = await res.json();
    const select = document.getElementById('topYear');

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        select.appendChild(option);
    });
}

async function loadTopEmitters() {
    const year = document.getElementById('topYear').value;

    const res = await fetch(`/top_emitters?year=${year}`);
    const data = await res.json();

    const labels = data.map(row => row.country);
    const values = data.map(row => row.co2);

    const ctx = document.getElementById('topEmittersChart').getContext('2d');
    
    if (topChart) topChart.destroy();

    topChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Top 10 CO2 Emitters in ${year}`,
                data: values,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO2 Emissions (metric tons per capita)'
                    }
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    loadCountryOptions();
    loadYearOptions();
});