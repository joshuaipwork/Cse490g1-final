const RADIUS = 37;
// store data from preppedData.csv
let data = [];

// dimensions of the chart
const HEIGHT = 600;
const WIDTH = 900;

let cachedData;
const YVALUE = 100;

window.onload = pageLoad;
let axisDisplayed = false;

// maps justice name -> justice wiki page
let links;

// function called when the page is rendered on screen
async function pageLoad() {
    generateNumberLine();
    await loadData();
    setupLinks();
}

async function loadData() {
    const fetchText = async (url) => {
        const response = await fetch(url);
        return await response.text();
    };
    const csvUrl = "preppedData.csv";
    await fetchText(csvUrl).then(text => {
        data = d3.csvParse(text);
    });
}

function onYearSelected(year) {
    document.querySelector("#current-year").innerText = year;
    //console.log("year", year);
    if (cachedData == null) {
        generateDots(year);
    } else {
        triggerTransition(year)
    }
}

function getRowData(year) {
    for (let i = 0; i < data.length; i++) {
        let rowEntry = data[i];
        if (rowEntry.year == year) {
            return rowEntry;
        }
    }
    return null;  // should be unreachable
}

function getXPositionForScore(score) {
    let start = 50;
    let end = WIDTH - 50;
    return (((end - start) / 20) * score) + ((start / 2) + (end / 2));
}

function createCircles(data) {
    if (!axisDisplayed) {
        generateNumberLine();
        axisDisplayed = true;
    }

    d3.selection.prototype.moveToFront = function() {  
        return this.each(function(){
          this.parentNode.appendChild(this);
        });
    };

    d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };

    let svg = d3.select("#graph")

    // remove old median line
    svg.selectAll(".lines").remove();

    // adding the median line
    var count = 0;
    var scores = [];
    data.forEach(function(datum){
        scores.push(parseFloat(datum.score));
        count = count + 1;
    });

    scores.sort(function(a,b){return a - b})

    
    if (scores.length != 0) { 
        let median = 0.0;
        if(count % 2 == 1) {
            median = parseFloat(scores[parseInt(count/2)]);
        } else {
            median = (parseFloat(scores[parseInt(count/2) - 1]) + parseFloat(scores[parseInt(count/2)])) / 2.0;
        }

        console.log(median);

        var line = svg.append("g")
                    .attr("class", "lines")
                    .moveToBack()

        line.append('line')
            .style("stroke", "white")
            .style("stroke-width", 0.6)
            .style("z-index", "-100")
            .attr("x1", function (d) {
                return getXPositionForScore(median);
                })
            .attr("y1", 20)
            .attr("x2", function (d) {
                return getXPositionForScore(median);
                })
            .attr("y2", 650)
            .lower();

        var label = "Median Martin-Quinn Score (" + median.toFixed(3) + ")";

        line.append('text')
            .text(label)
            .style("fill", "white")
            .attr('text-anchor', 'middle')
            .style("font-size", 12 + "px")
            .attr( "fill-opacity", 0.5)
            .attr("font-weight", 10)
            .attr('transform', function (d, i) {
                return 'translate( '+ (getXPositionForScore(median) - 20) +' , ' + 545 + '),'+ 'rotate(-90)';
            })
            .attr('x', 0)
            .attr('y', 0);
    }

    let g = svg
    .selectAll("g.circle")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "circle")
    .attr("transform", function(d) {
        return "translate(" + d.xpos + "," + d.ypos + ")";
    })
    .attr("id", function(d) {
        return d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "");
    })
    .on("mouseover", function(event, d) {
        d3.select(this).moveToFront();
    });

    g.append("svg:pattern")
         .attr("id", function(d){
             return d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "") + "Img";
          })
         .attr("width", 1)
         .attr("height", 1)
        .append("svg:image")
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 80)
        .attr('height', 80)
        .attr("xlink:href", function(d){
            return "potraits/" + d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "") + ".jpg";
        })

    g
    .append("circle")
    .attr("class", function(d){ return d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "") + "div";})
        .attr("r", RADIUS)
        .attr("cx", "0.5em")
        .attr("cy", "0.5em")
        .style("fill", function(d){
            return "url(#" + d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "") + "Img)";
        })
        //.style("fill", "none")
        .attr("stroke", function(d){
            if (d.score > 0.5){
                return "red";
            } else if (d.score < -0.5) {
                //return "blue";
                return "#00A6EF";
            } else {
                return "#9969c7";
            }
        })
        .attr("stroke-width", function (d) { return 4;})
        .on("click", function(d) {
            openWikiTab(d.srcElement.__data__.name);
        })
        .on("mouseover", function(event, d) {
            d3.select(this).transition().style("transform", "scale(1.25,1.25)").duration(150);
            d3.select(this).style("z-index", "99")

            d3.selectAll("circle").style("opacity", 0.5);
            d3.select(this).style("opacity", 1);
            d3.select(this).style("cursor", "pointer");

            let selectedJusticeID = d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, ""); 
            d3.select("g#" + selectedJusticeID + " text").text("Martin-Quinn Score: " + d.score)
            .attr("y", RADIUS / 2)
            .attr("x", RADIUS * 3 + 25); 

        })
        .on("mouseout", function(event, d) {
            d3.select(this).transition().style("transform", "scale(1,1)").duration(150);

            d3.selectAll("circle").style("opacity", 1)
            d3.select(this).style("cursor", "default");

            // changing text back to justice name 
            let selectedJusticeID = d.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, ""); 
            d3.select("g#" + selectedJusticeID + " text")
            .text(d.name)
            .attr("y", RADIUS / 2)
            .attr("x", RADIUS * 2 + 20); 
        })

    g
    .append("text")
    .text(function(d){return d.name})
    .style("font-size", RADIUS/3 - 1 + "px")
    .attr("y", RADIUS / 2)
    .attr("x", RADIUS * 2 + 20)
    .attr("text-anchor", "middle")
    .attr("font-weight", 600)
    .style("fill", "white")
    .style("user-select", "none")
    .attr("pointer-events", "none")
}

