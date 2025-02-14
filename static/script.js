function showNotification(message, type = 'error') {
    var notificationArea = $('#notification-area');
    var notification = $('<div class="notification"></div>');
    
    // Set the type class (error by default)
    if (type === 'success') {
        notification.addClass('success');
    } else if (type === 'info') {
        notification.addClass('info');
    }
    
    // Add the message and close button
    notification.html(`
        ${message}
        <span class="close-btn">&times;</span>
    `);
    
    // Add close functionality
    notification.find('.close-btn').click(function() {
        notification.fadeOut(function() {
            $(this).remove(); // Remove the notification after fading out
        });
    });

    // Append the notification to the area and show it
    notificationArea.append(notification).fadeIn();

    // Auto-hide the notification after 3 seconds
    setTimeout(function() {
        notification.fadeOut(function() {
            $(this).remove(); // Remove the notification after fading out
        });
    }, 3000);
}

$('#chart-type').change(function() {
    var chartType = $(this).val();
    // If 'candlestick' is selected, make sure it's registered
    if (chartType === 'candlestick') {
        // Ensure the plugin is loaded
        if (!Chart.controllers.candlestick) {
            alert('Candlestick charts are not supported. Please make sure the required plugin is loaded.');
            return;
        }
    }
    updateChart(chartType);
});

function updateChart(chartType) {
    var ctx = document.getElementById('myChart').getContext('2d');
    // Re-create the chart based on the selected type
    window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: chartType,  // Update chart type here
        data: {
            labels: window.myChart.data.labels, 
            datasets: window.myChart.data.datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time', // Use the 'time' scale
                    time: {
                        unit: 'day', // You can customize the unit (day, week, month)
                    },
                },
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                }
            }
        }
    });
}

$(document).ready(function(){
    $('#date-range-btn').click(function() {
        var startDate = $('#start-date').val();
        var endDate = $('#end-date').val();
        applyDateRangeFilter(startDate, endDate);
    });

    $('#interval-btn').click(function() {
        var interval = $('#interval-select').val();
        applyIntervalFilter(interval);
    });

    $('#reset-filters-btn').click(function() {
        resetFilters();
    });
});

function applyDateRangeFilter(startDate, endDate) {
    if (window.myChart && window.myChart.data && window.myChart.data.labels) {
        console.log("Applying date range filter...");
        console.log("Labels:", window.myChart.data.labels);

        // Ensure original data is stored before applying filter
        if (!window.myChart.originalData) {
            console.log("Storing original data...");
            window.myChart.originalData = {
                labels: [...window.myChart.data.labels],
                datasets: window.myChart.data.datasets.map(dataset => ({
                    ...dataset,
                    data: [...dataset.data]
                }))
            };
        }

        var filteredLabels = [];
        var filteredDataSets = window.myChart.originalData.datasets.map(function(dataset) {
            var filteredData = [];
            dataset.data.forEach(function(value, index) {
                var date = window.myChart.originalData.labels[index];
                if (date >= startDate && date <= endDate) {
                    filteredData.push(value);
                    if (filteredLabels.indexOf(date) === -1) {
                        filteredLabels.push(date);
                    }
                }
            });
            return {
                ...dataset,
                data: filteredData
            };
        });

        // Update the chart with the filtered data
        window.myChart.data.labels = filteredLabels;
        window.myChart.data.datasets = filteredDataSets;
        window.myChart.update();
    } else {
        console.error("Chart or chart data is not initialized.");
        showNotification("Chart is not initialized or no data available.", "error");
    }
}

function applyIntervalFilter(interval) {
    if (window.myChart && window.myChart.data && window.myChart.data.labels) {
        console.log("Applying interval filter...");
        console.log("Labels:", window.myChart.data.labels);

        // Ensure original data is stored before applying filter
        if (!window.myChart.originalData) {
            console.log("Storing original data...");
            window.myChart.originalData = {
                labels: [...window.myChart.data.labels],
                datasets: window.myChart.data.datasets.map(dataset => ({
                    ...dataset,
                    data: [...dataset.data]
                }))
            };
        }

        var intervalLabels = [];
        var intervalDataSets = window.myChart.originalData.datasets.map(function(dataset) {
            var intervalData = [];
            dataset.data.forEach(function(value, index) {
                var date = window.myChart.originalData.labels[index];
                if (interval === "daily" ||
                    (interval === "weekly" && index % 7 === 0) ||
                    (interval === "monthly" && index % 30 === 0)) {
                    intervalData.push(value);
                    intervalLabels.push(date);
                }
            });
            return {
                ...dataset,
                data: intervalData
            };
        });

        // Update the chart with the interval-filtered data
        window.myChart.data.labels = intervalLabels;
        window.myChart.data.datasets = intervalDataSets;
        window.myChart.update();
    } else {
        console.error("Chart or chart data is not initialized.");
        showNotification("Chart is not initialized or no data available.", "error");
    }
}

