// Note that the direction of the normal depends on the order of the vertices and
// assumes we are using the right-hand rule to determine an outward face.
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

function Plane(resolution)
{
    this.resolution = resolution;
    
    this.vertexArray = [];
    this.indexData = [];
    this.numVertices = 0;
    this.numIndices = 0;
    
    this.indexBuffer = 0,
    this.vertexBuffer = 0;
        
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
    
    /*this.generateVertices = function()
    {
        var positions = [];
        var normals = [];
        var uv = [];
    
        positions.push(vec4(-1.0,-1.0,0.0,1.0)); // left bottom
        uv.push(vec2(0,0));
        normals.push(vec3(0,0,0));
        this.numVertices++;
    
        positions.push(vec4(1.0,-1.0,0.0,1.0)); // right bottom
        uv.push(vec2(1,0));
        normals.push(vec3(0,0,0));
        this.numVertices++;
        
        positions.push(vec4(1.0,1.0,0.0,1.0)); // right top
        uv.push(vec2(1,1));
        normals.push(vec3(0,0,0));
        this.numVertices++;
       
        positions.push(vec4(-1.0,1.0,0.0,1.0)); // left top
        uv.push(vec2(0,1));
        normals.push(vec3(0,0,0));
        this.numVertices++;
  
  
        var first = 0;
        var second = 2;
        var third = 1;
        var fourth = 0;
        var fifth = 3;
        var sixth = 2;
  
        {
            var a = positions[first];
            var b = positions[second];
            var c = positions[third];
                
            var normal = computeNormal(a,b,c);
            normals[first] = add(normals[first],normal);
            normals[second] = add(normals[second],normal);
            normals[third] = add(normals[third],normal);
        }
        
        {
            var a = positions[fourth];
            var b = positions[fifth];
            var c = positions[sixth];
                
            var normal = computeNormal(a,b,c);
            console.log(flatten(normal));
            normals[fourth] = add(normals[fourth],normal);
            normals[fifth] = add(normals[fifth],normal);
            normals[sixth] = add(normals[sixth],normal);
        }
        
        
        this.indexData.push(first);
        this.indexData.push(second);
        this.indexData.push(third);
        this.indexData.push(fourth);
        this.indexData.push(fifth);
        this.indexData.push(sixth);
        this.numIndices += 6;
        
        
        
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
        
        console.log(this.numIndices);
        console.log(this.numVertices);
    }*/
    
    this.generateVertices = function()
    {
        var positions = [];
        var normals = [];
        var uv = [];
    
        var xStep = 2.0 / (this.resolution);
        var yStep = 2.0 / (this.resolution);
        
        var uStep = 1.0 / (this.resolution);
        var vStep = 1.0 / (this.resolution);
    
        var uIdx = 0;    
        for (var xIdx = 0; xIdx < this.resolution; xIdx++)
        {
            var vIdx = 0;
            for (var yIdx = 0; yIdx < this.resolution; yIdx++)
            {
                var xStart = -1.0 + xStep*xIdx;
                var xStop = -1.0 + xStep*(xIdx+1);
                
                var yStart = -1.0 + yStep*yIdx;
                var yStop = -1.0 + yStep*(yIdx+1);
                
                var uStart = 0.0 + uStep*uIdx;
                var uStop = 0.0 + uStep*(uIdx+1);
                
                var vStart = 0.0 + vStep*vIdx;
                var vStop = 0.0 + vStep*(vIdx+1);
                
                if ((yIdx+1) == this.resolution)
                {
                    vStop = 1.0;
                }
                if ((xIdx+1) == this.resolution)
                {
                    uStop = 1.0;
                }
                            
                positions.push(vec4(xStart,yStart,0.0,1.0)); // left bottom
                uv.push(vec2(uStart,vStart));
                normals.push(vec3(0,0,0));
                this.numVertices++;
            
                positions.push(vec4(xStop,yStart,0.0,1.0)); // right bottom
                uv.push(vec2(uStop,vStart));
                normals.push(vec3(0,0,0));
                this.numVertices++;
                
                positions.push(vec4(xStop,yStop,0.0,1.0)); // right top
                uv.push(vec2(uStop,vStop));
                normals.push(vec3(0,0,0));
                this.numVertices++;
               
                positions.push(vec4(xStart,yStop,0.0,1.0)); // left top
                uv.push(vec2(uStart,vStop));
                normals.push(vec3(0,0,0));
                this.numVertices++;
                vIdx++;
            }
            uIdx++;
        }
    
        var indexOffset = 0;
        for (var xIdx = 0; xIdx < this.resolution; xIdx++)
        {
            for (var yIdx = 0; yIdx < this.resolution; yIdx++)
            {                
                var first = 0 + indexOffset;
                var second = 1 + indexOffset;
                var third = 2 + indexOffset;
                var fourth = 2 + indexOffset;
                var fifth = 3 + indexOffset;
                var sixth = 0 + indexOffset;
                
                {
                    var a = positions[first];
                    var b = positions[second];
                    var c = positions[third];
                        
                    var normal = computeNormal(a,b,c);
                    normals[first] = add(normals[first],normal);
                    normals[second] = add(normals[second],normal);
                    normals[third] = add(normals[third],normal);
                }
                
                {
                    var a = positions[fourth];
                    var b = positions[fifth];
                    var c = positions[sixth];
                        
                    var normal = computeNormal(a,b,c);
                    normals[fourth] = add(normals[fourth],normal);
                    normals[fifth] = add(normals[fifth],normal);
                    normals[sixth] = add(normals[sixth],normal);
                }
                
                
                this.indexData.push(first);
                this.indexData.push(second);
                this.indexData.push(third);
                this.indexData.push(fourth);
                this.indexData.push(fifth);
                this.indexData.push(sixth);
                this.numIndices += 6;
                
                indexOffset += 4;
            }
        }
         
        
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