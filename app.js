// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const config = {
    apiKey: "AIzaSyClTQNHf4REomGDDiJCijACYkFHughVoJY",
    authDomain: "netflixdemo-389e9.firebaseapp.com",
    databaseURL: "https://netflixdemo-389e9-default-rtdb.firebaseio.com",
    projectId: "netflixdemo-389e9",
    storageBucket: "netflixdemo-389e9.appspot.com",
    messagingSenderId: "833950341047"
    
  };

firebase.initializeApp(config);
// Initialize Firebase

var db = firebase.database();
var stg = firebase.storage();
var dbSnapshot = null;
var movieIDArrayGlobal = null;

$(document).ready(function() {
    if (localStorage.user && localStorage.user != "") {
        if(JSON.parse(localStorage.user).userType === "A"){
            document.getElementById('account_btn').style.display = 'block'
            document.getElementById('upload_btn').style.display = 'block'
        }
           
        document.getElementById('login_btn').style.display = 'none'
        document.getElementById('btn_logout').style.display = 'block'
    }

    db.ref("Movies").on('value', function(snapshot) {
        dbSnapshot = snapshot.val();
        movieIDArrayGlobal = Object.keys(dbSnapshot);
        var html = "";
        var bannerHtml = "";
        for (var i = 0; i < Object.keys(dbSnapshot).length; i++) {

           
            var template = `<div class="column">
                                <img src="`+dbSnapshot[Object.keys(dbSnapshot)[i]].imgURL.toString()+ `" alt="" />
                            </div>`;

            html = html + template

            var bannerTemplate = `<div class="slides">
                                    <img src="`+dbSnapshot[Object.keys(dbSnapshot)[i]].imgURL.toString()+`" alt="" />
                                    <div class="content">
                                        <h2>`+dbSnapshot[Object.keys(dbSnapshot)[i]].Title+`</h2>
                                        <p>
                                        `+dbSnapshot[Object.keys(dbSnapshot)[i]].Desc+`
                                        </p>
                                        <a onclick="showMovie(`+i+`)" href="`+dbSnapshot[Object.keys(dbSnapshot)[i]].videoURL.toString()+`" target="_blank" rel="noopener noreferrer">
                                        <i class="fa fa-play" aria-hidden="true"></i>
                                        Watch now
                                        </a>
                                    </div>
                                    </div>`

            bannerHtml = bannerHtml + bannerTemplate;



        }

        document.getElementById("movies").innerHTML = html;

        document.getElementById("description").innerHTML = bannerHtml;

        slides = document.querySelectorAll('.slides');
        dots = document.querySelectorAll('.column');
        slideIndex = 0;
        showSlide();

    })




});

function showMovie(indx){
    var ref = dbSnapshot[movieIDArrayGlobal[0]];

    var movieObj = {
        author:ref.userName,
        country:JSON.parse(localStorage.user)["country"],
        movieId:ref.movieId,
        userId:JSON.parse(localStorage.user)["userName"]
    }

    db.ref('Views/' + Date.now()).set(movieObj);

    console.log("Movie Clicked",indx);
}

function uploadMovie(){
    var postertileInput = document.getElementById("myPosterFile");
    var videoInput = document.getElementById("myVideoFile");


    var upload_mov_id = document.getElementById("upload_mov_id").value
    var upload_mov_title = document.getElementById("upload_mov_title").value
    var upload_mov_desc = document.getElementById("upload_mov_desc").value
    var imgURL = ""
    var videoURL = "";
   
    if ('files' in postertileInput && 'files' in videoInput && upload_mov_id.length>0 && upload_mov_title.length>0 && upload_mov_desc.length>0) {

        let refPoster = firebase.storage().ref().child(upload_mov_id+'_poster');
        let refVideo = firebase.storage().ref().child(upload_mov_id+'_video');
       
        refPoster.put(postertileInput.files[0]).then((snapshot) => {
            console.log('Uploaded the poster');
            refPoster.getDownloadURL().then((url) => {
                imgURL = url;

                refVideo.put(videoInput.files[0]).then((snapshot) => {
                    console.log('Uploaded the Video');
                    refVideo.getDownloadURL().then((url) => {
                        videoURL = url;
                        var movieObj = {
                            Desc:upload_mov_desc,
                            Title:upload_mov_title,
                            movieId:upload_mov_id,
                            userName: JSON.parse(localStorage.user).userName,
                            imgURL:imgURL,
                            videoURL:videoURL
                        }

                        db.ref('Movies/' + upload_mov_id).set(movieObj);
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000)

                        console.log("MovieObj",movieObj)

                    });
                })
            })
        });

       

       
       




  }
}

function register() {
    var reg_name = document.getElementById("reg_name").value
    var reg_username = document.getElementById("reg_username").value
    var reg_email = document.getElementById("reg_email").value
    var reg_code = document.getElementById("reg_code").value

    if (reg_name.length > 0 && reg_username.length > 0 && reg_email.length > 0 && reg_code.length > 0) {
        db.ref('Account/' + reg_username).set({
            Token: reg_code,
            country: reg_code,
            emailId: reg_email,
            name: reg_name,
            userName: reg_username,
            userType: 'B'
        });

        setTimeout(function() {
            debugger
            $('#username').val(reg_username);
            login()
        }, 1000)
    }

}

function logout() {
    delete localStorage.user;
    window.location.reload();
}