function resetFilters() {
    if (window.myChart && window.myChart.originalData) {
        console.log("Resetting filters...");
        // Restore original chart data
        window.myChart.data.labels = window.myChart.originalData.labels;
        window.myChart.data.datasets = window.myChart.originalData.datasets;
        window.myChart.update();

        // Clear the original data so filters can be applied again from scratch
        delete window.myChart.originalData;
    } else {
        console.error("No filters to reset or chart not initialized.");
        showNotification("No filters applied or chart not initialized.", "info");
    }
    // Reset the zoom level on the chart
    if (window.myChart && window.myChart.resetZoom) {
        window.myChart.resetZoom();  // Reset zoom to original view
    } else {
        console.error("Zoom reset not available.");
    }
}




$(document).ready(function(){
    $('#submit-btn').click(function() {
        var tickerText = $('#ticker-input').val();
        $('#chart-spinner').show();
        $.ajax({
            type: "POST",
            url: "/get_forex_data/",
            data: {'tickers': tickerText},
            success: function (res) {
                if (res.error) {
                    showNotification("Error: " + res.error, "error");
                } else {
                    showNotification("Data successfully loaded.", "success");
                }
                $('#chart-spinner').hide();
                var dates = res['dates'];
                var pairs = res['pairs'];

                // Render the chart
                $('#myChart').remove();
                $('#graph-area').append('<canvas id="myChart"><canvas>');
                var ctx = document.getElementById('myChart').getContext('2d');
                var datasets = pairs.map(function(pair, index) {
                    return {
                        label: pair.pair.toUpperCase(),
                        data: pair.prices,
                        backgroundColor: colors[index % colors.length].backgroundColor,
                        borderColor: colors[index % colors.length].borderColor,
                        borderWidth: 2,
                        fill: false
                    };
                });

                // Initialize the chart
                window.myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: false
                            }
                        },
                        plugins: {
                            zoom: {
                                pan: {
                                    enabled: true,
                                    mode: 'xy'
                                },
                                zoom: {
                                    wheel: {
                                        enabled: true,
                                    },
                                    pinch: {
                                        enabled: true
                                    },
                                    mode: 'xy',
                                }
                            }
                        }
                    }
                });

                // Store original data for future filtering
                window.myChart.originalData = {
                    labels: [...window.myChart.data.labels],
                    datasets: window.myChart.data.datasets.map(dataset => ({
                        ...dataset,
                        data: [...dataset.data]
                    }))
                };

            },
            error: function(xhr) {
                showNotification("Failed to load data.", "error");
                $('#chart-spinner').hide();  // Hide loading spinner in case of error
            }
        });
    });


    // Colors for the chart datasets
    var colors = [
        {backgroundColor: 'rgba(0, 123, 255, 0.5)', borderColor: 'rgba(0, 123, 255, 1)'}, // Blue
        {backgroundColor: 'rgba(40, 167, 69, 0.5)', borderColor: 'rgba(40, 167, 69, 1)'}, // Green
        {backgroundColor: 'rgba(255, 193, 7, 0.5)', borderColor: 'rgba(255, 193, 7, 1)'}, // Yellow
        {backgroundColor: 'rgba(220, 53, 69, 0.5)', borderColor: 'rgba(220, 53, 69, 1)'}  // Red (optional)
    ];

    // function fetchAndUpdateData() {
    //     var tickerText = $('#ticker-input').val();
    //     if (tickerText) {
    //         $.ajax({
    //             type: "POST",
    //             url: "/get_forex_data/",
    //             data: {'tickers': tickerText},
    //             success: function (res) {
    //                 if (res.error) {
    //                     showNotification("Error: " + res.error, "error");
    //                     return;
    //                 }

    //                 var dates = res['dates'];
    //                 var pairs = res['pairs'];

    //                 // Update the chart with the new data
    //                 updateChart(dates, pairs);
    //                 showNotification("Data updated successfully.", "success");
    //             },
    //             error: function(xhr) {
    //                 showNotification("Failed to update data.", "error");
    //             }
    //         });
    //     }
    // }

    // Set an interval to fetch data every 60 seconds (60000 milliseconds)
    // setInterval(fetchAndUpdateData, 1200000);

    // function updateChart(dates, pairs) {
    //     var ctx = document.getElementById('myChart').getContext('2d');

    //     if (window.myChart) {
    //         // Merge new data with the existing chart data
    //         pairs.forEach(function(pair, index) {
    //             // Update the existing dataset or add a new one if it doesn't exist
    //             if (window.myChart.data.datasets[index]) {
    //                 window.myChart.data.datasets[index].data = pair.prices;
    //             } else {
    //                 window.myChart.data.datasets.push({
    //                     label: pair.pair.toUpperCase(),
    //                     data: pair.prices,
    //                     backgroundColor: colors[index % colors.length].backgroundColor,
    //                     borderColor: colors[index % colors.length].borderColor,
    //                     borderWidth: 2,
    //                     fill: false
    //                 });
    //             }
    //             window.myChart.data.labels = dates;
    //         });

    //         // Handle case where number of datasets might decrease
    //         if (window.myChart.data.datasets.length > pairs.length) {
    //             window.myChart.data.datasets = window.myChart.data.datasets.slice(0, pairs.length);
    //         }

    //         window.myChart.update(); // Refresh the chart with new data
    //     } else {
    //         // Create a new chart if it doesn't exist
    //         var datasets = pairs.map(function(pair, index) {
    //             return {
    //                 label: pair.pair.toUpperCase(),
    //                 data: pair.prices,
    //                 backgroundColor: colors[index % colors.length].backgroundColor,
    //                 borderColor: colors[index % colors.length].borderColor,
    //                 borderWidth: 2,
    //                 fill: false
    //             };
    //         });

    //         window.myChart = new Chart(ctx, {
    //             type: 'line',
    //             data: {
    //                 labels: dates,
    //                 datasets: datasets
    //             },
    //             options: {
    //                 responsive: true,
    //                 scales: {
    //                     y: {
    //                         beginAtZero: false
    //                     }
    //                 },
    //                 plugins: {
    //                     zoom: {
    //                         pan: {
    //                             enabled: true,
    //                             mode: 'xy'
    //                         },
    //                         zoom: {
    //                             wheel: {
    //                                 enabled: true,
    //                             },
    //                             pinch: {
    //                                 enabled: true
    //                             },
    //                             mode: 'xy',
    //                         }
    //                     }
    //                 }
    //             }
    //         });
    //     }
    // }


    $('#export-btn').click(function() {
        var ticker = $('#ticker-input').val();
        window.location.href = `/export_data/?ticker=${ticker}`;
    });

    $('#history-btn').click(function() {
        window.location.href = '/prediction_history';
    });

    $('#predict-btn').click(function() {
        var tickerText = $('#ticker-input').val().split(',')[0].trim(); // Only take the first pair
        $('#predict-spinner').show();
        $.ajax({
            type: "POST",
            url: "/predict_forex/",
            data: {'ticker': tickerText},
            success: function(res) {
                $('#prediction-result').html(res['prediction_sentence']);
                showNotification("Prediction successful.", "success");
                $('#predict-spinner').hide();
            },
            error: function(xhr) {
                showNotification("Prediction failed.", "error");
                $('#predict-spinner').hide(); 
            }
        });
    });

    // Handle the compare button click
    $('#compare-btn').click(function() {
        var dateText = $('#date-input').val();
        $('#compare-spinner').show();  // Show loading spinner
        $.ajax({
            type: "POST",
            url: "/compare_prediction/",
            data: {'date': dateText},
            success: function(res) {
                if (res.comparison_result) {
                    $('#comparison-result').html(res['comparison_result']);
                    showNotification("Comparison successful.", "success");
                } else {
                    showNotification("No comparison data found for the selected date.", "info");
                }
                $('#compare-spinner').hide();  // Hide loading spinner
            },
            error: function(xhr) {
                showNotification("Comparison failed.", "error");
                $('#compare-spinner').hide();  // Hide loading spinner in case of error
            }
        });
    });
});