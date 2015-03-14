"use strict";

var statusElement = document.getElementById('status');
var resultsElement = parent.document.getElementById("results");
statusElement.textContent = "Loading worker";

if (window.Worker) {
    var solveStarted = false;
    var solverWorker = new Worker('scripts/worker.js');
    solverWorker.addEventListener("message", function (event) {
        statusElement.textContent = event.data.text;
        resultsElement.textContent += event.data.text + "\n";
        if (event.data.board != undefined) {
            resultsElement.textContent += event.data.board + "\n";

            var puzzleData = parent.getPuzzle();
            if (puzzleData != undefined) {
                solverWorker.postMessage({ "cmd": "solve", "puzzleIndex": puzzleData.puzzleIndex, "puzzle": puzzleData.puzzle });
            }
        }

        if (solveStarted == false) {
            solveStarted = true;
            var puzzleData = parent.getPuzzle();
            solverWorker.postMessage({ "cmd": "solve", "puzzleIndex": puzzleData.puzzleIndex, "puzzle": puzzleData.puzzle });
        }
    }, false);
}
else {
    statusElement.textContent = "Web Workers are not supported by your browser :(";
}
