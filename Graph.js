function Graph(div) {
    //set a canvas
    var canvas = document.createElement('canvas');
    var borderWidth = div.style.borderWidth.replace('px', '');
    var width = div.offsetWidth - borderWidth * 2;
    var height = div.offsetHeight - borderWidth * 2;
    //canvas.style.border = 'solid green 1px';    
    canvas.width = width;
    canvas.height = height;

    //set resize and focus listener
    canvas.resizeEvent = resizeEvent;
    canvas.checkMinSize = checkMinSize;
    window.addEventListener('focus', render);        

    //add the canvas to the div
    div.appendChild(canvas)

    //getting drawing context
    var ctx = canvas.getContext('2d');
    
    //set the ctx
    ctx.textBaseline = 'middle';

    //set default axises
    var axisX = { min: 0, max: 10, step: 1, margin: 50, range: 10, coeff: width / 10 };
    var axisY = { min: 0, max: 10, step: 1, margin: 100, range: 10, coeff: height / 10 };

    //set diagrams
    var diagrams = {};  //color - data        

    //public functions
    this.addDiagram = function(color, data, quality, lineWidth) {
        if (!color || typeof data != 'object' || typeof quality != 'number' || typeof width != 'number' || typeof data[0] != 'number') return false; //Strong security :)        
        diagrams[color] = {
            data: data,
            quality: quality,
            lineWidth: lineWidth
        };
        if (Object.keys(diagrams).length == 1) {
            changeRangeY(getMinAndMaxY(data));
            changeRangeX([0, data.length]);
            updateAxisesRanges();
        }
        else fitForMaxRange();
        render();
    }

    //private functions
    function render() {
        ctx.clearRect(0, 0, width, height);        

        //draw axises        
        var ax1 = [axisX.margin / 5, height - axisY.margin / 4];
        var ax2 = [axisX.margin + axisX.max*axisX.coeff, height - axisY.margin / 4];

        var ay1 = [axisX.margin / 2, height - (axisY.margin + (axisY.max-axisY.min) * axisY.coeff-5)];
        var ay2 = [axisX.margin / 2, height - axisY.margin/6];

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(ax1[0], ax1[1]);
        ctx.lineTo(ax2[0], ax2[1]);
        ctx.moveTo(ay1[0], ay1[1]);
        ctx.lineTo(ay2[0], ay2[1]);
        ctx.stroke();
        
        //draw axisX
        ctx.strokeStyle = 'lightgray';        
        var step = axisX.step;
        var minimum = 15;
        const limit = 5;
        var counter = 0;
        
        if (minimum > step * axisX.coeff)        
            do{
                step = step * 2;
                counter++;                
            }while(step * axisX.coeff < minimum && counter < limit);
        
        ctx.beginPath();
        for (var i = axisX.min; i <= axisX.max; i += step){
            var size = 5;
            var y1 = height - axisY.margin/4 - size/2;
            var y2 = axisY.margin/4 + size/2;
            var x = i * axisX.coeff + axisX.margin;
            ctx.moveTo(x,y1);
            ctx.lineTo(x,y2);
            if (i % 2 == 0) {
                var textWidth = ctx.measureText(i).width;                
                ctx.fillText(i,x-textWidth/2,height-axisY.margin/7);
            }                        
        }
        ctx.stroke();
        
        //draw axisY
        step = axisY.step; 
        counter = 0;
              
        if (minimum > step * axisY.coeff)        
            do{
                step = step * 2;
                counter++;                
            }while(step * axisY.coeff < minimum && counter < limit);        
        
        ctx.beginPath();
        for (var i = 0; i <= axisY.max - axisY.min + step; i += step){
            var size = 5;
            var x1 = axisX.margin/2 - size/2;
            var x2 = width-axisX.margin/2 + size/2;
            var y = height - i * axisY.coeff - axisY.margin/2;
            ctx.moveTo(x1,y);
            ctx.lineTo(x2,y);     
            if (i % 2 == 0) {
                var textWidth = ctx.measureText((i+axisY.min)).width;                
                ctx.fillText((i+axisY.min),axisX.margin/2-textWidth-5,y);
            }                      
        }
        ctx.stroke();
        
        //draw diagrams
        for (var d in diagrams) {
            var dia = diagrams[d];
            ctx.strokeStyle = d;
            ctx.lineWidth = dia.lineWidth;
            ctx.beginPath();
            ctx.arc(axisX.margin, calcY(dia.data[0]), 5, 0, Math.PI * 2);
            ctx.moveTo(axisX.margin, calcY(dia.data[0]));
            for (var i = 1; i < dia.data.length; i += dia.quality) {
                var x = calcX(i);
                var y = calcY(dia.data[i]);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.moveTo(x, y);
                ctx.stroke();
            }
            ctx.lineTo(calcX(dia.data.length - 1), calcY(dia.data[dia.data.length - 1]));
            ctx.stroke();
        }
    }

    function changeRangeX(ranges) {
        axisX.min = ranges[0];
        axisX.max = ranges[1];
    }

    function changeRangeY(ranges) {
        axisY.min = ranges[0];
        axisY.max = ranges[1];
    }

    function fitForMaxRange() {
        var xr = [0, diagrams[Object.keys(diagrams)[0]].data.length]; //min,max
        var yr = [diagrams[Object.keys(diagrams)[0]].data[0], diagrams[Object.keys(diagrams)[0]].data[0]];
        for (var d in diagrams) {
            var xr2 = [0, diagrams[d].data.length];
            var yr2 = getMinAndMaxY(diagrams[d].data);
            if (xr2[0] < xr[0]) xr[0] = xr2[0];
            if (xr2[1] > xr[1]) xr[1] = xr2[1];
            if (yr2[0] < yr[0]) yr[0] = yr2[0];
            if (yr2[1] > yr[1]) yr[1] = yr2[1];
        }
        changeRangeX(xr);
        changeRangeY(yr);
        updateAxisesRanges();
    }

    function getRange(data) {
        var min = data[0];
        var max = data[0];
        for (var d in data) {
            if (data[d] > max) max = data[d];
            if (data[d] < min) min = data[d];
        }
        return Math.abs(min) + Math.abs(max);
    }

    function getMinAndMaxY(data) {
        var min = data[0];
        var max = data[0];
        for (var d in data) {
            if (data[d] > max) max = data[d];
            if (data[d] < min) min = data[d];
        }
        return [min, max];
    }

    function calcY(value) {
        return (axisY.max - value) * axisY.coeff + axisY.margin / 2
    }
    function calcX(value) {
        return value * axisX.coeff + axisX.margin
    }

    function updateAxisesRanges() {
        axisX.range = axisX.max - axisX.min;
        axisY.range = axisY.max - axisY.min;
        axisX.coeff = (width - axisX.margin - 10) / axisX.range;
        axisY.coeff = (height - axisY.margin) / axisY.range;
    }

    function resizeEvent() {
        if ((div.offsetWidth - borderWidth * 2 - axisX.margin - 10) / axisX.range < 1 || (div.offsetHeight - borderWidth * 2 - axisY.margin) / axisY.range < 1) return false;
        
        borderWidth = div.style.borderWidth.replace('px', '');
        width = div.offsetWidth - borderWidth * 2;
        height = div.offsetHeight - borderWidth * 2;
        canvas.width = width;
        canvas.height = height;

        fitForMaxRange();
        updateAxisesRanges();
        render();
    }
    
    function checkMinSize(w,h){                                
        return [((w - borderWidth * 2 - axisX.margin - 10) / axisX.range > 1), ((h - borderWidth * 2 - axisY.margin) / axisY.range > 1)];
    }
}