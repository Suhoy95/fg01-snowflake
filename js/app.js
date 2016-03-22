'use strict';

var app = angular.module('app', []);

app.directive("drawing", function($timeout){
  return {
    restrict: "A",
    link: function(scope, element, attr){
        var ctx = element[0].getContext('2d');

        ctx.width = attr["width"];
        ctx.height = attr["height"];

        ctx.transform(1, 0, 0, -1, ctx.width / 2, ctx.height / 2);
        scope.draw(ctx);
    }
  };
});


app.controller("mainController", ["$scope", function($scope){
    $scope.clearCanvas = true;
    $scope.stepsCount = 1;
    $scope.n = 3;
    $scope.fi = Math.PI / 6;
    $scope.maxFi = maxFi(3)
    $scope.r = 200;
    $scope.maxR = maxR(3);
    $scope.curvePoints = KochCurve($scope.stepsCount);

    $scope.update = function(){
        this.maxFi = maxFi(this.n);
        this.fi = Math.min(this.fi, this.maxFi);
        this.maxR = maxR(this.n);
        this.r = Math.min(this.r, this.maxR);
        this.draw();
    }

    $scope.recalc = function(){
        this.curvePoints = KochCurve($scope.stepsCount);
        this.update();
    }

    function maxFi(n){
        return 2*Math.PI / n;
    }

    function maxR(n){
        return 200 + 2.0 / 3 * 200 * Math.sin(Math.PI / n) * Math.sin(Math.PI / 3);
    }
    
    $scope.draw = function(context){
        var ctx = this.ctx = context || this.ctx;
        var points = this.curvePoints;
        if(this.clearCanvas)
            ctx.clearRect(-ctx.width/2, -ctx.height/2, ctx.width, ctx.height);
    
        for(var i = 0; i < this.n; i++){
            ctx.save();
            var a = new Point(this.r * Math.cos(this.fi + i * 2*Math.PI/this.n),
                              this.r * Math.sin(this.fi + i * 2*Math.PI/this.n) );

            var b = new Point(this.r * Math.cos(this.fi + ((i + 1) % this.n) * 2*Math.PI/this.n),
                              this.r * Math.sin(this.fi + ((i + 1) % this.n) * 2*Math.PI/this.n) );
            var ox = a.vectorTo(b),
                oy = ox.orthoR();
            ctx.transform(ox.x, ox.y, oy.x, oy.y, a.x, a.y);

            ctx.beginPath();
            ctx.lineWidth = 1.0 / ox.length();
            drawCurve();
            ctx.restore();
        }

        function drawCurve(){
            ctx.beginPath();
            
            for(var i = 0; i < points.length; i++)
                ctx.lineTo(points[i].x, points[i].y);

            ctx.stroke(); 
        }
    }


}]);

function KochCurve(generation, p1, p2)
{
    var points = [p1 || new Point(), p2 || new Point(1, 0)];

    return calcCurve(points, generation);
}

function calcCurve(points, generation)
{
    if(generation <= 0)
        return points;

    var next = [];
    for(var i = 0; i < points.length - 1; i++)
    {
        var a = points[i],
            b = points[i + 1],
            v = a.vectorTo(b),
            o = v.orthoL();
        next.push(a);
        next.push( a.plus( v.multy(1/3.0)) );
        next.push( a.plus( v.multy(1/2.0)).plus( o.multy(0.866/3)) );
        next.push( a.plus( v.multy(2/3.0)) );
    }
    next.push(points[points.length - 1]);

    return calcCurve(next, generation - 1);
}

(function (window){
    function Point(x, y){
        this.x = x || 0;
        this.y = y || 0;
    }

    Point.prototype.length = function() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    Point.prototype.norm = function() {
        return new Point( this.x / this.length(),
                          this.y / this.length() );
    };

    Point.prototype.vectorTo = function(to) {
        var from = this;
        return new Point( to.x - from.x, 
                          to.y - from.y);
    };

    Point.prototype.orthoL = function() {
        return new Point(-this.y, this.x);
    };

    Point.prototype.orthoR = function() {
        return new Point(this.y, -this.x);
    };

    Point.prototype.plus = function(b) {
        var a = this;
        return new Point(a.x + b.x, a.y + b.y);
    };

    Point.prototype.multy = function(c) {
        return new Point(this.x * c, this.y * c);
    };

    window.Point = Point;
})(window);