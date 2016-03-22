'use strict';

var app = angular.module('app', []);

app.directive("drawing", function($timeout){
  return {
    restrict: "A",
    link: function(scope, element, attr){
        var ctx = element[0].getContext('2d');

        ctx.width = attr["width"];
        ctx.height = attr["height"];


        var obj = scope[attr["drawing"]];
        if(!obj || !obj.draw)
            throw new Error("Drawing: object undefined");
        
        obj.draw(ctx);
    }
  };
});


app.controller("mainController", ["$scope", function($scope){

    $scope.stepsCount = 1;
    $scope.fractal = {
        draw: function(context){
            var ctx = this.ctx =  context || this.ctx;

            var t = transformation2({
                            x:{min: 0, max: 1}, y: {min: 0, max: 1}
                        }, {
                            x:{min: 0, max: ctx.width /2}, y: {min: 0, max: ctx.width / 2}
                        });

            var curve = _(KochCurve($scope.stepsCount)),
                p1 = curve.map(t);

            console.log(curve);

            ctx.clearRect(0, 0, ctx.width, ctx.height);

            ctx.beginPath();
            ctx.translate(ctx.width/4, ctx.height * 0.3);
            ctx.scale(1, -1);
            drawCurve(p1);

            ctx.rotate(-Math.PI/3);
            ctx.scale(1, -1);
            drawCurve(p1);

            ctx.rotate(-Math.PI/3);
            ctx.translate(ctx.width / 2, 0);
            ctx.scale(1, -1);
            ctx.rotate(-Math.PI*2/3);
            drawCurve(p1);

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            function drawCurve(points)
            {
                var p0 = points[0];
                ctx.moveTo(p0.x, p0.y);
                for(var i = 1; i < points.length; i++)
                    ctx.lineTo(points[i].x, points[i].y);

                ctx.stroke(); 
            }
        }
    }
}]);

function transformation(from, to)
{
    var transform = function(x){
        var from = transform.from;
        var to = transform.to;
        return (x - from.min)/(from.max - from.min) * (to.max - to.min) + to.min;
    }
    
    transform.from = from;
    transform.to = to;

    return transform;
}

function transformation2(from, to)
{
    var transformX = transformation(from.x, to.x);
    var transformY = transformation(from.y, to.y);

    return function(p){
        return {
            x: transformX(p.x),
            y: transformY(p.y)
        };
    };
}


function KochCurve(generation, p1, p2)
{
    var points = [p1 || new Point(), p2 || new Point(1, 0)];

    return calcCurve(points, generation);
}

function calcCurve(points, generation)
{
    console.log(generation);
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

    console.log(next);
    return calcCurve(next, generation - 1);
}

(function (window){
    function Point(x, y){
        this.x = x || 0;
        this.y = y || 0;
    }

    Point.prototype.norm = function() {
        var p = this;
        return new Point( p.x / Math.sqrt(p.x*p.x + p.y*p.y),
                          p.y / Math.sqrt(p.x*p.x + p.y*p.y) );
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