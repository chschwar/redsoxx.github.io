function computeNormal(a,b,c)
{
    // https://www.opengl.org/wiki/Calculating_a_Surface_Normal
    
    var u4 = subtract(b,a);
    var v4 = subtract(c,a);
    
    var u = vec3(u4[0],u4[1],u4[2]);
    var v = vec3(v4[0],v4[1],v4[2]);
    
    var n = cross(u,v);
    //console.log(n);
    return normalize( n );
}

function Cone(resolution, noBottom = false)
{
    this.height = 2.0;
    this.radius = 1.0;
    this.resolution = resolution;
    
    this.vertexArray = [];
    this.indexData = [];
    this.numVertices = 0;
    this.numIndices = 0;
    
    this.indexBuffer = 0,
    this.vertexBuffer = 0;
    this.noBottom = noBottom;
        
    this.destroy = function()
    {
        if (0 != this.vertexBuffer && 0 != this.indexBuffer)
        {
            gl.deleteBuffer(this.vertexBuffer);
            gl.deleteBuffer(this.indexBuffer);
        }
        this.vertexBuffer = 0;
        this.indexBuffer = 0;
        this.vertexArray = [];
        this.indexData = [];
    }
    
    this.initialize = function()
    { 
        this.generateVertices();
        this.initBuffers();      
    }
    
    this.generateVertices = function()
    {
        var fractions = [ 0, 0.5, 0.75, 0.875, 0.9375 ];
    
        var positions = [];
        var normals = [];
        var uv = [];
    
        var normallength = Math.sqrt(this.height*this.height+this.radius*this.radius);
        var n1 = this.height/normallength;
        var n2 = this.radius/normallength; 
    
        var step = (Math.PI * 2.0) / this.resolution;
        var angle = 0.0;
        
        for (var fractionIdx = 0; fractionIdx < fractions.length; fractionIdx++)
        {
            var uoffset = (fractionIdx%2 == 0 ? 0:0.5);
            
            for (var idx = 0; idx <= this.resolution; idx++)
            {
                var h1 = -this.height/2 + fractions[fractionIdx]*this.height;
                var u = (idx+uoffset)*step;
                var c = Math.cos(u);
                var s = Math.sin(u);
                
                positions.push(
                    vec4(
                        c*this.radius*(1-fractions[fractionIdx]),
                        s*this.radius*(1-fractions[fractionIdx]),
                        h1,
                        1.0
                    )
                );
                normals.push(
                    vec3(
                        c*n1,
                        s*n1,
                        n2
                    )
                );
                
                uv.push(vec2((idx+uoffset)/this.resolution, fractions[fractionIdx]));
            }
        }
        
        
        for (var j = 0; j < fractions.length-1; j++) 
        {
            var row1 = j*(this.resolution+1);
            var row2 = (j+1)*(this.resolution+1);
            for (var i = 0; i < this.resolution; i++) 
            {
                this.indexData.push(row1 + i);
                this.indexData.push(row2 + i + 1);
                this.indexData.push(row2 + i);
                this.indexData.push(row1 + i);
                this.indexData.push(row1 + i + 1);
                this.indexData.push(row2 + i + 1);
            }
        }
        
        var start = positions.length - (this.resolution+1);
        for (var i = 0; i < this.resolution; i++) 
        { // slices points at top, with different normals, texcoords
            var u = (i+0.5)*step;
            var c = Math.cos(u);
            var s = Math.sin(u);
            
            positions.push(
                vec4(
                    0,
                    0,
                    this.height/2,
                    1.0
                )
            );
            
            normals.push(
                vec3(
                    c*n1,
                    s*n1,
                    n2
                )
            );

            uv.push(vec2((i+0.5)/this.resolution,1));
        }
        
        
        for (var i = 0; i < this.resolution; i++) 
        {
            this.indexData.push(start+i);
            this.indexData.push(start+i+1);
            this.indexData.push(start+(this.resolution+1)+i);
        }
        
        if (!this.noBottom) 
        {
            var startIndex = positions.length;
            
            positions.push(
                vec4(
                    0,
                    0,
                    -this.height/2,
                    1.0
                )
            );            
            normals.push(
                vec3(
                    0,
                    0,
                    -1
                )
            );
            uv.push(vec2(0.5,0.5));           

            for (var i = 0; i <= this.resolution; i++) 
            {
                u = 2*Math.PI - i*step;
                var c = Math.cos(u);
                var s = Math.sin(u);
                
                positions.push(
                    vec4(
                        c*this.radius,
                        s*this.radius,
                        -this.height/2,
                        1.0
                    )
                );
                
                normals.push(
                    vec3(
                        0,
                        0,
                        -1
                    )
                );

                uv.push(vec2(0.5 - 0.5*c,0.5 + 0.5*s));
            }
            for (var i = 0; i < this.resolution; i++) 
            {
                this.indexData.push(startIndex);
                this.indexData.push(startIndex+i+1);
                this.indexData.push(startIndex+i+2);
            }
        } 
        
        this.numIndices = this.indexData.length;
        this.numVertices = positions.length;
                
        for (var i = 0; i < normals.length; ++i)
        {
            normals[i] = normalize(normals[i]);
            
            this.vertexArray.push(positions[i]);
            this.vertexArray.push(uv[i]);
            this.vertexArray.push(normals[i]);
        }
        uv = [];
        normals = [];
        positions = [];
    }
    
    this.initBuffers = function()
    {        
        this.vertexBuffer = gl.createBuffer();       
        this.bind();
        this.indexBuffer = gl.createBuffer();
        this.bindIndexBuffer();        
        this.unbindIndexBuffer();
        this.unbind();
    }
    
    this.render = function()
    {
        this.bind();
        this.bindIndexBuffer();
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        this.unbindIndexBuffer();
        this.unbind();
        
    }
    
    this.enableAttributes = function()
    {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertexArray), gl.STATIC_DRAW);        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vUv);
        gl.enableVertexAttribArray(vNormal);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 9*4, 0);
        gl.vertexAttribPointer(vUv, 2, gl.FLOAT, false, 9*4, 4*4);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 9*4, 6*4);
        
        
    }
    
    this.drawElementArrayBuffer = function()
    {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
    }
    
    
    this.renderDump = function()
    {
        this.bind();
        this.enableAttributes();
        this.bindIndexBuffer();
        this.drawElementArrayBuffer();
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        this.unbindIndexBuffer();
        this.unbind();
    }
    
    this.bind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    }
    
    this.bindIndexBuffer = function()
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }
    
    this.unbind = function()
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    this.unbindIndexBuffer = function()
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}