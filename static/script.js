async function checkComment(){

    let text = document.getElementById("comment").value;

    try{

        let response = await fetch("http://127.0.0.1:5000/predict",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({text:text})

        });

        let data = await response.json();

        document.getElementById("result").innerHTML="Prediction Completed";

        drawChart(data);

    }

    catch(error){

        document.getElementById("result").innerHTML="Server connection error";

        console.error(error);

    }

}