function triggerTransition(year){
    let svg = d3.select("#graph")

    cachedData = getRowData(year);
    let temp = createNameAndScoreObject(cachedData);

    old = svg.selectAll("g.circle");
    var oldIds = [];
    old._groups.forEach(function(d, i){
        d.forEach(function(datum){
            object = {"id": datum.id};
            oldIds.push(object);
        })
    });

    var oldToDelete = [];
    var commonToBoth = [];

    // find the justices which were replaced
    oldIds.forEach(function(idObject) {
        check = false;
        let storeDatum = object;
        let id = idObject.id;
        temp.forEach(function(datum) {
            storeName = datum.name.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "");
            if(id == storeName) {
                check = true;
                storeDatum = datum;
            }
        })
        if(check) {
            commonToBoth.push(storeDatum);
        } else {
            oldToDelete.push(id);
        }
    });

    // get the new ids to be added
    var newToAdd = [];
    temp.forEach(function(datum) {
        check = false;
        commonToBoth.forEach(function(common){
            if(datum == common) {
                check = true;
            }
        })
        if(!check) {
            newToAdd.push(datum);
        }
    });

    // delete the old justices
    oldToDelete.forEach(function(id) {
        let ref = "#" + id.replace(/\s+/g, '').replace(/\./g, '').replace(/'/g, "");
        svg.select(ref).remove();
    });

    // transition element common to both
    svg
      .selectAll("g.circle")
      .data(commonToBoth)
      .transition()
      .delay(100)
      .duration(1000)
      .attr("transform", function(d) { return "translate(" + d.xpos + "," + d.ypos + ")"; });

    svg
      .selectAll("g.circle > text")
      .data(commonToBoth)
      .transition()
      .delay(100)
      .duration(1000)
      .text(function(d){
          return d.name;});
    svg
    .selectAll("g.circle > circle")
    .data(commonToBoth)
    .transition()
    .delay(100)
    .duration(1000)
    .attr("stroke", function(d){
        if (d.score > 0.5){
            return "red";
        } else if (d.score < -0.5) {
            //return blue
            return "#00A6EF";
        } else {
            //return purple;
            return "#9969c7";
        }
    });

    var allThePoints = commonToBoth;
    newToAdd.forEach(function(add) {
        allThePoints.push(add);
    });
    // re-create the circles with all ot the new data
    createCircles(allThePoints);
  }


