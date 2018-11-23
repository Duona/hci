// proof that js was created by sdts for sdts: https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
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
            label: "Height, m",
            backgroundColor: 'rgb(167, 232, 29)',
            borderColor: 'rgb(255, 99, 132)',
            data: elevations,
        }]
    },

    // Configuration options go here
    options: {
      tooltips: {
               callbacks: {
                   title: function() {
                           return '';
                   },
                   label: function(item, data) {
                   var datasetLabel=data.datasets[item.datasetIndex].label||'';
                   var dataPoint = item.yLabel;
                   return datasetLabel + ': '+ parseFloat(dataPoint).toFixed(1);
                   }
               }
           }
         }




});
