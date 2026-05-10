fetch("/comment_stats")
.then(response => response.json())
.then(data => {

const ctx = document.getElementById("toxicityChart")

new Chart(ctx, {
type: "pie",
data: {
labels: ["Toxic", "Non Toxic"],
datasets: [{
data: [data.toxic, data.non_toxic]
}]
}
})

})