function createNameAndScoreObject(cachedData) {
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    // Get the size of an object
    let size = Object.size(cachedData);

    var temp = [];
    let objectLength = (size - 1) / 2;
    for (let i = 1; i <= objectLength; i++) {
        // create object 1
        let justiceStr = "Justice " + i;
        let scoreStr = "Score " + i;
        let name = cachedData[justiceStr];
        let score = cachedData[scoreStr];
        let object;
        if (name !== "") {
            object = {"name": name, "xpos": score, "ypos": YVALUE, "score": score};
            temp.push(object);
        }
    }
    // xpos is currently a score, so convert to a coordinate
    // compute the x-positions of the points
    let xPositions = [];
    for (let i = 0; i < temp.length; i++) {
      temp[i]['xpos'] = getXPositionForScore(temp[i]['xpos'])
      xPositions.push(temp[i])
    }

    // sort the xpositions by the X-position
    xPositions.sort((a, b) => (a['xpos'] > b['xpos']) ? 1 : -1)

    // sort y-positions
    let increment = (HEIGHT + 21) / xPositions.length;

    for (let i = 0; i < xPositions.length; i++) {
      xPositions[i]['ypos'] = i * increment + RADIUS;
    }

    return temp;
}

function generateDots(year) {
    // Position of the circles on the X axis
    cachedData = getRowData(year);

    let temp = createNameAndScoreObject(cachedData);

    // Add circles at the top
    createCircles(temp);
}

function generateNumberLine() {
    if (!axisDisplayed) {
        let xScale = d3.scaleLinear()
        .domain([-10, 10])
        .range([0, WIDTH - 100])

        let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(3)
        .tickFormat(function(d) {
            switch(d) {
                case 5: return "Conservative"; break;
                case 0: return "Neutral"; break;
                case -5: return "Liberal"; break;
            }
        });

        let xAxisTranslate = (HEIGHT + 50)

        d3.select("#graph")
            .append("g")
            .attr("transform", "translate(50, " + xAxisTranslate +")")
            .call(xAxis)
            .selectAll("text")
                .style("font-size", "15px");

        d3.select("#graph").append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 50)
            .attr("x",0 - (HEIGHT / 2))
            .attr("dy", -15)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text("Ideological Rank (Higher is more liberal)");


        let yScale = d3.scaleLinear()
        .domain([-10, 10])
        .range([650 - 25, 0]);

        let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(0);

        d3.select("#graph")
            .append("g")
                .attr("transform", "translate(50, 0)")
                .call(yAxis);
    }
    axisDisplayed = true;
}

// onclick function for the circles
function openWikiTab(justiceName) {
    window.open(links.get(justiceName));
}

