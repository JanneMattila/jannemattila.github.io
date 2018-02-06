var point = /** @class */ (function () {
    function point(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    return point;
}());
var line = /** @class */ (function () {
    function line(p1, p2) {
        this.p1 = p1 || new point();
        this.p2 = p2 || new point();
    }
    return line;
}());
var lines = /** @class */ (function () {
    function lines(canvas) {
        var _this = this;
        this.board = [];
        this.points = 0;
        this.lineLength = 3;
        this.xSize = 11;
        this.ySize = 11;
        this.originalSize = 11;
        this.emptyScreenSpace = 40;
        this.radius = 5;
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this.context.font = "14pt Arial";
        this.canvas.addEventListener('click', function (event) {
            _this.click(event);
        });
        document.addEventListener('keypress', function (event) {
            _this.keypress(event);
        });
        this.canvas.addEventListener('mousemove', function (event) {
            _this.draw(event);
        });
    }
    lines.prototype.init = function (boardSize) {
        this.points = 0;
        this.setPoints();
        this.lines = [];
        this.selection = null;
        if (boardSize == "#13x13") {
            this.lineLength = 3;
            this.originalSize = this.ySize = this.xSize = 11;
        }
        else {
            this.lineLength = 4;
            this.originalSize = this.ySize = this.xSize = 14;
        }
        this.board = [];
        for (var i = 0; i < this.xSize; i++) {
            this.board[i] = new Int8Array(this.ySize);
        }
        for (var x = 0; x < this.xSize; x++) {
            for (var y = 0; y < this.ySize; y++) {
                this.board[x][y] = 0;
            }
        }
        var location = 2;
        var size = this.lineLength * 2 + location;
        var cornerLower = this.lineLength - 1;
        var cornerUpper = (this.lineLength - 1) * 2;
        var range = cornerLower + cornerUpper + 1;
        for (var x = 0; x < range; x++) {
            for (var y = 0; y < range; y++) {
                if ((x < cornerLower && y < cornerLower) || (x < cornerLower && y > cornerUpper) ||
                    (x > cornerUpper && y < cornerLower) || (x > cornerUpper && y > cornerUpper)) {
                    continue;
                }
                this.board[x + location][y + location] = 1;
            }
        }
        this.draw(null);
    };
    lines.prototype.getMousePos = function (evt) {
        if (evt == null) {
            return null;
        }
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * this.canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * this.canvas.height
        };
    };
    lines.prototype.draw = function (evt) {
        var _this = this;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.lines.forEach(function (l) {
            _this.context.beginPath();
            _this.context.fillStyle = "#0000FF";
            _this.context.moveTo(_this.radius + _this.emptyScreenSpace * l.p1.x, _this.radius + _this.emptyScreenSpace * l.p1.y);
            _this.context.lineTo(_this.radius + _this.emptyScreenSpace * l.p2.x, _this.radius + _this.emptyScreenSpace * l.p2.y);
            _this.context.stroke();
        });
        for (var x = 0; x < this.xSize; x++) {
            for (var y = 0; y < this.ySize; y++) {
                this.context.beginPath();
                var value = this.board[x][y];
                if (value === 0) {
                    // Empty
                    this.context.fillStyle = "#aaaaaa";
                }
                else if (value === 1) {
                    // Dot
                    this.context.fillStyle = "#000000";
                }
                else if ((value & 4) & 4) {
                    // Selected dot
                    this.context.fillStyle = "#FF0000";
                }
                else {
                    this.context.fillStyle = "#000000";
                }
                this.context.ellipse(this.radius + this.emptyScreenSpace * x, this.radius + this.emptyScreenSpace * y, this.radius, this.radius, 0, 0, 2 * Math.PI, false);
                this.context.fill();
            }
        }
    };
    lines.prototype.click = function (evt) {
        var pos = this.getMousePos(evt);
        if (pos != null) {
            var x = Math.floor((this.radius + pos.x) / this.emptyScreenSpace + 0.5);
            var y = Math.floor((this.radius + pos.y) / this.emptyScreenSpace + 0.5);
            if (this.selection == null) {
                this.selection = new point(x, y);
                this.board[x][y] = this.board[x][y] | 4;
            }
            else {
                this.board[this.selection.x][this.selection.y] = this.board[this.selection.x][this.selection.y] ^ 4;
                var xStart = this.selection.x;
                var yStart = this.selection.y;
                var xEnd = x;
                var yEnd = y;
                var xDelta = xEnd - xStart;
                var yDelta = yEnd - yStart;
                var xStep = xDelta / this.lineLength;
                var yStep = yDelta / this.lineLength;
                var validMove = false;
                if (Math.abs(xDelta) == 0 && Math.abs(yDelta) == this.lineLength ||
                    Math.abs(xDelta) == this.lineLength && Math.abs(yDelta) == 0 ||
                    Math.abs(xDelta) == this.lineLength && Math.abs(yDelta) == this.lineLength) {
                    // Correct selection.
                    var xc = xStart;
                    var yc = yStart;
                    // Calculate if there are more than 1 empty
                    var empties = 0;
                    for (var i = 0; i <= this.lineLength; i++) {
                        if (this.board[xc][yc] == 0) {
                            empties++;
                        }
                        xc += xStep;
                        yc += yStep;
                    }
                    if (empties < 2) {
                        // Move is now valid unless we still find
                        // existing line for the same direction and
                        // using same point.
                        validMove = true;
                        var newLine1 = new line(new point(xStart, yStart), new point(xEnd, yEnd));
                        for (var i = 0; i < this.lines.length; i++) {
                            var l_1 = this.lines[i];
                            if (this.isPointInsideLine(l_1.p1, l_1.p2, newLine1.p1, newLine1.p2) ||
                                this.isPointInsideLine(l_1.p1, l_1.p2, newLine1.p2, newLine1.p1)) {
                                validMove = false;
                                break;
                            }
                        }
                    }
                }
                if (validMove) {
                    var xc = xStart;
                    var yc = yStart;
                    for (var i = 0; i <= this.lineLength; i++) {
                        this.board[xc][yc] = 1;
                        xc += xStep;
                        yc += yStep;
                    }
                    var l_2 = new line();
                    l_2.p1.x = x;
                    l_2.p1.y = y;
                    l_2.p2.x = this.selection.x;
                    l_2.p2.y = this.selection.y;
                    this.lines.push(l_2);
                    this.points++;
                    this.setPoints();
                    if (l_2.p1.y < 1 || l_2.p2.y < 1) {
                        this.resize(0, 1, 0, 1);
                    }
                    else if (l_2.p1.x < 1 || l_2.p2.x < 1) {
                        this.resize(1, 0, 1, 0);
                    }
                    else if (l_2.p1.y >= this.ySize - 1 || l_2.p2.y >= this.ySize - 1) {
                        this.resize(0, 1, 0, 0);
                    }
                    else if (l_2.p1.x >= this.xSize - 1 || l_2.p2.x >= this.xSize - 1) {
                        this.resize(1, 0, 0, 0);
                    }
                    this.selection = null;
                    window.appInsights.trackEvent("AddLine", { points: this.points, size: this.originalSize });
                }
                else {
                    this.selection = new point(x, y);
                    this.board[x][y] = this.board[x][y] | 4;
                }
            }
            this.draw(evt);
        }
    };
    lines.prototype.keypress = function (evt) {
        //console.log("keypress: " + evt.charCode);
    };
    lines.prototype.isPointInsideLine = function (l1, l2, t1, t2) {
        var xStep = (l2.x - l1.x) / this.lineLength;
        var yStep = (l2.y - l1.y) / this.lineLength;
        var xc = l1.x;
        var yc = l1.y;
        for (var i = 0; i <= this.lineLength; i++) {
            if (xc == t1.x && yc == t1.y) {
                // This point is in the line. But is that line for same direction.
                var deltaLX = l1.x - l2.x;
                var deltaLY = l1.y - l2.y;
                var deltaTX = t1.x - t2.x;
                var deltaTY = t1.y - t2.y;
                var dot = deltaLX * deltaTX + deltaLY * deltaTY;
                var lenL = Math.sqrt(deltaLX * deltaLX + deltaLY * deltaLY);
                var lenT = Math.sqrt(deltaTX * deltaTX + deltaTY * deltaTY);
                var a = dot / (lenL * lenT);
                // Okay round this to two decimals
                var r = Math.round(a * 100) / 100;
                var angle = Math.acos(r);
                if (Math.abs(angle) <= 0.1 || (angle >= Math.PI - 0.1 && angle <= Math.PI + 0.1)) {
                    return true;
                }
            }
            xc += xStep;
            yc += yStep;
        }
        return false;
    };
    lines.prototype.resize = function (xResize, yResize, xMove, yMove) {
        var tempBoard = [];
        for (var i = 0; i < this.xSize + xResize; i++) {
            tempBoard[i] = new Int8Array(this.ySize + yResize);
        }
        for (var x = 0; x < this.xSize + xResize; x++) {
            for (var y = 0; y < this.ySize + yResize; y++) {
                tempBoard[x][y] = 0;
            }
        }
        for (var x = 0; x < this.xSize; x++) {
            for (var y = 0; y < this.ySize; y++) {
                tempBoard[x + xMove][y + yMove] = this.board[x][y];
            }
        }
        this.board = tempBoard;
        this.lines.forEach(function (l) {
            l.p1.x += xMove;
            l.p2.x += xMove;
            l.p1.y += yMove;
            l.p2.y += yMove;
        });
        this.xSize += xResize;
        this.ySize += yResize;
        this.canvas.width += xResize * this.emptyScreenSpace;
        this.canvas.height += yResize * this.emptyScreenSpace;
    };
    lines.prototype.setPoints = function () {
        var text = "Lines: " + this.points;
        document.title = text;
        document.getElementById("points").innerText = text;
    };
    return lines;
}());
var l = new lines(document.getElementById("canvas"));
l.init(document.location.hash);
//# sourceMappingURL=lines.js.map