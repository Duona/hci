var valArray = [...Array(elevations.length).keys()];

console.log(elevations.length);

var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: valArray,
        datasets: [{
            label: "Elevation graph",
            backgroundColor: 'rgb(167, 232, 29)',
            borderColor: 'rgb(255, 99, 132)',
            data: elevations,
        }]
    },

    // Configuration options go here
    options: {}
});