var sections = ['home', 'account', 'login', 'profile']

function login() {
    var username = $('#username').val();
    if (username.length > 0) {
        db.ref("Account/" + username).on('value', function(snapshot) {
            if (snapshot.val()) {
                localStorage.user = JSON.stringify(snapshot.val());
                document.getElementById('account_btn').style.display = 'none';
                document.getElementById('login_btn').style.display = 'block';
                window.location.reload();
            } else {
                alert("User Does not Exist.")
            }
        });
    }

}

var uploadedMovieIds = [];
var viewCounts = [];
var pieSeries = []

function loadViewChart() {

    uploadedMovieIds = [];
    viewCounts = [];
    pieSeries = [];

    var userObject = JSON.parse(localStorage.user)
    db.ref('Movies').orderByChild('userName').equalTo(userObject.userName).on("value", function(snapshot) {
        uploadedMovieIds = []
        if (snapshot.val()) {
            uploadedMovieIds = Object.keys(snapshot.val());
            db.ref('Views').orderByChild('author').equalTo(userObject.userName).on("value", function(snapshot) {
                if (snapshot.val()) {
                    var compDBObj = snapshot.val()
                    for (var i = 0; i < uploadedMovieIds.length; i++) {
                        var ctr = 0;
                        for (var j = 0; j < Object.keys(compDBObj).length; j++) {
                            if (compDBObj[Object.keys(compDBObj)[j]]["movieId"] === uploadedMovieIds[i]) {
                                ctr++;
                            }
                        }
                        viewCounts.push(ctr);

                        var obj = {
                            name: uploadedMovieIds[i],
                            y: ctr * 30
                        }
                        pieSeries.push(obj)
                    }

                    //bar graph
                    Highcharts.chart('barGraph', {
                        chart: {
                            type: 'column'
                        },
                        title: {
                            text: 'Views By Movie'
                        },

                        xAxis: {
                            categories: uploadedMovieIds,
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Views'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y:.1f} Views</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        plotOptions: {
                            column: {
                                pointPadding: 0.2,
                                borderWidth: 0
                            }
                        },
                        series: [{
                            name: 'Movie Views',
                            data: viewCounts

                        }]
                    });


                    //pie chart
                    Highcharts.chart('pieChart', {
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie'
                        },
                        title: {
                            text: 'Revenue By Movie'
                        },
                        tooltip: {
                            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                        },
                        accessibility: {
                            point: {
                                valuePrefix: '$'
                            }
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                                }
                            }
                        },
                        series: [{
                            name: 'Movies',
                            colorByPoint: true,
                            data: pieSeries
                        }]
                    });

                   
                   
                    getCountryCounts(compDBObj)
                    var data = [  ['us', us_count],['in',in_count],['uk',uk_count] ]
                    mapReady(data);



                }

            })
        }
    });


}
var in_count = 0;
    var us_count = 0;
    var uk_count = 0;

function getCountryCounts(compDBObj){
    in_count = 0;
    us_count = 0;
    uk_count = 0
    for(var i=0;i< Object.keys(compDBObj).length;i++ ){
        var country = compDBObj[Object.keys(compDBObj)[i]]
        if(country == 'in'){
            in_count++;
        }
        if(country == 'us'){
            us_count++;
        }
        if(country == 'uk'){
            uk_count++;
        }
    }
}


function mapReady(incData) {
    // Instantiate chart
    var mapKey = 'custom/world'
    var data = [{
        key: "us",
        value: 2
    }]




    //$("#geoMap").Highcharts('Map', {\

    var data = incData

    // Create the chart
    Highcharts.mapChart('geoMap', {
        chart: {
            map: 'custom/world'
        },

        title: {
            text: 'Views by Country'
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        colorAxis: {
            min: 0
        },

        series: [{
            data: data,
            name: 'Views',
            states: {
                hover: {
                    color: '#BADA55'
                }
            },
            dataLabels: {
                enabled: false,
                format: '{point.name}'
            }
        }]
    });

}

function goTab(sec) {
    for (var i = 0; i < sections.length; i++) {
        document.getElementById(sections[i]).style.display = 'none';
    }

    if (sec === "account") {
        loadViewChart();
    }

    document.getElementById(sec).style.display = 'block';

}



let slides = document.querySelectorAll('.slides');
let dots = document.querySelectorAll('.column');
let slideIndex = 0;

function showSlide(n) {
    if (slideIndex > slides.length - 1) {
        slideIndex = 0;
    }
    if (slideIndex < 0) {
        slideIndex = slides.length - 1;
    }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace("active", "");
    }
    slides[slideIndex].style.display = "block";
    dots[slideIndex].className += " active";
}
dots.forEach((item, index) => {
    item.addEventListener('click', () => {
        showSlide(slideIndex = index);
    })
});

const nav = document.querySelector('.nav');
const prev = document.querySelector('.prev');
const next = document.querySelector('.next');
next.addEventListener('click', () => {
    nav.scrollLeft += dots[0].offsetWidth;
    showSlide(slideIndex += 1);
    if (slideIndex === 0) {
        nav.scrollLeft = 0;
    }
})
prev.addEventListener('click', () => {
    nav.scrollLeft -= dots[0].offsetWidth;
    showSlide(slideIndex -= 1);
    if (slideIndex === slides.length - 1) {
        nav.scrollLeft = nav.scrollWidth;
    }
})
