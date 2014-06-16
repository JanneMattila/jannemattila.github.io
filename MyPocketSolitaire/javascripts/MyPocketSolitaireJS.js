"use strict";
define(["require", "exports", "Board"], function(require, exports, BoardImport) {
    var Point = (function () {
        function Point() {
        }
        return Point;
    })();

    var BoardPieceView = (function () {
        function BoardPieceView() {
            this.point = new Point();
            this.velocity = new Point();
            this.size = new Point();
            this.image = new Image();
            this.isVisible = true;
            this.isHighlighted = false;
        }
        BoardPieceView.prototype.Draw = function (context) {
            if (this.isVisible === true) {
                if (this.isHighlighted === true) {
                    //context.fillStyle = "#FF00FA"; // EmptyMoveAvailable
                    //context.fillStyle = "#FFC38C"; // PreviousMoveFrom
                    context.fillStyle = "#FF8CC3"; // PreviousMoveTo
                    context.fillRect(this.point.x, this.point.y, this.size.x, this.size.y);
                } else {
                    context.fillStyle = "black";
                    context.fillRect(this.point.x, this.point.y, this.size.x, this.size.y);
                }

                context.drawImage(this.image, this.point.x, this.point.y, this.size.x, this.size.y);
            }
        };

        BoardPieceView.prototype.Update = function (elapsedTime) {
            //if (this.point.x > 0 || this.point.y > 0) {
            //    this.point.x--;
            //    this.point.y--;
            //    return true;
            //}
            return false;
        };
        return BoardPieceView;
    })();

    var BoardViewModel = (function () {
        function BoardViewModel(configuration) {
            this.boardPieces = new Array();
            this.boardMoveString = "";
            this.loading = 0;
            this.gameLoopInterval = 0;
            this.emptyImage = new Image();
            this.circleSetImage = new Image();
            this.circleEmptyImage = new Image();
            this.board = new BoardImport.Board();
            this.configuration = configuration;
        }
        BoardViewModel.prototype.Draw = function () {
            this.context.fillStyle = "black";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            var localContext = this.context;

            this.boardPieces.forEach(function (boardPiece) {
                boardPiece.Draw(localContext);
            });
        };

        BoardViewModel.prototype.Update = function () {
            var updatesOccurred = false;
            this.boardPieces.forEach(function (boardPiece) {
                var updateOccurred = boardPiece.Update(1);
                if (updateOccurred === true) {
                    updatesOccurred = true;
                }
            });

            return updatesOccurred;
        };

        BoardViewModel.prototype.InitializeGame = function (game, animateMoves) {
            if ((game.length % 2) === 0) {
                // Game length seems to be correct
                if (animateMoves === false) {
                    while (game.length > 0) {
                        this.board.MakeMoveFromString(game.substr(0, 2));
                        game = game.substr(2);
                    }
                } else {
                    this.boardMoveString = game;
                }

                return true;
            }

            return false;
        };

        BoardViewModel.prototype.MakeMove = function () {
            if (this.boardMoveString.length > 0) {
                // Update board according to given move string
                this.board.MakeMoveFromString(this.boardMoveString.substr(0, 2));
                this.boardMoveString = this.boardMoveString.substr(2);

                // Update view
                var i = 0;
                for (var y = 0; y < BoardImport.Board.BOARD_SIZE; y++) {
                    for (var x = 0; x < BoardImport.Board.BOARD_SIZE; x++) {
                        var boardPiece = this.board.Get(y, x);

                        if (boardPiece !== -1) {
                            var imageElement;
                            if (boardPiece === 1) {
                                imageElement = this.circleSetImage;
                            } else if (boardPiece === 0) {
                                imageElement = this.circleEmptyImage;
                            }

                            if (this.boardPieces[i].image != imageElement) {
                                this.boardPieces[i].image = imageElement;
                            }
                        }

                        i++;
                    }
                }

                return true;
            }

            return false;
        };

        BoardViewModel.prototype.Select = function (x, y) {
            var selected = false;
            this.boardPieces.forEach(function (boardPiece) {
                if (boardPiece.point.x <= x && boardPiece.point.y <= y && boardPiece.point.x + boardPiece.size.x >= x && boardPiece.point.y + boardPiece.size.y >= y) {
                    if (boardPiece.isHighlighted === false) {
                        selected = true;
                    }

                    boardPiece.isHighlighted = true;
                } else {
                    boardPiece.isHighlighted = false;
                }
            });

            return selected;
        };

        BoardViewModel.prototype.gameLoop = function () {
            var timeout = 10;

            // Update
            var gameLoopRequired = this.Update();

            if (gameLoopRequired === false) {
                // Make move if available
                if (this.MakeMove() === true) {
                    gameLoopRequired = true;
                    timeout = 1500;
                }
            }

            // Draw
            this.Draw();

            if (gameLoopRequired === true) {
                this.gameLoopInterval = setTimeout(this.gameLoop.bind(this), timeout);
            }
        };

        BoardViewModel.prototype.loadingResources = function () {
            this.loading++;
            if (this.loading === 2) {
                this.Draw();
                setTimeout(this.gameLoop.bind(this), 1500);
            }
        };

        BoardViewModel.prototype.LoadAndRun = function (canvas, caption) {
            caption.textContent = "";

            // create a new stage and point it at our canvas:
            var size = window.innerWidth * 0.95;
            if (window.innerHeight < size) {
                size = window.innerHeight * 0.95;
            }

            size = Math.floor(Math.min(size, this.configuration.maxCanvasSize));
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
            canvas.width = size;
            canvas.height = size;

            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            this.circleSetImage.onload = this.loadingResources.bind(this);
            this.circleEmptyImage.onload = this.loadingResources.bind(this);

            this.circleSetImage.src = "http://jannemattila.github.io/MyPocketSolitaire/images/CircleSet.png";
            this.circleEmptyImage.src = "http://jannemattila.github.io/MyPocketSolitaire/images/CircleEmpty.png";

            this.boardPieces.length = BoardImport.Board.BOARD_SIZE * BoardImport.Board.BOARD_SIZE;
            var i = 0;
            var pieceSize = Math.floor(size / (BoardImport.Board.BOARD_SIZE));
            for (var y = 0; y < BoardImport.Board.BOARD_SIZE; y++) {
                for (var x = 0; x < BoardImport.Board.BOARD_SIZE; x++) {
                    var boardPiece = this.board.Get(y, x);

                    var boardPieceView = new BoardPieceView();
                    boardPieceView.point.x = pieceSize * x;
                    boardPieceView.point.y = pieceSize * y;

                    boardPieceView.size.x = pieceSize;
                    boardPieceView.size.y = pieceSize;

                    if (boardPiece === 1) {
                        boardPieceView.image = this.circleSetImage;
                    } else if (boardPiece === 0) {
                        boardPieceView.image = this.circleEmptyImage;
                    } else {
                        boardPieceView.isVisible = false;
                    }

                    this.boardPieces[i] = boardPieceView;
                    i++;
                }
            }
        };
        return BoardViewModel;
    })();

    var Configuration = (function () {
        function Configuration() {
        }
        return Configuration;
    })();
    exports.Configuration = Configuration;

    function Run(configuration) {
        var canvas = document.getElementById(configuration.canvas);
        var caption = document.getElementById(configuration.caption);
        if (canvas === null || caption === null) {
            return;
        }

        // Validate configuration
        if (configuration.game == null) {
            configuration.game = "";
        }
        if (configuration.animateMoves == null) {
            configuration.animateMoves = false;
        }
        if (configuration.maxCanvasSize == null || configuration.maxCanvasSize <= 0) {
            configuration.maxCanvasSize = 600;
        }

        var boardViewModel = new BoardViewModel(configuration);
        boardViewModel.InitializeGame(configuration.game, configuration.animateMoves);
        boardViewModel.LoadAndRun(canvas, caption);
    }
    exports.Run = Run;
});
