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
    var points = [p1 || {x: 0, y: 0}, p2 || {x:1, y:0}];

    return calcCurve(points, generation)
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
            v = vector(a, b),
            o = orthogonal(v);
        next.push(a);
        next.push({x: a.x + v.x / 3, y: a.y + v.y /3 });
        next.push({x: a.x + v.x/2 + o.x*0.866/3, y: a.y + v.y/2 + o.y*0.866/3});
        next.push({x: a.x + v.x * 2/3, y: a.y + v.y * 2/3 });
    }
    next.push(points[points.length - 1]);

    return calcCurve(next, generation - 1);
}

function vector(from, to)
{
    return {
        x: to.x - from.x, 
        y: to.y - from.y
    };
}

function normalize(p)
{
    return {
        x: p.x / Math.sqrt(p.x*p.x + p.y*p.y),
        y: p.y / Math.sqrt(p.x*p.x + p.y*p.y)
    };
}

function orthogonal(p)
{
    return {
        x: -p.y,
        y: p.x
    };
}

function multiply(p, c)
{
    return {
        x: p.x * c,
        y: p.y * c
    };
}