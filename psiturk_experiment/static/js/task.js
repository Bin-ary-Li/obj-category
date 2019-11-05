/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition; // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance; // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
    "instructions/instruct-1.html",
    "instructions/instruct-2.html",
    "instructions/instruct-3.html",
    "instructions/instruct-ready.html",
    "stage.html",
    "postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
    "instructions/instruct-1.html",
    "instructions/instruct-2.html",
    "instructions/instruct-3.html",
    "instructions/instruct-ready.html"
];


/********************
 * HTML manipulation
 *
 * All HTML files in the templates directory are requested 
 * from the server when the PsiTurk object is created above. We
 * need code to get those pages from the PsiTurk object and 
 * insert them into the document.
 *
 ********************/

/********************
 * TEST       *
 ********************/
var BallSortingExperiment = function() {

    var listening = false;

    var colors = ["red", "blue", "green", "yellow", "purple"];
    var conditions = [
        [1, 1],
        [2, 1],
        [2, 2],
        [3, 1],
        [3, 2],
        [3, 3],
        [4, 1],
        [4, 2],
        [4, 3],
        [4, 4],
        [5, 1]
    ];
    var condition = conditions[Math.floor(Math.random() * conditions.length)];
    var numColor = condition[0];
    var numShownCol = condition[1];
    var numBallperColor = 3;
    var totalBallNum = numColor * numBallperColor;
    var ballColors = [];

    // create ball objs
    for (var k = 0; k < condition[0]; k++) {
        ballColors.push(colors[k]);
    }
    var ballList = [];
    var ballIDCnt = 0;
    for (var j = 0; j < ballColors.length; j++) {
        for (var i = 0; i < numBallperColor; i++) {
            ballList.push(new Ball(ballColors[j], null, null, ballIDCnt, null));
            ballIDCnt++;
        }
    }

    // create bucket objs
    var sourceBucket = new Container(300, 0, 200, 150, "sourceBucket");
    var showStage = new Container(200, 240, 120, 350, "showStage");
    var targetBuckets = [];

    var targetBX = 0;
    var targetBY = 400;
    for (var i = 0; i < condition[0]; i++) {
        targetBuckets.push(createContainer(targetBX, targetBY, 200, 150, "targetBucket" + i, i))
        targetBX += 170; // width between target bucket 
    }


    function Ball(color, container, spot, id, svgObj) {
        this.color = color;
        this.container = container;
        this.spot = spot;
        this.id = id;
        this.svgObj = svgObj;
    }

    function makeBall(color, container, spot, id, svgObj) {
        var ball = new Ball(color, container, spot, id, svgObj);
        return ball;
    }

    function Container(x, y, height, width, idName, id) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.unitHeight = this.height / 5;
        this.unitWidth = this.width / 5;
        this.capacity = (this.height / this.unitHeight) * (this.width / this.unitWidth);
        this.content = [];
        this.emptySpots = [];
        this.takenSpots = [];
        this.svgObj = null;
        this.idName = idName;
        this.id = id;

        var i, j;
        for (var i = 0; i < height; i += this.unitHeight) {
            for (let j = 0; j < width; j += this.unitWidth) {
                var y = i + 20 + this.y;
                var x = j + 15 + this.x;
                var spot = [x, y];
                this.emptySpots.push(spot);
            }
        }

        this.addBall = function(ball) {
            if (this.capacity >= 1) {
                var spot = this.emptySpots.shift();
                ball.container = this;
                ball.spot = spot;
                this.takenSpots.push(spot);
                this.content.push(ball);
                this.capacity -= 1;
                return ball;
            }
        }

        this.findBall = function(ballColor) {
            for (var k = 0; k < this.content.length; k++) {
                if (this.content[k].color == ballColor) {
                    return k;
                }
            }
            return -1;
        }

        this.removeBall = function(ballColor) {
            foundIndex = this.findBall(ballColor)
            if (foundIndex == -1) {
                return null;
            }
            var foundBall = this.content.splice(foundIndex, 1)[0];
            // mark spot as empty
            var freeSpot = this.takenSpots.splice(this.takenSpots.indexOf(foundBall.spot), 1)[0];
            this.emptySpots.unshift(freeSpot);
            // update ball info
            foundBall.container = null;
            foundBall.spot = null;

            return foundBall;
        }

        this.removeRandom = function() {
        	if (this.content.length == 0) {
        		return;
        	}

        	var ball = this.content[Math.floor(Math.random() * this.content.length)]
        	var color = ball.color;

        	return this.removeBall(color);
        }

    }

    function createContainer(x, y, height, width, idName) {
        var container = new Container(x, y, height, width, idName);
        return container;
    }


    var moveBall = function(source, target, ballColor) {
        if (source.content.length == 0) {
            return null;
        }
        if (target.capacity == 0) {
            return null;
        }

        rmBall = source.removeBall(ballColor);
        if (rmBall != null) {
            return target.addBall(rmBall);
        }
        return rmBall;
    }

    var redrawBall = function(ball) {
        d3.select("#Ball" + ball.id)
            .transition()
            .attr("cx", ball.spot[0])
            .attr("cy", ball.spot[1])
            .duration(2000);
    }

    var initBallDrawing = function(ballList) {
        for (var i = 0; i < ballList.length; i++) {
            var ball = ballList[i];
            d3.select('#canvas')
                .append("circle")
                .attr("id", "Ball" + ball.id)
                .attr("cx", ball.spot[0])
                .attr("cy", ball.spot[1])
                .attr("r", ball.container.unitHeight / 4)
                .attr("stroke", "black")
                .attr("stroke-width", "1")
                .style("fill", ball.color);
            ball.svgObj = d3.select("#Ball" + ball.id);
        }
    }

    var drawContainer = function(container, strokeDash = "10 0") {
        d3.select("#canvas")
            .append("g")
            .attr("id", container.idName)
            .append("rect")
            .style("stroke", "gray")
            .style("stroke-width", "2")
            .style("fill", "transparent")
            .style("stroke-dasharray", strokeDash)
            .attr("x", container.x)
            .attr("y", container.y)
            .attr("width", container.width)
            .attr("height", container.height);
        container.svgObj = d3.select("#" + container.idName);
    }


    var init = function() {
        ballList.forEach(function(item, index, array) {
            sourceBucket.addBall(item);
        });
        d3.select("#stim")
            .append("svg")
            .style("height", "620px")
            .style("width", "1000px")
            .attr("id", "canvas")
        //draw target buckets
        for (var i = 0; i < targetBuckets.length; i++) {
            var target = targetBuckets[i];
            drawContainer(target);
            d3.select("#targetBucket"+i)
            	.append("text")
            	.attr("id", "targetTag"+i)
            	.text('' + i)
            	.attr('x', target.x + 70)
            	.attr('y', target.y - 10)
            	.attr("font-size", "30px");
        }
        drawContainer(showStage, strokeDash = "10 5");
        initBallDrawing(ballList);
        drawContainer(sourceBucket);
        // conceal the sourcebucket
        d3.select('#'+sourceBucket.idName).select("rect").style("fill", "black");

        listening = true;
        d3.select("#header").html("Let's sort some balls!");
       	d3.select('#intro').html("First let's see how it's done");
        d3.select("#query").html('<p id="prompt">Press enter to continue.</p>');
    }

    var demoShown = false;
    var demoSteps = numShownCol;
    var demoShow = function() {
    	d3.select("#header").html("Pay attention to the Demonstration");
       	d3.select('#intro').html("To which box is this ball moving?");
       	var ball = moveBall(sourceBucket, showStage, ballColors[demoSteps-1]);
		if (ball != null) {
		    redrawBall(ball);
		}
		demoShown = true;
		listening = true;
    }

    var demoMove = function() {
    	d3.select("#header").html("Pay attention to the Demonstration");
       	d3.select('#intro').html("To which box is this ball moving?");
		ball = showStage.removeRandom();
		if (ball != null) {
			targetBuckets[demoSteps-1].addBall(ball);
		    redrawBall(ball);
		}
		demoSteps--;
		demoShown = false;
		listening = true;

    }

    var currColor = "";
    var nextTestShown = false;
    var test = function() {
    	d3.select("#header").html("Now you finish the rest!");
       	d3.select('#intro').html("To which box should this ball be moving?");
       	d3.select("#query").html('<p id="prompt">Press the key of the corresponding box (for example press 0 for box 0).</p>');
    	if (sourceBucket.content.length == 0){
    		finish();
    	} else {
    		var ball = sourceBucket.removeRandom();
    		if (ball != null) {
    			currColor = ball.color;
    			ball = showStage.addBall(ball);
	            redrawBall(ball);
	        }
	        d3.select('#intro').html("Now select the box that this ball should be moving to");
	        nextTestShown = true;
	        listening = true;
    	}
    }

    var numAct = 0; 
    var actOn;
    var act = function(target) {
    	actOn = new Date().getTime();
    	numAct++;

    	var ball = showStage.removeRandom();
    	if (ball != null) {
			ball = targetBuckets[parseInt(target)].addBall(ball);
            redrawBall(ball);
	    }
	    d3.select("#query").html('<p id="prompt">Press enter to get the next one.</p>');
	    nextTestShown = false;
	    listening = true;
    }

    var textFlash = function(DOMid) {
    	d3.select("#" + DOMid)
    		.transition()
    		.style("font-weight", "600")
    		.duration(150)
    		.transition()
    		.style("font-weight", "300")
    		.duration(150);
    }



    var response_handler = function(e) {
        if (!listening) return;

        var keyCode = e.keyCode,
            response;

        switch (keyCode) {
            case 48:
                // "R"
                response = "0";
                textFlash("targetTag0");
                break;
            case 49:
                // "G"
                response = "1";
                textFlash("targetTag1");
                break;
            case 50:
                // "B"
                response = "2";
                textFlash("targetTag2");
                break;
            case 51:
                // "B"
                response = "3";
                textFlash("targetTag3");
                break;
            case 52:
                // "B"
                response = "4";
                textFlash("targetTag4");
                break;
            case 53:
                // "B"
                response = "5";
                textFlash("targetTag5");
                break;
            case 13:
                response = "continue";
                textFlash("prompt");
                break
            default:
                response = "";
                break;
        }
        if (response.length > 0) {
            if (response == "continue") {
            	if (demoSteps > 0) {
            		if (demoShown) {
            			listening = false;
		                demoMove();
		                return;
            		} else {
            			listening = false;
		                demoShow();
		                return;
            		}
            	} else if (!nextTestShown) {
            		listening = false;
            		test();
            		demoSteps--;
            		return;
            	}
            	return;
            } else if (demoSteps < 0 && nextTestShown) {
            	listening = false;
            	var rt = new Date().getTime() - actOn;
				act(response);

				psiTurk.recordTrialData({'phase':"TEST",
												'numColor':numColor,
												'numShownCol': numShownCol,
				                                'numAct':numAct,
				                                'color':currColor,
				                                'target':response,
				                                'rt':rt}
				                                );
				// test();
            }
        }
    };

    var finish = function() {
        $("body").unbind("keydown", response_handler); // Unbind keys
        currentview = new Questionnaire();
    };

    // Load the stage.html snippet into the body of the page
    psiTurk.showPage('stage.html');

    // Register the response handler that is defined above to handle any
    // key down events.
    $("body").focus().keydown(response_handler);

    // Start the test
    init();
};


/****************
 * Questionnaire *
 ****************/

var Questionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {

        psiTurk.recordTrialData({ 'phase': 'postquestionnaire', 'status': 'submit' });

        $('textarea').each(function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each(function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });

    };

    prompt_resubmit = function() {
        document.body.innerHTML = error_message;
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
        reprompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt);
                psiTurk.computeBonus('compute_bonus', function() {
                    psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                });


            },
            error: prompt_resubmit
        });
    };

    // Load the questionnaire snippet 
    psiTurk.showPage('postquestionnaire.html');
    psiTurk.recordTrialData({ 'phase': 'postquestionnaire', 'status': 'begin' });

    $("#next").click(function() {
        record_responses();
        psiTurk.saveData({
            success: function() {
                psiTurk.computeBonus('compute_bonus', function() {
                    psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                });
            },
            error: prompt_resubmit
        });
    });


};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load(function() {
    psiTurk.doInstructions(
        instructionPages, // a list of pages you want to display in sequence
        function() { currentview = new BallSortingExperiment(); } // what you want to do when you are done with instructions
    );
});