function setupLinks() {
    links = new Map();
    links.set('C.E. Hughes', "https://en.wikipedia.org/wiki/Charles_Evans_Hughes");
    links.set('B.N. Cardozo', "https://en.wikipedia.org/wiki/Benjamin_N._Cardozo");
    links.set('F. Frankfurter', "https://en.wikipedia.org/wiki/Felix_Frankfurter");
    links.set('E. Warren', "https://en.wikipedia.org/wiki/Earl_Warren");
    links.set('C.E. Whittaker', "https://en.wikipedia.org/wiki/Charles_Evans_Whittaker");
    links.set('B.R. White', "https://en.wikipedia.org/wiki/Byron_White");
    links.set('A.J. Goldberg', "https://en.wikipedia.org/wiki/Arthur_Goldberg");
    links.set('A. Fortas', "https://en.wikipedia.org/wiki/Abe_Fortas");
    links.set('A. Scalia', "https://en.wikipedia.org/wiki/Antonin_Scalia");
    links.set('A.M. Kennedy', "https://en.wikipedia.org/wiki/Anthony_Kennedy");
    links.set('B.M. Kavanaugh', "https://en.wikipedia.org/wiki/Brett_Kavanaugh");
    links.set('F. Murphy', "https://en.wikipedia.org/wiki/Frank_Murphy");
    links.set('F.M. Vinson', "https://en.wikipedia.org/wiki/Fred_M._Vinson");
    links.set('H.A. Blackmun', "https://en.wikipedia.org/wiki/Harry_Blackmun");
    links.set('C. Thomas', "https://en.wikipedia.org/wiki/Clarence_Thomas");
    links.set('G. Sutherland', "https://en.wikipedia.org/wiki/George_Sutherland");
    links.set('H.F. Stone', "https://en.wikipedia.org/wiki/Harlan_F._Stone");
    links.set('H.H. Burton', "https://en.wikipedia.org/wiki/Harold_Hitz_Burton");
    links.set('H.L. Black', "https://en.wikipedia.org/wiki/Hugo_Black");
    links.set('L.F. Powell', "https://en.wikipedia.org/wiki/Lewis_F._Powell_Jr.");
    links.set('J.P. Stevens', "https://en.wikipedia.org/wiki/John_Paul_Stevens");
    links.set('E. Kagan', "https://en.wikipedia.org/wiki/Elena_Kagan");
    links.set('J. Harlan', "https://en.wikipedia.org/wiki/John_Marshall_Harlan");
    links.set('P. Stewart', "https://en.wikipedia.org/wiki/Potter_Stewart");
    links.set('D.H. Souter', "https://en.wikipedia.org/wiki/David_Souter");
    links.set('J.G. Roberts', "https://en.wikipedia.org/wiki/John_Roberts");
    links.set('J.C. McReynolds', "https://en.wikipedia.org/wiki/James_Clark_McReynolds");
    links.set('J.F. Byrnes', "https://en.wikipedia.org/wiki/James_F._Byrnes");
    links.set('O.J. Roberts', "https://en.wikipedia.org/wiki/Owen_Roberts");
    links.set('R.H. Jackson', "https://en.wikipedia.org/wiki/Robert_H._Jackson");
    links.set('T. Marshall', "https://en.wikipedia.org/wiki/Thurgood_Marshall");
    links.set('S.D. O\'Connor', "https://en.wikipedia.org/wiki/Sandra_Day_O%27Connor");
    links.set('L.F. Powell', "https://en.wikipedia.org/wiki/Lewis_F._Powell_Jr.");
    links.set('N.M. Gorsuch', "https://en.wikipedia.org/wiki/Neil_Gorsuch");
    links.set('L.D. Brandeis', "https://en.wikipedia.org/wiki/Louis_Brandeis");
    links.set('S.F. Reed', "https://en.wikipedia.org/wiki/Stanley_Forman_Reed");
    links.set('W.E. Burger', "https://en.wikipedia.org/wiki/Warren_E._Burger");
    links.set('W.B. Rutledge', "https://en.wikipedia.org/wiki/Wiley_Blount_Rutledge");
    links.set('R.B. Ginsburg', "https://en.wikipedia.org/wiki/Ruth_Bader_Ginsburg");
    links.set('S. Minton', "https://en.wikipedia.org/wiki/Sherman_Minton");
    links.set('T.C. Clark', "https://en.wikipedia.org/wiki/Tom_C._Clark");
    links.set('W.H. Rehnquist', "https://en.wikipedia.org/wiki/William_Rehnquist");
    links.set('S.A. Alito', "https://en.wikipedia.org/wiki/Samuel_Alito");
    links.set('P. Butler', "https://en.wikipedia.org/wiki/Pierce_Butler_(justice)");
    links.set('W.J. Brennan', "https://en.wikipedia.org/wiki/William_J._Brennan_Jr.");
    links.set('S.G. Breyer', "https://en.wikipedia.org/wiki/Stephen_Breyer");
    links.set('W.O. Douglas', "https://en.wikipedia.org/wiki/William_O._Douglas");
    links.set('S. Sotomayor', "https://en.wikipedia.org/wiki/Sonia_Sotomayor");
}